/**
 * Transaction status
 */
export enum TransactionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Parking transaction record
 */
export class Transaction {
  constructor(
    public readonly id: string,
    public readonly vehicleId: string,
    public readonly spotId: string,
    public readonly entryTime: Date,
    public exitTime?: Date,
    public fee?: number,
    public status: TransactionStatus = TransactionStatus.ACTIVE
  ) {}

  /**
   * Calculate duration in hours
   */
  getDurationInHours(): number {
    const exit = this.exitTime || new Date();
    const durationMs = exit.getTime() - this.entryTime.getTime();
    return Math.ceil(durationMs / (1000 * 60 * 60)); // Round up to nearest hour
  }

  /**
   * Complete the transaction
   */
  complete(exitTime: Date, fee: number): void {
    this.exitTime = exitTime;
    this.fee = fee;
    this.status = TransactionStatus.COMPLETED;
  }
}
