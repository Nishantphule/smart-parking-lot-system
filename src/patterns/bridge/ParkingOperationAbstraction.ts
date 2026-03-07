import { ParkingSpot } from '../../models/ParkingSpot';
import { Vehicle } from '../../models/Vehicle';
import { ParkingOperationImplementor } from './ParkingOperationImplementor';

/**
 * Abstraction for Bridge pattern
 * Defines the high-level interface for parking operations
 * Uses composition to delegate to concrete implementations
 */
export class ParkingOperationAbstraction {
  constructor(protected implementor: ParkingOperationImplementor) {}

  /**
   * Set a new implementation strategy
   */
  setImplementor(implementor: ParkingOperationImplementor): void {
    this.implementor = implementor;
  }

  /**
   * Allocate a parking spot using the current strategy
   */
  allocateSpot(spots: ParkingSpot[], vehicle: Vehicle): ParkingSpot | null {
    return this.implementor.findAvailableSpot(spots, vehicle);
  }

  /**
   * Get the current strategy name
   */
  getCurrentStrategy(): string {
    return this.implementor.getStrategyName();
  }
}
