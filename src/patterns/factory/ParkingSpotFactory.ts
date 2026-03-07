import { ParkingSpot, SpotStatus } from '../../models/ParkingSpot';
import { VehicleSize } from '../../models/Vehicle';

/**
 * Factory for creating ParkingSpot instances
 */
export class ParkingSpotFactory {
  private static spotIdCounter: number = 1;

  /**
   * Create a parking spot
   */
  static createSpot(
    floor: number,
    spotNumber: string,
    size: VehicleSize,
    status: SpotStatus = SpotStatus.AVAILABLE
  ): ParkingSpot {
    const id = `SPOT-${this.spotIdCounter++}`;
    return new ParkingSpot(id, floor, spotNumber, size, status);
  }

  /**
   * Create a small spot (for motorcycles)
   */
  static createSmallSpot(floor: number, spotNumber: string): ParkingSpot {
    return this.createSpot(floor, spotNumber, VehicleSize.SMALL);
  }

  /**
   * Create a medium spot (for cars)
   */
  static createMediumSpot(floor: number, spotNumber: string): ParkingSpot {
    return this.createSpot(floor, spotNumber, VehicleSize.MEDIUM);
  }

  /**
   * Create a large spot (for buses)
   */
  static createLargeSpot(floor: number, spotNumber: string): ParkingSpot {
    return this.createSpot(floor, spotNumber, VehicleSize.LARGE);
  }

  /**
   * Create multiple spots in bulk
   */
  static createSpotsForFloor(
    floor: number,
    smallSpots: number,
    mediumSpots: number,
    largeSpots: number
  ): ParkingSpot[] {
    const spots: ParkingSpot[] = [];
    let spotNumber = 1;

    // Create small spots
    for (let i = 0; i < smallSpots; i++) {
      spots.push(this.createSmallSpot(floor, `S${spotNumber++}`));
    }

    // Create medium spots
    for (let i = 0; i < mediumSpots; i++) {
      spots.push(this.createMediumSpot(floor, `M${spotNumber++}`));
    }

    // Create large spots
    for (let i = 0; i < largeSpots; i++) {
      spots.push(this.createLargeSpot(floor, `L${spotNumber++}`));
    }

    return spots;
  }

  /**
   * Reset ID counter (useful for testing)
   */
  static resetIdCounter(): void {
    this.spotIdCounter = 1;
  }
}
