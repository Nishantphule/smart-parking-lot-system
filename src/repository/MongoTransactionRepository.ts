import { Transaction, TransactionStatus } from '../models/Transaction';
import { TransactionModel, ITransactionDocument } from '../database/models/TransactionModel';
import { ITransactionRepository } from './ITransactionRepository';

/**
 * MongoDB-based repository for Transaction entities
 */
export class MongoTransactionRepository implements ITransactionRepository {
  async findById(id: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const docs = await TransactionModel.find().exec();
    return docs.map(doc => this.toDomain(doc));
  }

  async save(transaction: Transaction): Promise<Transaction> {
    let doc: ITransactionDocument | null;
    
    if (transaction.id && transaction.id.startsWith('TXN-')) {
      // New transaction, create it
      doc = await TransactionModel.create({
        vehicleId: transaction.vehicleId,
        spotId: transaction.spotId,
        entryTime: transaction.entryTime,
        exitTime: transaction.exitTime,
        fee: transaction.fee,
        status: transaction.status
      });
    } else {
      // Existing transaction, update it
      doc = await TransactionModel.findByIdAndUpdate(
        transaction.id,
        {
          vehicleId: transaction.vehicleId,
          spotId: transaction.spotId,
          entryTime: transaction.entryTime,
          exitTime: transaction.exitTime,
          fee: transaction.fee,
          status: transaction.status
        },
        { new: true }
      ).exec();
      
      if (!doc) {
        throw new Error(`Transaction with id ${transaction.id} not found`);
      }
    }

    return this.toDomain(doc);
  }

  async delete(id: string): Promise<boolean> {
    const result = await TransactionModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await TransactionModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }

  /**
   * Find active transactions
   */
  async findActiveTransactions(): Promise<Transaction[]> {
    const docs = await TransactionModel.find({ status: TransactionStatus.ACTIVE }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Find transaction by vehicle ID
   */
  async findByVehicleId(vehicleId: string): Promise<Transaction | null> {
    const doc = await TransactionModel.findOne({
      vehicleId,
      status: TransactionStatus.ACTIVE
    }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * Find transactions by spot ID
   */
  async findBySpotId(spotId: string): Promise<Transaction[]> {
    const docs = await TransactionModel.find({ spotId }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Find completed transactions
   */
  async findCompletedTransactions(): Promise<Transaction[]> {
    const docs = await TransactionModel.find({ status: TransactionStatus.COMPLETED }).exec();
    return docs.map(doc => this.toDomain(doc));
  }

  /**
   * Convert MongoDB document to domain model
   */
  private toDomain(doc: ITransactionDocument): Transaction {
    const transaction = new Transaction(
      doc._id.toString(),
      doc.vehicleId,
      doc.spotId,
      doc.entryTime,
      doc.exitTime,
      doc.fee,
      doc.status
    );
    return transaction;
  }
}
