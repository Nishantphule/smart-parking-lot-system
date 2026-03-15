import { Vehicle } from '../models/Vehicle';
import { ParkingSpot } from '../models/ParkingSpot';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { RepositoryFactory } from '../repository/RepositoryFactory';
import { IVehicleRepository } from '../repository/IVehicleRepository';
import { IParkingSpotRepository } from '../repository/IParkingSpotRepository';
import { ITransactionRepository } from '../repository/ITransactionRepository';
import { ParkingOperationAbstraction } from '../patterns/bridge/ParkingOperationAbstraction';
import { FeeCalculator } from '../patterns/strategy/FeeCalculator';
import { VehicleFactory } from '../patterns/factory/VehicleFactory';
import { VehicleType } from '../models/Vehicle';
import { validateLicensePlate, validateVehicleType } from '../utils/validation';

/**
 * Generate a proper UUID v4 for transaction IDs
 * Uses crypto.randomUUID if available, otherwise falls back to manual generation
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (Node.js 14.17.0+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older Node.js versions
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Result of check-in operation
 */
export interface CheckInResult {
  success: boolean;
  vehicle?: Vehicle;
  spot?: ParkingSpot;
  transaction?: Transaction;
  error?: string;
}

/**
 * Result of check-out operation
 */
export interface CheckOutResult {
  success: boolean;
  transaction?: Transaction;
  fee?: number;
  error?: string;
}

/**
 * Main Parking Lot Service
 * Handles all parking operations with concurrency support
 * Uses Bridge pattern for spot allocation and Strategy pattern for fee calculation
 */
export class ParkingLotService {
  private vehicleRepo: IVehicleRepository;
  private spotRepo: IParkingSpotRepository;
  private transactionRepo: ITransactionRepository;
  private parkingOperation: ParkingOperationAbstraction;
  private feeCalculator: FeeCalculator;
  private locks: Map<string, Promise<void>> = new Map();

  constructor(parkingOperation: ParkingOperationAbstraction) {
    // Use RepositoryFactory to get appropriate repositories (MongoDB or In-Memory)
    this.vehicleRepo = RepositoryFactory.createVehicleRepository();
    this.spotRepo = RepositoryFactory.createParkingSpotRepository();
    this.transactionRepo = RepositoryFactory.createTransactionRepository();
    this.parkingOperation = parkingOperation;
    this.feeCalculator = new FeeCalculator();
    
    const storageType = RepositoryFactory.getStorageType();
    console.log(`📦 Using ${storageType} storage`);
  }

  /**
   * Acquire a lock for a resource (for concurrency control)
   */
  private async acquireLock(resourceId: string): Promise<() => void> {
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    const existingLock = this.locks.get(resourceId);
    if (existingLock) {
      await existingLock;
    }

    this.locks.set(resourceId, lockPromise);
    return () => {
      this.locks.delete(resourceId);
      release!();
    };
  }

  /**
   * Find and reserve a spot atomically with database-level locking
   * This ensures spot assignment is protected at the data layer
   */
  private async findAndReserveSpotAtomically(vehicle: Vehicle): Promise<ParkingSpot | null> {
    // Get available spots
    const availableSpots = await this.spotRepo.findAvailableSpotsBySize(vehicle.getRequiredSpotSize());
    
    if (availableSpots.length === 0) {
      return null;
    }

    // Use allocation strategy to select spot
    const selectedSpot = this.parkingOperation.allocateSpot(availableSpots, vehicle);
    
    if (!selectedSpot) {
      return null;
    }

    // Atomically reserve the spot using database-level operation
    // For MongoDB: Use findOneAndUpdate with status check
    // For In-Memory: Use the same pattern for consistency
    const reservedSpot = await this.spotRepo.reserveSpotAtomically(selectedSpot.id, vehicle.id);
    
    return reservedSpot;
  }

  /**
   * Check-in a vehicle (thread-safe with database-level locking)
   */
  async checkIn(licensePlate: string, vehicleType: string): Promise<CheckInResult> {
    // Input validation
    const plateValidation = validateLicensePlate(licensePlate);
    if (!plateValidation.valid) {
      return {
        success: false,
        error: plateValidation.error || 'Invalid license plate'
      };
    }

    const typeValidation = validateVehicleType(vehicleType);
    if (!typeValidation.valid) {
      return {
        success: false,
        error: typeValidation.error || 'Invalid vehicle type'
      };
    }

    const lockKey = `checkin-${licensePlate}`;
    const releaseLock = await this.acquireLock(lockKey);

    try {
      // Check if vehicle is already parked
      const existingVehicle = await this.vehicleRepo.findByLicensePlate(licensePlate.trim());
      if (existingVehicle && existingVehicle.entryTime && !existingVehicle.exitTime) {
        const existingTransaction = await this.transactionRepo.findByVehicleId(existingVehicle.id);
        if (existingTransaction && existingTransaction.status === TransactionStatus.ACTIVE) {
          releaseLock();
          return {
            success: false,
            error: `Vehicle ${licensePlate} is already parked`
          };
        }
      }

      // Create or get vehicle
      let vehicle: Vehicle;
      if (existingVehicle && !existingVehicle.exitTime) {
        vehicle = existingVehicle;
      } else {
        const type = typeValidation.type!; // Already validated above
        const newVehicle = VehicleFactory.createVehicle(licensePlate.trim(), type, new Date());
        // Save will upsert based on license plate, handling concurrent operations
        const savedResult = this.vehicleRepo.save(newVehicle);
        vehicle = savedResult instanceof Promise ? await savedResult : savedResult;
      }

      // Find and reserve spot atomically using database-level locking
      const allocatedSpot = await this.findAndReserveSpotAtomically(vehicle);

      if (!allocatedSpot) {
        releaseLock();
        return {
          success: false,
          error: 'No available parking spots for this vehicle type'
        };
      }

      // Update vehicle entry time
      vehicle.entryTime = new Date();
      await this.vehicleRepo.save(vehicle);

      // Create transaction
      const transaction = new Transaction(
        `TXN-${generateUUID()}`,
        vehicle.id,
        allocatedSpot.id,
        vehicle.entryTime
      );
      await this.transactionRepo.save(transaction);

      releaseLock();
      return {
        success: true,
        vehicle,
        spot: allocatedSpot,
        transaction
      };
    } catch (error) {
      releaseLock();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during check-in'
      };
    }
  }

  /**
   * Check-out a vehicle (thread-safe)
   */
  async checkOut(licensePlate: string): Promise<CheckOutResult> {
    const lockKey = `checkout-${licensePlate}`;
    const releaseLock = await this.acquireLock(lockKey);

    try {
      // Find vehicle
      const vehicle = await this.vehicleRepo.findByLicensePlate(licensePlate);
      if (!vehicle || !vehicle.entryTime || vehicle.exitTime) {
        releaseLock();
        return {
          success: false,
          error: `Vehicle ${licensePlate} is not currently parked`
        };
      }

      // Find active transaction
      const transaction = await this.transactionRepo.findByVehicleId(vehicle.id);
      if (!transaction || transaction.status !== TransactionStatus.ACTIVE) {
        releaseLock();
        return {
          success: false,
          error: `No active transaction found for vehicle ${licensePlate}`
        };
      }

      // Find and free the spot
      const spot = await this.spotRepo.findById(transaction.spotId);
      if (spot) {
        spot.free();
        await this.spotRepo.save(spot);
      }

      // Calculate fee using Strategy pattern
      const exitTime = new Date();
      
      // Update vehicle exit time FIRST before calculating duration
      vehicle.exitTime = exitTime;
      await this.vehicleRepo.save(vehicle);

      // Update transaction exit time before calculating duration
      transaction.exitTime = exitTime;
      
      // Now calculate duration with correct exit time
      const hours = transaction.getDurationInHours();
      const fee = this.feeCalculator.calculateFee(vehicle.type, hours);

      // Complete transaction with calculated fee
      transaction.complete(exitTime, fee);
      await this.transactionRepo.save(transaction);

      releaseLock();
      return {
        success: true,
        transaction,
        fee
      };
    } catch (error) {
      releaseLock();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during check-out'
      };
    }
  }

  /**
   * Initialize parking spots (for setup/testing)
   */
  async initializeSpots(spots: ParkingSpot[]): Promise<void> {
    await Promise.all(spots.map(spot => this.spotRepo.save(spot)));
  }

  /**
   * Get parking lot availability
   */
  async getAvailability(): Promise<{
    total: number;
    available: number;
    occupied: number;
    bySize: Record<string, { total: number; available: number }>;
  }> {
    const allSpots = await this.spotRepo.findAll();
    const availableSpots = await this.spotRepo.findAvailableSpots();
    const occupiedSpots = await this.spotRepo.findOccupiedSpots();

    const bySize: Record<string, { total: number; available: number }> = {};
    
    for (const spot of allSpots) {
      const sizeKey = spot.size;
      if (!bySize[sizeKey]) {
        bySize[sizeKey] = { total: 0, available: 0 };
      }
      bySize[sizeKey].total++;
      if (spot.isAvailable()) {
        bySize[sizeKey].available++;
      }
    }

    return {
      total: allSpots.length,
      available: availableSpots.length,
      occupied: occupiedSpots.length,
      bySize
    };
  }

  /**
   * Get current allocation strategy
   */
  getAllocationStrategy(): string {
    return this.parkingOperation.getCurrentStrategy();
  }

  /**
   * Change allocation strategy
   */
  setAllocationStrategy(implementor: import('../patterns/bridge/ParkingOperationImplementor').ParkingOperationImplementor): void {
    this.parkingOperation.setImplementor(implementor);
  }
}
