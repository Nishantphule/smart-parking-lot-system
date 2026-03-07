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

// Simple UUID generator
function generateUUID(): string {
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
   * Check-in a vehicle (thread-safe)
   */
  async checkIn(licensePlate: string, vehicleType: string): Promise<CheckInResult> {
    const lockKey = `checkin-${licensePlate}`;
    const releaseLock = await this.acquireLock(lockKey);

    try {
      // Check if vehicle is already parked
      const existingVehicle = await this.vehicleRepo.findByLicensePlate(licensePlate);
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
        const type = VehicleType[vehicleType as keyof typeof VehicleType] || VehicleType.CAR;
        const newVehicle = VehicleFactory.createVehicle(licensePlate, type, new Date());
        // Save will upsert based on license plate, handling concurrent operations
        const savedResult = this.vehicleRepo.save(newVehicle);
        vehicle = savedResult instanceof Promise ? await savedResult : savedResult;
      }

      // Find available spot using Bridge pattern
      const availableSpots = await this.spotRepo.findAvailableSpotsBySize(vehicle.getRequiredSpotSize());
      const allocatedSpot = this.parkingOperation.allocateSpot(availableSpots, vehicle);

      if (!allocatedSpot) {
        releaseLock();
        return {
          success: false,
          error: 'No available parking spots for this vehicle type'
        };
      }

      // Occupy the spot
      allocatedSpot.occupy(vehicle.id);
      await this.spotRepo.save(allocatedSpot);

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
      const hours = transaction.getDurationInHours();
      const fee = this.feeCalculator.calculateFee(vehicle.type, hours);

      // Update vehicle
      vehicle.exitTime = exitTime;
      await this.vehicleRepo.save(vehicle);

      // Complete transaction
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
  setAllocationStrategy(implementor: any): void {
    this.parkingOperation.setImplementor(implementor);
  }
}
