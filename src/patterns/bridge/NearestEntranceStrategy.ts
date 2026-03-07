import { ParkingSpot } from '../../models/ParkingSpot';
import { Vehicle } from '../../models/Vehicle';
import { ParkingOperationImplementor } from './ParkingOperationImplementor';

/**
 * Concrete implementation: Nearest Entrance Strategy
 * Assigns the spot closest to the entrance (lower floor, lower spot number)
 */
export class NearestEntranceStrategy implements ParkingOperationImplementor {
  findAvailableSpot(spots: ParkingSpot[], vehicle: Vehicle): ParkingSpot | null {
    const availableSpots = spots
      .filter(spot => spot.isAvailable() && spot.canAccommodate(vehicle.getRequiredSpotSize()))
      .sort((a, b) => {
        // Sort by floor first (ascending), then by spot number
        if (a.floor !== b.floor) {
          return a.floor - b.floor;
        }
        return a.spotNumber.localeCompare(b.spotNumber);
      });

    return availableSpots.length > 0 ? availableSpots[0] : null;
  }

  getStrategyName(): string {
    return 'Nearest Entrance';
  }
}
