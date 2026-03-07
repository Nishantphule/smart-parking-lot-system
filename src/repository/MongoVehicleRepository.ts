import { Vehicle } from '../models/Vehicle';
import { VehicleModel, IVehicleDocument } from '../database/models/VehicleModel';
import { IVehicleRepository } from './IVehicleRepository';

/**
 * MongoDB-based repository for Vehicle entities
 */
export class MongoVehicleRepository implements IVehicleRepository {
  async findById(id: string): Promise<Vehicle | null> {
    const doc = await VehicleModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const doc = await VehicleModel.findOne({ licensePlate }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<Vehicle[]> {
    const docs = await VehicleModel.find().exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    // Always use upsert based on license plate to handle concurrent operations
    // This prevents duplicate key errors when multiple requests try to create the same vehicle
    let doc: IVehicleDocument | null;
    
    try {
      doc = await VehicleModel.findOneAndUpdate(
        { licensePlate: vehicle.licensePlate },
        {
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          size: vehicle.size,
          entryTime: vehicle.entryTime,
          exitTime: vehicle.exitTime
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).exec();
    } catch (error: any) {
      // Handle duplicate key error in case of race condition
      if (error.code === 11000) {
        // Vehicle was created by another concurrent request, fetch it
        doc = await VehicleModel.findOne({ licensePlate: vehicle.licensePlate }).exec();
        if (doc) {
          // Update the existing vehicle
          doc.type = vehicle.type;
          doc.size = vehicle.size;
          doc.entryTime = vehicle.entryTime;
          doc.exitTime = vehicle.exitTime;
          doc = await doc.save();
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    if (!doc) {
      throw new Error(`Failed to save vehicle with license plate: ${vehicle.licensePlate}`);
    }

    return this.toDomain(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await VehicleModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await VehicleModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  /**
   * Find active vehicles (currently parked)
   */
  async findActiveVehicles(): Promise<Vehicle[]> {
    const docs = await VehicleModel.find({
      entryTime: { $exists: true },
      exitTime: { $exists: false }
    }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Convert MongoDB document to domain model
   */
  private toDomain(doc: IVehicleDocument): Vehicle {
    return new Vehicle(
      doc._id.toString(),
      doc.licensePlate,
      doc.type,
      doc.size,
      doc.entryTime,
      doc.exitTime
    );
  }
}
