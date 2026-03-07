import mongoose, { Schema, Document } from 'mongoose';
import { VehicleType, VehicleSize } from '../../models/Vehicle';

export interface IVehicleDocument extends Document {
  licensePlate: string;
  type: VehicleType;
  size: VehicleSize;
  entryTime?: Date;
  exitTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicleDocument>(
  {
    licensePlate: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
      index: true
    },
    size: {
      type: String,
      enum: Object.values(VehicleSize),
      required: true
    },
    entryTime: {
      type: Date,
      index: true
    },
    exitTime: {
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

export const VehicleModel = mongoose.model<IVehicleDocument>('Vehicle', VehicleSchema);
