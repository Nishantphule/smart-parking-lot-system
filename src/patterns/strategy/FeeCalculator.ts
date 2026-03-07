import { VehicleType } from '../../models/Vehicle';
import { FeeCalculationStrategy } from './FeeCalculationStrategy';
import { MotorcycleFeeStrategy } from './MotorcycleFeeStrategy';
import { CarFeeStrategy } from './CarFeeStrategy';
import { BusFeeStrategy } from './BusFeeStrategy';

/**
 * Fee Calculator using Strategy pattern
 * Manages different fee calculation strategies for different vehicle types
 */
export class FeeCalculator {
  private strategies: Map<VehicleType, FeeCalculationStrategy>;

  constructor() {
    this.strategies = new Map();
    // Initialize default strategies
    this.strategies.set(VehicleType.MOTORCYCLE, new MotorcycleFeeStrategy());
    this.strategies.set(VehicleType.CAR, new CarFeeStrategy());
    this.strategies.set(VehicleType.BUS, new BusFeeStrategy());
  }

  /**
   * Set a custom strategy for a vehicle type
   */
  setStrategy(vehicleType: VehicleType, strategy: FeeCalculationStrategy): void {
    this.strategies.set(vehicleType, strategy);
  }

  /**
   * Get strategy for a vehicle type
   */
  getStrategy(vehicleType: VehicleType): FeeCalculationStrategy {
    const strategy = this.strategies.get(vehicleType);
    if (!strategy) {
      throw new Error(`No fee strategy found for vehicle type: ${vehicleType}`);
    }
    return strategy;
  }

  /**
   * Calculate fee for a vehicle type and duration
   */
  calculateFee(vehicleType: VehicleType, hours: number): number {
    const strategy = this.getStrategy(vehicleType);
    return strategy.calculateFee(hours);
  }
}
