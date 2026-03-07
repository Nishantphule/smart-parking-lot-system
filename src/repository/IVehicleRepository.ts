import { Vehicle } from '../models/Vehicle';
import { IRepository } from './IRepository';

/**
 * Extended repository interface for Vehicle with additional methods
 */
export interface IVehicleRepository extends Omit<IRepository<Vehicle>, 'save'> {
  save(entity: Vehicle): Promise<Vehicle> | Vehicle;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null> | Vehicle | null;
  findActiveVehicles(): Promise<Vehicle[]> | Vehicle[];
}
