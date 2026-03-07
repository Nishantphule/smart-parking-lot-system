import { IVehicleRepository } from './IVehicleRepository';
import { IParkingSpotRepository } from './IParkingSpotRepository';
import { ITransactionRepository } from './ITransactionRepository';
import { MongoVehicleRepository } from './MongoVehicleRepository';
import { MongoParkingSpotRepository } from './MongoParkingSpotRepository';
import { MongoTransactionRepository } from './MongoTransactionRepository';
import { InMemoryVehicleRepository } from './InMemoryVehicleRepository';
import { InMemoryParkingSpotRepository } from './InMemoryParkingSpotRepository';
import { InMemoryTransactionRepository } from './InMemoryTransactionRepository';
import { isConnected } from '../database/connection';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Factory for creating repositories
 * Automatically falls back to in-memory repositories if MongoDB is not available
 */
export class RepositoryFactory {
  private static useMongoDB: boolean | null = null;

  /**
   * Check if MongoDB should be used
   */
  private static shouldUseMongoDB(): boolean {
    // Check if in-memory mode is forced via environment variable
    if (process.env.USE_IN_MEMORY === 'true' || process.env.USE_IN_MEMORY === '1') {
      return false;
    }

    if (this.useMongoDB === null) {
      // Check if MongoDB is connected
      this.useMongoDB = isConnected();
    }
    return this.useMongoDB;
  }

  /**
   * Force use of in-memory repositories
   */
  static useInMemory(): void {
    this.useMongoDB = false;
  }

  /**
   * Force use of MongoDB repositories
   */
  static forceMongoDB(): void {
    this.useMongoDB = true;
  }

  /**
   * Reset to auto-detect mode
   */
  static reset(): void {
    this.useMongoDB = null;
  }

  /**
   * Create vehicle repository
   */
  static createVehicleRepository(): IVehicleRepository {
    if (this.shouldUseMongoDB()) {
      return new MongoVehicleRepository();
    }
    return new InMemoryVehicleRepository();
  }

  /**
   * Create parking spot repository
   */
  static createParkingSpotRepository(): IParkingSpotRepository {
    if (this.shouldUseMongoDB()) {
      return new MongoParkingSpotRepository();
    }
    return new InMemoryParkingSpotRepository();
  }

  /**
   * Create transaction repository
   */
  static createTransactionRepository(): ITransactionRepository {
    if (this.shouldUseMongoDB()) {
      return new MongoTransactionRepository();
    }
    return new InMemoryTransactionRepository();
  }

  /**
   * Get current storage type
   */
  static getStorageType(): 'MongoDB' | 'In-Memory' {
    return this.shouldUseMongoDB() ? 'MongoDB' : 'In-Memory';
  }
}
