import mongoose, { Schema, Document } from 'mongoose';
import { SpotStatus } from '../../models/ParkingSpot';
import { VehicleSize } from '../../models/Vehicle';

export interface IParkingSpotDocument extends Document {
  floor: number;
  spotNumber: string;
  size: VehicleSize;
  status: SpotStatus;
  vehicleId?: string;
  occupiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParkingSpotSchema = new Schema<IParkingSpotDocument>(
  {
    floor: {
      type: Number,
      required: true,
      index: true
    },
    spotNumber: {
      type: String,
      required: true
    },
    size: {
      type: String,
      enum: Object.values(VehicleSize),
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(SpotStatus),
      default: SpotStatus.AVAILABLE,
      index: true
    },
    vehicleId: {
      type: String,
      index: true
    },
    occupiedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index for unique floor + spotNumber combination
ParkingSpotSchema.index({ floor: 1, spotNumber: 1 }, { unique: true });

export const ParkingSpotModel = mongoose.model<IParkingSpotDocument>('ParkingSpot', ParkingSpotSchema);
