import { ParkingSpot } from '../../models/ParkingSpot';
import { Vehicle } from '../../models/Vehicle';
import { ParkingOperationImplementor } from './ParkingOperationImplementor';

/**
 * Concrete implementation: First Available Strategy
 * Assigns the first available spot that can accommodate the vehicle
 */
export class FirstAvailableStrategy implements ParkingOperationImplementor {
  findAvailableSpot(spots: ParkingSpot[], vehicle: Vehicle): ParkingSpot | null {
    for (const spot of spots) {
      if (spot.isAvailable() && spot.canAccommodate(vehicle.getRequiredSpotSize())) {
        return spot;
      }
    }
    return null;
  }

  getStrategyName(): string {
    return 'First Available';
  }
}
