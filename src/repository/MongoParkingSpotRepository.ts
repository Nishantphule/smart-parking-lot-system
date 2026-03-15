import { ParkingSpot, SpotStatus } from '../models/ParkingSpot';
import { VehicleSize } from '../models/Vehicle';
import { ParkingSpotModel, IParkingSpotDocument } from '../database/models/ParkingSpotModel';
import { IParkingSpotRepository } from './IParkingSpotRepository';

/**
 * MongoDB-based repository for ParkingSpot entities
 */
export class MongoParkingSpotRepository implements IParkingSpotRepository {
  async findById(id: string): Promise<ParkingSpot | null> {
    const doc = await ParkingSpotModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<ParkingSpot[]> {
    const docs = await ParkingSpotModel.find().exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async save(spot: ParkingSpot): Promise<ParkingSpot> {
    // Always use upsert based on floor + spotNumber to handle concurrent operations
    // and prevent duplicate key errors when initializing spots
    let doc: IParkingSpotDocument | null;
    
    try {
      doc = await ParkingSpotModel.findOneAndUpdate(
        { floor: spot.floor, spotNumber: spot.spotNumber },
        {
          floor: spot.floor,
          spotNumber: spot.spotNumber,
          size: spot.size,
          status: spot.status,
          vehicleId: spot.vehicleId,
          occupiedAt: spot.occupiedAt
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();
    } catch (error: any) {
      // Handle duplicate key error in case of race condition
      if (error.code === 11000) {
        // Spot was created by another concurrent request, fetch it
        doc = await ParkingSpotModel.findOne({
          floor: spot.floor,
          spotNumber: spot.spotNumber
        }).exec();
        if (doc) {
          // Update the existing spot
          doc.size = spot.size;
          doc.status = spot.status;
          doc.vehicleId = spot.vehicleId;
          doc.occupiedAt = spot.occupiedAt;
          doc = await doc.save();
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (!doc) {
      throw new Error(`Failed to save parking spot: Floor ${spot.floor}, Spot ${spot.spotNumber}`);
    }

    return this.toDomain(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await ParkingSpotModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await ParkingSpotModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  /**
   * Find available spots
   */
  async findAvailableSpots(): Promise<ParkingSpot[]> {
    const docs = await ParkingSpotModel.find({ status: SpotStatus.AVAILABLE }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Find available spots that can accommodate a vehicle size
   */
  async findAvailableSpotsBySize(vehicleSize: VehicleSize): Promise<ParkingSpot[]> {
    const sizeHierarchy: Record<VehicleSize, VehicleSize[]> = {
      [VehicleSize.SMALL]: [VehicleSize.SMALL, VehicleSize.MEDIUM, VehicleSize.LARGE],
      [VehicleSize.MEDIUM]: [VehicleSize.MEDIUM, VehicleSize.LARGE],
      [VehicleSize.LARGE]: [VehicleSize.LARGE]
    };

    const compatibleSizes = sizeHierarchy[vehicleSize];
    const docs = await ParkingSpotModel.find({
      status: SpotStatus.AVAILABLE,
      size: { $in: compatibleSizes }
    }).exec();

    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Find spots by floor
   */
  async findSpotsByFloor(floor: number): Promise<ParkingSpot[]> {
    const docs = await ParkingSpotModel.find({ floor }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Find occupied spots
   */
  async findOccupiedSpots(): Promise<ParkingSpot[]> {
    const docs = await ParkingSpotModel.find({ status: SpotStatus.OCCUPIED }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Get spot by vehicle ID
   */
  async findByVehicleId(vehicleId: string): Promise<ParkingSpot | null> {
    const doc = await ParkingSpotModel.findOne({ vehicleId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * Atomically reserve a spot using MongoDB findOneAndUpdate with status check
   * This provides database-level locking to prevent race conditions
   */
  async reserveSpotAtomically(spotId: string, vehicleId: string): Promise<ParkingSpot | null> {
    try {
      // Use findOneAndUpdate with status check for atomic operation
      // This ensures the spot is still available when we reserve it
      const doc = await ParkingSpotModel.findOneAndUpdate(
        {
          _id: spotId,
          status: 'AVAILABLE' // Only update if still available
        },
        {
          $set: {
            status: 'OCCUPIED',
            vehicleId: vehicleId,
            occupiedAt: new Date()
          }
        },
        {
          new: true // Return updated document
        }
      ).exec();

      if (!doc) {
        // Spot was already taken or doesn't exist
        return null;
      }

      return this.toDomain(doc);
    } catch (error) {
      // If update fails, spot is no longer available
      return null;
    }
  }

  /**
   * Convert MongoDB document to domain model
   */
  private toDomain(doc: IParkingSpotDocument): ParkingSpot {
    const spot = new ParkingSpot(
      doc._id.toString(),
      doc.floor,
      doc.spotNumber,
      doc.size,
      doc.status,
      doc.vehicleId,
      doc.occupiedAt
    );
    return spot;
  }
}
