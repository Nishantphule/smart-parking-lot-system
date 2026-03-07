import { ParkingSpot } from '../../models/ParkingSpot';
import { Vehicle } from '../../models/Vehicle';

/**
 * Implementor interface for Bridge pattern
 * Defines the interface for concrete implementations of parking operations
 */
export interface ParkingOperationImplementor {
  /**
   * Find an available parking spot for a vehicle
   * @param spots - Array of parking spots to search
   * @param vehicle - Vehicle that needs a spot
   * @returns Parking spot or null if none available
   */
  findAvailableSpot(spots: ParkingSpot[], vehicle: Vehicle): ParkingSpot | null;

  /**
   * Get the name of the allocation strategy
   */
  getStrategyName(): string;
}
