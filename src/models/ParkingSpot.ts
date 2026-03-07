import { VehicleSize } from './Vehicle';

/**
 * Parking spot status
 */
export enum SpotStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE'
}

/**
 * Base ParkingSpot class
 */
export class ParkingSpot {
  constructor(
    public readonly id: string,
    public readonly floor: number,
    public readonly spotNumber: string,
    public readonly size: VehicleSize,
    public status: SpotStatus = SpotStatus.AVAILABLE,
    public vehicleId?: string,
    public occupiedAt?: Date
  ) {}

  /**
   * Check if this spot can accommodate a vehicle of given size
   */
  canAccommodate(vehicleSize: VehicleSize): boolean {
    const sizeHierarchy: Record<VehicleSize, number> = {
      [VehicleSize.SMALL]: 1,
      [VehicleSize.MEDIUM]: 2,
      [VehicleSize.LARGE]: 3
    };

    return sizeHierarchy[this.size] >= sizeHierarchy[vehicleSize];
  }

  /**
   * Check if spot is available
   */
  isAvailable(): boolean {
    return this.status === SpotStatus.AVAILABLE;
  }

  /**
   * Occupy the spot
   */
  occupy(vehicleId: string): void {
    this.status = SpotStatus.OCCUPIED;
    this.vehicleId = vehicleId;
    this.occupiedAt = new Date();
  }

  /**
   * Free the spot
   */
  free(): void {
    this.status = SpotStatus.AVAILABLE;
    this.vehicleId = undefined;
    this.occupiedAt = undefined;
  }
}
