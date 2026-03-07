import { VehicleType } from '../../models/Vehicle';

/**
 * Strategy interface for fee calculation
 */
export interface FeeCalculationStrategy {
  /**
   * Calculate parking fee based on duration in hours
   * @param hours - Number of hours parked (rounded up)
   * @returns Calculated fee
   */
  calculateFee(hours: number): number;

  /**
   * Get the vehicle type this strategy applies to
   */
  getVehicleType(): VehicleType;

  /**
   * Get base rate per hour
   */
  getBaseRate(): number;
}
