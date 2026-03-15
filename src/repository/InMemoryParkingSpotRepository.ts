import { ParkingSpot, SpotStatus } from '../models/ParkingSpot';
import { VehicleSize } from '../models/Vehicle';
import { IParkingSpotRepository } from './IParkingSpotRepository';

/**
 * In-memory repository for ParkingSpot entities
 * Used as fallback when MongoDB is not available
 */
export class InMemoryParkingSpotRepository implements IParkingSpotRepository {
  private spots: Map<string, ParkingSpot> = new Map();

  async findById(id: string): Promise<ParkingSpot | null> {
    return this.spots.get(id) || null;
  }

  async findAll(): Promise<ParkingSpot[]> {
    return Array.from(this.spots.values());
  }

  async save(spot: ParkingSpot): Promise<ParkingSpot> {
    this.spots.set(spot.id, spot);
    return spot;
  }

  async delete(id: string): Promise<boolean> {
    return this.spots.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.spots.has(id);
  }

  /**
   * Find available spots
   */
  async findAvailableSpots(): Promise<ParkingSpot[]> {
    const all = await this.findAll();
    return all.filter(spot => spot.isAvailable());
  }

  /**
   * Find available spots that can accommodate a vehicle size
   */
  async findAvailableSpotsBySize(vehicleSize: VehicleSize): Promise<ParkingSpot[]> {
    const all = await this.findAll();
    return all.filter(
      spot => spot.isAvailable() && spot.canAccommodate(vehicleSize)
    );
  }

  /**
   * Find spots by floor
   */
  async findSpotsByFloor(floor: number): Promise<ParkingSpot[]> {
    const all = await this.findAll();
    return all.filter(spot => spot.floor === floor);
  }

  /**
   * Find occupied spots
   */
  async findOccupiedSpots(): Promise<ParkingSpot[]> {
    const all = await this.findAll();
    return all.filter(spot => spot.status === SpotStatus.OCCUPIED);
  }

  /**
   * Get spot by vehicle ID
   */
  async findByVehicleId(vehicleId: string): Promise<ParkingSpot | null> {
    for (const spot of this.spots.values()) {
      if (spot.vehicleId === vehicleId) {
        return spot;
      }
    }
    return null;
  }

  /**
   * Atomically reserve a spot (in-memory version with check)
   */
  async reserveSpotAtomically(spotId: string, vehicleId: string): Promise<ParkingSpot | null> {
    const spot = this.spots.get(spotId);
    
    if (!spot || !spot.isAvailable()) {
      return null; // Spot not found or already occupied
    }

    // Atomically update the spot
    spot.occupy(vehicleId);
    return spot;
  }
}
