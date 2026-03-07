import mongoose, { Schema, Document } from 'mongoose';
import { TransactionStatus } from '../../models/Transaction';

export interface ITransactionDocument extends Document {
  vehicleId: string;
  spotId: string;
  entryTime: Date;
  exitTime?: Date;
  fee?: number;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    vehicleId: {
      type: String,
      required: true,
      index: true
    },
    spotId: {
      type: String,
      required: true,
      index: true
    },
    entryTime: {
      type: Date,
      required: true,
      index: true
    },
    exitTime: {
      type: Date
    },
    fee: {
      type: Number
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.ACTIVE,
      index: true
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

export const TransactionModel = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
