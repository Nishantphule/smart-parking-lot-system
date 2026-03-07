import { VehicleType } from '../../models/Vehicle';
import { FeeCalculationStrategy } from './FeeCalculationStrategy';

/**
 * Fee calculation strategy for motorcycles
 * Lower rate per hour
 */
export class MotorcycleFeeStrategy implements FeeCalculationStrategy {
  private readonly baseRate: number = 30; // ₹30 per hour

  calculateFee(hours: number): number {
    // Minimum 1 hour charge
    const billableHours = Math.max(1, hours);
    return this.baseRate * billableHours;
  }

  getVehicleType(): VehicleType {
    return VehicleType.MOTORCYCLE;
  }

  getBaseRate(): number {
    return this.baseRate;
  }
}
