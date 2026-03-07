import { Transaction } from '../models/Transaction';
import { IRepository } from './IRepository';

/**
 * Extended repository interface for Transaction with additional methods
 */
export interface ITransactionRepository extends Omit<IRepository<Transaction>, 'save'> {
  save(entity: Transaction): Promise<Transaction> | Transaction;
  findActiveTransactions(): Promise<Transaction[]> | Transaction[];
  findByVehicleId(vehicleId: string): Promise<Transaction | null> | Transaction | null;
  findBySpotId(spotId: string): Promise<Transaction[]> | Transaction[];
  findCompletedTransactions(): Promise<Transaction[]> | Transaction[];
}
