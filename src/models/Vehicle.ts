/**
 * Vehicle types enum
 */
export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  BUS = 'BUS'
}

/**
 * Vehicle size enum - determines which parking spots can accommodate the vehicle
 */
export enum VehicleSize {
  SMALL = 'SMALL',      // Motorcycle
  MEDIUM = 'MEDIUM',    // Car
  LARGE = 'LARGE'       // Bus
}

/**
 * Base Vehicle class
 */
export class Vehicle {
  constructor(
    public readonly id: string,
    public readonly licensePlate: string,
    public readonly type: VehicleType,
    public readonly size: VehicleSize,
    public entryTime?: Date,
    public exitTime?: Date
  ) {}

  /**
   * Get the minimum spot size required for this vehicle
   */
  getRequiredSpotSize(): VehicleSize {
    return this.size;
  }
}
