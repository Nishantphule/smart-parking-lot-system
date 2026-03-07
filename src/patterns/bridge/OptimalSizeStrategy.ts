import { ParkingSpot } from '../../models/ParkingSpot';
import { Vehicle, VehicleSize } from '../../models/Vehicle';
import { ParkingOperationImplementor } from './ParkingOperationImplementor';

/**
 * Concrete implementation: Optimal Size Strategy
 * Assigns the smallest available spot that can accommodate the vehicle
 * (to reserve larger spots for larger vehicles)
 */
export class OptimalSizeStrategy implements ParkingOperationImplementor {
  findAvailableSpot(spots: ParkingSpot[], vehicle: Vehicle): ParkingSpot | null {
    const sizePriority: Record<VehicleSize, number> = {
      [VehicleSize.SMALL]: 1,
      [VehicleSize.MEDIUM]: 2,
      [VehicleSize.LARGE]: 3
    };

    const availableSpots = spots
      .filter(spot => spot.isAvailable() && spot.canAccommodate(vehicle.getRequiredSpotSize()))
      .sort((a, b) => {
        // Prefer smaller spots first
        return sizePriority[a.size] - sizePriority[b.size];
      });

    return availableSpots.length > 0 ? availableSpots[0] : null;
  }

  getStrategyName(): string {
    return 'Optimal Size';
  }
}
