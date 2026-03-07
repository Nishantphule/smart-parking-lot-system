import { Vehicle } from '../models/Vehicle';
import { IVehicleRepository } from './IVehicleRepository';

/**
 * In-memory repository for Vehicle entities
 * Used as fallback when MongoDB is not available
 */
export class InMemoryVehicleRepository implements IVehicleRepository {
  private vehicles: Map<string, Vehicle> = new Map();

  async findById(id: string): Promise<Vehicle | null> {
    return this.vehicles.get(id) || null;
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.licensePlate === licensePlate) {
        return vehicle;
      }
    }
    return null;
  }

  async findAll(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  async delete(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.vehicles.has(id);
  }

  /**
   * Find active vehicles (currently parked)
   */
  async findActiveVehicles(): Promise<Vehicle[]> {
    const all = await this.findAll();
    return all.filter(v => v.entryTime && !v.exitTime);
  }
}
