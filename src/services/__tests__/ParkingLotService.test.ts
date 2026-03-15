import { ParkingLotService } from '../ParkingLotService';
import { ParkingOperationAbstraction } from '../../patterns/bridge/ParkingOperationAbstraction';
import { OptimalSizeStrategy } from '../../patterns/bridge/OptimalSizeStrategy';
import { ParkingSpotFactory } from '../../patterns/factory/ParkingSpotFactory';
import { RepositoryFactory } from '../../repository/RepositoryFactory';

describe('ParkingLotService', () => {
  let parkingLot: ParkingLotService;

  beforeEach(() => {
    // Use in-memory storage for tests
    RepositoryFactory.useInMemory();
    parkingLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
  });

  describe('Input Validation', () => {
    test('should reject empty license plate', async () => {
      const result = await parkingLot.checkIn('', 'CAR');
      expect(result.success).toBe(false);
      expect(result.error).toContain('License plate cannot be empty');
    });

    test('should reject license plate exceeding 20 characters', async () => {
      const longPlate = 'A'.repeat(21);
      const result = await parkingLot.checkIn(longPlate, 'CAR');
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 20 characters');
    });

    test('should reject invalid vehicle type', async () => {
      const result = await parkingLot.checkIn('ABC-123', 'INVALID_TYPE');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid vehicle type');
    });

    test('should accept valid license plate with special characters', async () => {
      const spots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
      await parkingLot.initializeSpots(spots);
      
      const result = await parkingLot.checkIn('ABC-123_XYZ', 'CAR');
      expect(result.success).toBe(true);
    });
  });

  describe('Check-In', () => {
    beforeEach(async () => {
      const spots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
      await parkingLot.initializeSpots(spots);
    });

    test('should successfully check-in a vehicle', async () => {
      const result = await parkingLot.checkIn('TEST-001', 'CAR');
      expect(result.success).toBe(true);
      expect(result.spot).toBeDefined();
      expect(result.vehicle).toBeDefined();
    });

    test('should prevent duplicate check-in', async () => {
      await parkingLot.checkIn('DUP-001', 'CAR');
      const result = await parkingLot.checkIn('DUP-001', 'CAR');
      expect(result.success).toBe(false);
      expect(result.error).toContain('already parked');
    });

    test('should fail when no spots available', async () => {
      // Fill all spots
      await parkingLot.checkIn('F1', 'MOTORCYCLE');
      await parkingLot.checkIn('F2', 'CAR');
      await parkingLot.checkIn('F3', 'BUS');
      
      const result = await parkingLot.checkIn('NO-SPOT', 'CAR');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No available');
    });
  });

  describe('Check-Out', () => {
    beforeEach(async () => {
      const spots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
      await parkingLot.initializeSpots(spots);
    });

    test('should successfully check-out a vehicle', async () => {
      await parkingLot.checkIn('OUT-001', 'CAR');
      const result = await parkingLot.checkOut('OUT-001');
      
      expect(result.success).toBe(true);
      expect(result.fee).toBeDefined();
      expect(result.fee).toBeGreaterThanOrEqual(60); // Minimum 1 hour charge
    });

    test('should fail to check-out non-parked vehicle', async () => {
      const result = await parkingLot.checkOut('NOT-PARKED');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not currently parked');
    });

    test('should calculate fee correctly', async () => {
      await parkingLot.checkIn('FEE-001', 'CAR');
      const result = await parkingLot.checkOut('FEE-001');
      
      expect(result.success).toBe(true);
      // Car rate is ₹60/hour, minimum 1 hour
      expect(result.fee).toBe(60);
    });
  });

  describe('Concurrency', () => {
    beforeEach(async () => {
      const spots = ParkingSpotFactory.createSpotsForFloor(1, 5, 5, 5);
      await parkingLot.initializeSpots(spots);
    });

    test('should handle concurrent check-ins for different vehicles', async () => {
      const results = await Promise.all([
        parkingLot.checkIn('CONC-1', 'CAR'),
        parkingLot.checkIn('CONC-2', 'CAR'),
        parkingLot.checkIn('CONC-3', 'CAR'),
      ]);

      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(3);
    });

    test('should prevent concurrent check-ins for same vehicle', async () => {
      const results = await Promise.all([
        parkingLot.checkIn('SAME-VEH', 'CAR'),
        parkingLot.checkIn('SAME-VEH', 'CAR'),
        parkingLot.checkIn('SAME-VEH', 'CAR'),
      ]);

      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBe(1); // Only one should succeed
    });
  });

  describe('Availability', () => {
    test('should return correct availability', async () => {
      const spots = ParkingSpotFactory.createSpotsForFloor(1, 2, 2, 1);
      await parkingLot.initializeSpots(spots);
      
      const availability = await parkingLot.getAvailability();
      expect(availability.total).toBe(5);
      expect(availability.available).toBe(5);
      expect(availability.occupied).toBe(0);
    });
  });
});
