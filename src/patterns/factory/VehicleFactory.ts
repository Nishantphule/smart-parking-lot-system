import { Vehicle, VehicleType, VehicleSize } from '../../models/Vehicle';

/**
 * Factory for creating Vehicle instances
 */
export class VehicleFactory {
  private static vehicleIdCounter: number = 1;

  /**
   * Create a vehicle based on type
   */
  static createVehicle(
    licensePlate: string,
    type: VehicleType,
    entryTime?: Date
  ): Vehicle {
    const id = `VEH-${this.vehicleIdCounter++}`;
    const size = this.getVehicleSize(type);

    return new Vehicle(id, licensePlate, type, size, entryTime);
  }

  /**
   * Create a motorcycle
   */
  static createMotorcycle(licensePlate: string, entryTime?: Date): Vehicle {
    return this.createVehicle(licensePlate, VehicleType.MOTORCYCLE, entryTime);
  }

  /**
   * Create a car
   */
  static createCar(licensePlate: string, entryTime?: Date): Vehicle {
    return this.createVehicle(licensePlate, VehicleType.CAR, entryTime);
  }

  /**
   * Create a bus
   */
  static createBus(licensePlate: string, entryTime?: Date): Vehicle {
    return this.createVehicle(licensePlate, VehicleType.BUS, entryTime);
  }

  /**
   * Get vehicle size based on type
   */
  private static getVehicleSize(type: VehicleType): VehicleSize {
    const sizeMap: Record<VehicleType, VehicleSize> = {
      [VehicleType.MOTORCYCLE]: VehicleSize.SMALL,
      [VehicleType.CAR]: VehicleSize.MEDIUM,
      [VehicleType.BUS]: VehicleSize.LARGE
    };

    return sizeMap[type];
  }

  /**
   * Reset ID counter (useful for testing)
   */
  static resetIdCounter(): void {
    this.vehicleIdCounter = 1;
  }
}
