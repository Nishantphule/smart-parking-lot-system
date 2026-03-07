import { ParkingSpot } from '../models/ParkingSpot';
import { VehicleSize } from '../models/Vehicle';
import { IRepository } from './IRepository';

/**
 * Extended repository interface for ParkingSpot with additional methods
 */
export interface IParkingSpotRepository extends Omit<IRepository<ParkingSpot>, 'save'> {
  save(entity: ParkingSpot): Promise<ParkingSpot> | ParkingSpot;
  findAvailableSpots(): Promise<ParkingSpot[]> | ParkingSpot[];
  findAvailableSpotsBySize(vehicleSize: VehicleSize): Promise<ParkingSpot[]> | ParkingSpot[];
  findSpotsByFloor(floor: number): Promise<ParkingSpot[]> | ParkingSpot[];
  findOccupiedSpots(): Promise<ParkingSpot[]> | ParkingSpot[];
  findByVehicleId(vehicleId: string): Promise<ParkingSpot | null> | ParkingSpot | null;
}
