import { Transaction, TransactionStatus } from '../models/Transaction';
import { ITransactionRepository } from './ITransactionRepository';

/**
 * In-memory repository for Transaction entities
 * Used as fallback when MongoDB is not available
 */
export class InMemoryTransactionRepository implements ITransactionRepository {
  private transactions: Map<string, Transaction> = new Map();

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  async findAll(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async save(transaction: Transaction): Promise<Transaction> {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async delete(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.transactions.has(id);
  }

  /**
   * Find active transactions
   */
  async findActiveTransactions(): Promise<Transaction[]> {
    const all = await this.findAll();
    return all.filter(t => t.status === TransactionStatus.ACTIVE);
  }

  /**
   * Find transaction by vehicle ID
   */
  async findByVehicleId(vehicleId: string): Promise<Transaction | null> {
    const activeTransactions = await this.findActiveTransactions();
    return activeTransactions.find(t => t.vehicleId === vehicleId) || null;
  }

  /**
   * Find transactions by spot ID
   */
  async findBySpotId(spotId: string): Promise<Transaction[]> {
    const all = await this.findAll();
    return all.filter(t => t.spotId === spotId);
  }

  /**
   * Find completed transactions
   */
  async findCompletedTransactions(): Promise<Transaction[]> {
    const all = await this.findAll();
    return all.filter(t => t.status === TransactionStatus.COMPLETED);
  }
}
