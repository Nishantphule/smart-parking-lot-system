import { VehicleType } from '../../models/Vehicle';
import { FeeCalculationStrategy } from './FeeCalculationStrategy';

/**
 * Fee calculation strategy for buses
 * Higher rate per hour with potential discounts for longer stays
 */
export class BusFeeStrategy implements FeeCalculationStrategy {
  private readonly baseRate: number = 120; // ₹120 per hour
  private readonly discountThreshold: number = 4; // Hours for discount
  private readonly discountRate: number = 0.9; // 10% discount

  calculateFee(hours: number): number {
    // Minimum 1 hour charge
    const billableHours = Math.max(1, hours);
    let fee = this.baseRate * billableHours;

    // Apply discount for longer stays
    if (billableHours >= this.discountThreshold) {
      fee = fee * this.discountRate;
    }

    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  getVehicleType(): VehicleType {
    return VehicleType.BUS;
  }

  getBaseRate(): number {
    return this.baseRate;
  }
}
