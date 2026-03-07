import { ParkingLotService } from '../services/ParkingLotService';
import { ParkingOperationAbstraction } from '../patterns/bridge/ParkingOperationAbstraction';
import { OptimalSizeStrategy } from '../patterns/bridge/OptimalSizeStrategy';
import { ParkingSpotFactory } from '../patterns/factory/ParkingSpotFactory';
import { RepositoryFactory } from '../repository/RepositoryFactory';
import { connectToDatabase, disconnectFromDatabase } from '../database/connection';

/**
 * Edge case tests for Smart Parking Lot System
 */
async function runEdgeCaseTests() {
  console.log('\n=== Edge Case Tests ===\n');

  // Force in-memory mode for testing
  RepositoryFactory.useInMemory();
  
  // Initialize parking lot
  const parkingLot = new ParkingLotService(
    new ParkingOperationAbstraction(new OptimalSizeStrategy())
  );

  // Setup: Create limited spots for testing
  const spots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1); // 1 of each size
  await parkingLot.initializeSpots(spots);
  console.log('✓ Test setup: Created 3 parking spots (1 small, 1 medium, 1 large)\n');

  let testCount = 0;
  let passCount = 0;
  let failCount = 0;
  const testPromises: Promise<void>[] = [];

  async function test(name: string, testFn: () => Promise<boolean> | boolean): Promise<void> {
    testCount++;
    const currentTest = testCount;
    try {
      const result = testFn();
      if (result instanceof Promise) {
        const promise = result.then(passed => {
          if (passed) {
            console.log(`✓ Test ${currentTest}: ${name}`);
            passCount++;
          } else {
            console.log(`✗ Test ${currentTest}: ${name} - FAILED`);
            failCount++;
          }
        }).catch(err => {
          console.log(`✗ Test ${currentTest}: ${name} - ERROR: ${err.message}`);
          failCount++;
        });
        testPromises.push(promise);
      } else {
        if (result) {
          console.log(`✓ Test ${currentTest}: ${name}`);
          passCount++;
        } else {
          console.log(`✗ Test ${currentTest}: ${name} - FAILED`);
          failCount++;
        }
      }
    } catch (err: any) {
      console.log(`✗ Test ${currentTest}: ${name} - ERROR: ${err.message}`);
      failCount++;
    }
  }

  // ========== Check-In Edge Cases ==========

  test('Check-in with valid vehicle', async () => {
    const result = await parkingLot.checkIn('TEST-001', 'CAR');
    return result.success === true && result.spot !== undefined;
  });

  test('Check-in same vehicle twice (should fail)', async () => {
    await parkingLot.checkIn('TEST-DUP', 'CAR');
    const result = await parkingLot.checkIn('TEST-DUP', 'CAR');
    return result.success === false && (result.error?.includes('already parked') ?? false);
  });

  test('Check-in when no spots available', async () => {
    // Fill all spots
    await parkingLot.checkIn('FILL-1', 'MOTORCYCLE');
    await parkingLot.checkIn('FILL-2', 'CAR');
    await parkingLot.checkIn('FILL-3', 'BUS');
    
    const result = await parkingLot.checkIn('NO-SPOT', 'CAR');
    return result.success === false && (result.error?.includes('No available') ?? false);
  });

  test('Check-in large vehicle when only small spots available', async () => {
    // Create a lot with only small spots
    RepositoryFactory.useInMemory();
    const smallLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const smallSpots = ParkingSpotFactory.createSpotsForFloor(1, 5, 0, 0); // Only small spots
    await smallLot.initializeSpots(smallSpots);
    
    const result = await smallLot.checkIn('LARGE-VEH', 'BUS');
    return result.success === false && (result.error?.includes('No available') ?? false);
  });

  test('Check-in with invalid vehicle type (should default to CAR)', async () => {
    RepositoryFactory.useInMemory();
    const invalidLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const invalidSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await invalidLot.initializeSpots(invalidSpots);
    
    const result = await invalidLot.checkIn('INVALID-TYPE', 'INVALID' as any);
    return result.success === true; // Should default to CAR
  });

  // ========== Check-Out Edge Cases ==========

  test('Check-out vehicle that is not parked', async () => {
    const result = await parkingLot.checkOut('NOT-PARKED');
    return result.success === false && (result.error?.includes('not currently parked') ?? false);
  });

  test('Check-out vehicle that was already checked out', async () => {
    await parkingLot.checkIn('CHECKOUT-TEST', 'CAR');
    await parkingLot.checkOut('CHECKOUT-TEST');
    const result = await parkingLot.checkOut('CHECKOUT-TEST');
    return result.success === false;
  });

  test('Check-out with zero duration (immediate check-out)', async () => {
    RepositoryFactory.useInMemory();
    const zeroLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const zeroSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await zeroLot.initializeSpots(zeroSpots);
    
    await zeroLot.checkIn('ZERO-DUR', 'CAR');
    const result = await zeroLot.checkOut('ZERO-DUR');
    return result.success === true && result.fee !== undefined && result.fee >= 0;
  });

  // ========== Availability Edge Cases ==========

  test('Get availability when lot is empty', async () => {
    RepositoryFactory.useInMemory();
    const emptyLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const emptySpots = ParkingSpotFactory.createSpotsForFloor(1, 2, 2, 1);
    await emptyLot.initializeSpots(emptySpots);
    
    const availability = await emptyLot.getAvailability();
    return availability.available === availability.total && availability.occupied === 0;
  });

  test('Get availability when lot is full', async () => {
    RepositoryFactory.useInMemory();
    const fullLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const fullSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await fullLot.initializeSpots(fullSpots);
    
    await fullLot.checkIn('F1', 'MOTORCYCLE');
    await fullLot.checkIn('F2', 'CAR');
    await fullLot.checkIn('F3', 'BUS');
    
    const availability = await fullLot.getAvailability();
    return availability.available === 0 && availability.occupied === availability.total;
  });

  // ========== Fee Calculation Edge Cases ==========

  test('Fee calculation for minimum 1 hour charge', async () => {
    RepositoryFactory.useInMemory();
    const feeLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const feeSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await feeLot.initializeSpots(feeSpots);
    
    await feeLot.checkIn('FEE-TEST', 'CAR');
    const result = await feeLot.checkOut('FEE-TEST');
    // Should charge for at least 1 hour even if less time passed
    return result.success === true && result.fee !== undefined && result.fee >= 60;
  });

  test('Fee calculation for different vehicle types', async () => {
    RepositoryFactory.useInMemory();
    const feeLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const feeSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await feeLot.initializeSpots(feeSpots);
    
    // Motorcycle should be cheaper than car
    await feeLot.checkIn('MOTO-FEE', 'MOTORCYCLE');
    const motoResult = await feeLot.checkOut('MOTO-FEE');
    
    await feeLot.checkIn('CAR-FEE', 'CAR');
    const carResult = await feeLot.checkOut('CAR-FEE');
    
    return motoResult.fee! < carResult.fee!;
  });

  // ========== Concurrency Edge Cases ==========

  test('Concurrent check-ins for different vehicles', async () => {
    RepositoryFactory.useInMemory();
    const concLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const concSpots = ParkingSpotFactory.createSpotsForFloor(1, 5, 5, 5);
    await concLot.initializeSpots(concSpots);
    
    const results = await Promise.all([
      concLot.checkIn('CONC-1', 'CAR'),
      concLot.checkIn('CONC-2', 'CAR'),
      concLot.checkIn('CONC-3', 'CAR'),
    ]);
    
    const successCount = results.filter(r => r.success).length;
    return successCount === 3; // All should succeed
  });

  test('Concurrent check-in attempts for same vehicle', async () => {
    RepositoryFactory.useInMemory();
    const sameLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const sameSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await sameLot.initializeSpots(sameSpots);
    
    const results = await Promise.all([
      sameLot.checkIn('SAME-VEH', 'CAR'),
      sameLot.checkIn('SAME-VEH', 'CAR'),
      sameLot.checkIn('SAME-VEH', 'CAR'),
    ]);
    
    // Only one should succeed
    const successCount = results.filter(r => r.success).length;
    return successCount === 1;
  });

  test('Concurrent check-out attempts for same vehicle', async () => {
    RepositoryFactory.useInMemory();
    const outLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const outSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await outLot.initializeSpots(outSpots);
    
    await outLot.checkIn('OUT-TEST', 'CAR');
    
    const results = await Promise.all([
      outLot.checkOut('OUT-TEST'),
      outLot.checkOut('OUT-TEST'),
      outLot.checkOut('OUT-TEST'),
    ]);
    
    // Only one should succeed
    const successCount = results.filter(r => r.success).length;
    return successCount === 1;
  });

  // ========== Strategy Switching Edge Cases ==========

  test('Switch allocation strategy with no available spots', async () => {
    RepositoryFactory.useInMemory();
    const stratLot = new ParkingLotService(
      new ParkingOperationAbstraction(new OptimalSizeStrategy())
    );
    const stratSpots = ParkingSpotFactory.createSpotsForFloor(1, 1, 1, 1);
    await stratLot.initializeSpots(stratSpots);
    
    // Fill all spots
    await stratLot.checkIn('S1', 'MOTORCYCLE');
    await stratLot.checkIn('S2', 'CAR');
    await stratLot.checkIn('S3', 'BUS');
    
    // Switch strategy
    const { NearestEntranceStrategy } = await import('../patterns/bridge/NearestEntranceStrategy');
    stratLot.setAllocationStrategy(new NearestEntranceStrategy());
    
    // Try to check in - should fail
    const result = await stratLot.checkIn('NO-SPOT-STRAT', 'CAR');
    return result.success === false;
  });

  // ========== Data Edge Cases ==========

  test('Check-in with empty license plate (should handle gracefully)', async () => {
    const result = await parkingLot.checkIn('', 'CAR');
    // Should either fail gracefully or handle empty string
    return result.success === false || (result.success && result.vehicle !== undefined);
  });

  test('Check-in with very long license plate', async () => {
    const longPlate = 'A'.repeat(100);
    const result = await parkingLot.checkIn(longPlate, 'CAR');
    // Should handle long strings
    return result.success === false || (result.success && result.vehicle !== undefined);
  });

  // Wait for all async tests to complete
  await Promise.all(testPromises);

  console.log(`\n=== Test Results ===`);
  console.log(`Total tests: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Success rate: ${((passCount / testCount) * 100).toFixed(1)}%\n`);
}

// Run edge case tests
if (require.main === module) {
  runEdgeCaseTests()
    .then(() => {
      console.log('✓ Edge case tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Edge case tests failed:', error);
      process.exit(1);
    });
}

export { runEdgeCaseTests };
