import { VehicleType } from '../../models/Vehicle';
import { FeeCalculationStrategy } from './FeeCalculationStrategy';

/**
 * Fee calculation strategy for cars
 * Standard rate per hour
 */
export class CarFeeStrategy implements FeeCalculationStrategy {
  private readonly baseRate: number = 60; // ₹60 per hour

  calculateFee(hours: number): number {
    // Minimum 1 hour charge
    const billableHours = Math.max(1, hours);
    return this.baseRate * billableHours;
  }

  getVehicleType(): VehicleType {
    return VehicleType.CAR;
  }

  getBaseRate(): number {
    return this.baseRate;
  }
}
