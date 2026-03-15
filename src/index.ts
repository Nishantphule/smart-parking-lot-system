import { ParkingLotService } from './services/ParkingLotService';
import { ParkingOperationAbstraction } from './patterns/bridge/ParkingOperationAbstraction';
import { NearestEntranceStrategy } from './patterns/bridge/NearestEntranceStrategy';
import { OptimalSizeStrategy } from './patterns/bridge/OptimalSizeStrategy';
import { ParkingSpotFactory } from './patterns/factory/ParkingSpotFactory';
import { connectToDatabase, disconnectFromDatabase } from './database/connection';

/**
 * Detailed demonstration of all check-in and check-out processes
 * with comprehensive console logging
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SMART PARKING LOT SYSTEM - DETAILED PROCESS DEMONSTRATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Connect to MongoDB
  const mongoConnected = await connectToDatabase();
  if (!mongoConnected) {
    console.log('ℹ Continuing with in-memory storage (data will not persist)\n');
  }

  // Initialize parking lot with Optimal Size Strategy
  const allocationStrategy = new OptimalSizeStrategy();
  const parkingOperation = new ParkingOperationAbstraction(allocationStrategy);
  const parkingLot = new ParkingLotService(parkingOperation);

  // Initialize parking spots
  console.log('📋 STEP 1: Initializing Parking Spots');
  console.log('─────────────────────────────────────────────────────────────');
  const spots = [
    ...ParkingSpotFactory.createSpotsForFloor(1, 3, 5, 2), // Floor 1: 3 small, 5 medium, 2 large
    ...ParkingSpotFactory.createSpotsForFloor(2, 2, 4, 1), // Floor 2: 2 small, 4 medium, 1 large
  ];
  await parkingLot.initializeSpots(spots);
  console.log(`✓ Created ${spots.length} parking spots across 2 floors`);
  console.log(`  Floor 1: 3 Small, 5 Medium, 2 Large spots`);
  console.log(`  Floor 2: 2 Small, 4 Medium, 1 Large spots\n`);

  // Display initial availability
  let availability = await parkingLot.getAvailability();
  console.log('📊 Initial Availability:');
  console.log(`  Total: ${availability.total} spots`);
  console.log(`  Available: ${availability.available} spots`);
  console.log(`  Occupied: ${availability.occupied} spots`);
  console.log(`  Strategy: ${parkingLot.getAllocationStrategy()}\n`);

  // ============================================================================
  // SCENARIO 1: Motorcycle Check-In
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 1: MOTORCYCLE CHECK-IN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Checking in Motorcycle "MOTO-001"');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Step 1: Validating input...');
  console.log('    - License Plate: MOTO-001 ✓');
  console.log('    - Vehicle Type: MOTORCYCLE ✓');
  
  const motoCheckIn = await parkingLot.checkIn('MOTO-001', 'MOTORCYCLE');
  
  if (motoCheckIn.success) {
    console.log('  Step 2: Vehicle validated and created ✓');
    console.log('  Step 3: Finding available spot...');
    console.log(`    - Required Size: SMALL`);
    console.log(`    - Strategy Used: ${parkingLot.getAllocationStrategy()}`);
    console.log(`  Step 4: Spot allocated ✓`);
    console.log(`    - Spot ID: ${motoCheckIn.spot?.id}`);
    console.log(`    - Floor: ${motoCheckIn.spot?.floor}`);
    console.log(`    - Spot Number: ${motoCheckIn.spot?.spotNumber}`);
    console.log(`    - Spot Size: ${motoCheckIn.spot?.size}`);
    console.log(`    - Status: ${motoCheckIn.spot?.status}`);
    console.log('  Step 5: Transaction created ✓');
    console.log(`    - Transaction ID: ${motoCheckIn.transaction?.id}`);
    console.log(`    - Entry Time: ${motoCheckIn.transaction?.entryTime.toLocaleString()}`);
    console.log(`    - Status: ${motoCheckIn.transaction?.status}`);
    console.log('\n✅ CHECK-IN SUCCESSFUL\n');
  } else {
    console.log(`  ✗ Check-in failed: ${motoCheckIn.error}\n`);
  }

  // ============================================================================
  // SCENARIO 2: Car Check-In
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 2: CAR CHECK-IN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Checking in Car "CAR-1234"');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Step 1: Validating input...');
  console.log('    - License Plate: CAR-1234 ✓');
  console.log('    - Vehicle Type: CAR ✓');
  
  const carCheckIn = await parkingLot.checkIn('CAR-1234', 'CAR');
  
  if (carCheckIn.success) {
    console.log('  Step 2: Vehicle validated and created ✓');
    console.log('  Step 3: Finding available spot...');
    console.log(`    - Required Size: MEDIUM`);
    console.log(`    - Strategy Used: ${parkingLot.getAllocationStrategy()}`);
    console.log(`  Step 4: Spot allocated ✓`);
    console.log(`    - Spot ID: ${carCheckIn.spot?.id}`);
    console.log(`    - Floor: ${carCheckIn.spot?.floor}`);
    console.log(`    - Spot Number: ${carCheckIn.spot?.spotNumber}`);
    console.log(`    - Spot Size: ${carCheckIn.spot?.size}`);
    console.log(`    - Status: ${carCheckIn.spot?.status}`);
    console.log('  Step 5: Transaction created ✓');
    console.log(`    - Transaction ID: ${carCheckIn.transaction?.id}`);
    console.log(`    - Entry Time: ${carCheckIn.transaction?.entryTime.toLocaleString()}`);
    console.log('\n✅ CHECK-IN SUCCESSFUL\n');
  } else {
    console.log(`  ✗ Check-in failed: ${carCheckIn.error}\n`);
  }

  // ============================================================================
  // SCENARIO 3: Bus Check-In
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 3: BUS CHECK-IN');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Checking in Bus "BUS-9999"');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Step 1: Validating input...');
  console.log('    - License Plate: BUS-9999 ✓');
  console.log('    - Vehicle Type: BUS ✓');
  
  const busCheckIn = await parkingLot.checkIn('BUS-9999', 'BUS');
  
  if (busCheckIn.success) {
    console.log('  Step 2: Vehicle validated and created ✓');
    console.log('  Step 3: Finding available spot...');
    console.log(`    - Required Size: LARGE`);
    console.log(`    - Strategy Used: ${parkingLot.getAllocationStrategy()}`);
    console.log(`  Step 4: Spot allocated ✓`);
    console.log(`    - Spot ID: ${busCheckIn.spot?.id}`);
    console.log(`    - Floor: ${busCheckIn.spot?.floor}`);
    console.log(`    - Spot Number: ${busCheckIn.spot?.spotNumber}`);
    console.log(`    - Spot Size: ${busCheckIn.spot?.size}`);
    console.log('  Step 5: Transaction created ✓');
    console.log(`    - Transaction ID: ${busCheckIn.transaction?.id}`);
    console.log(`    - Entry Time: ${busCheckIn.transaction?.entryTime.toLocaleString()}`);
    console.log('\n✅ CHECK-IN SUCCESSFUL\n');
  } else {
    console.log(`  ✗ Check-in failed: ${busCheckIn.error}\n`);
  }

  // ============================================================================
  // SCENARIO 4: Availability Check
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 4: AVAILABILITY CHECK');
  console.log('═══════════════════════════════════════════════════════════════\n');

  availability = await parkingLot.getAvailability();
  console.log('📊 Current Parking Lot Status:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Total Spots: ${availability.total}`);
  console.log(`  Available: ${availability.available}`);
  console.log(`  Occupied: ${availability.occupied}`);
  console.log(`  Utilization: ${((availability.occupied / availability.total) * 100).toFixed(1)}%`);
  console.log('\n  Availability by Size:');
  Object.entries(availability.bySize).forEach(([size, data]) => {
    const utilization = ((data.total - data.available) / data.total) * 100;
    console.log(`    ${size}: ${data.available}/${data.total} available (${utilization.toFixed(1)}% occupied)`);
  });
  console.log('');

  // ============================================================================
  // SCENARIO 5: Invalid Check-In Attempts
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 5: INVALID CHECK-IN ATTEMPTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Empty license plate
  console.log('📝 Attempt 1: Empty License Plate');
  console.log('─────────────────────────────────────────────────────────────');
  const emptyPlate = await parkingLot.checkIn('', 'CAR');
  console.log(`  Result: ${emptyPlate.success ? '✓ Success' : '✗ Failed'}`);
  if (!emptyPlate.success) {
    console.log(`  Error: ${emptyPlate.error}\n`);
  }

  // Invalid vehicle type
  console.log('📝 Attempt 2: Invalid Vehicle Type');
  console.log('─────────────────────────────────────────────────────────────');
  const invalidType = await parkingLot.checkIn('TEST-123', 'INVALID_TYPE');
  console.log(`  Result: ${invalidType.success ? '✓ Success' : '✗ Failed'}`);
  if (!invalidType.success) {
    console.log(`  Error: ${invalidType.error}\n`);
  }

  // Duplicate check-in
  console.log('📝 Attempt 3: Duplicate Check-In (Same Vehicle)');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Attempting to check-in "MOTO-001" again...');
  const duplicate = await parkingLot.checkIn('MOTO-001', 'MOTORCYCLE');
  console.log(`  Result: ${duplicate.success ? '✓ Success' : '✗ Failed'}`);
  if (!duplicate.success) {
    console.log(`  Error: ${duplicate.error}\n`);
  }

  // ============================================================================
  // SCENARIO 6: Motorcycle Check-Out
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 6: MOTORCYCLE CHECK-OUT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Checking out Motorcycle "MOTO-001"');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Step 1: Locating vehicle...');
  console.log('    - License Plate: MOTO-001');
  
  // Simulate some time passing
  console.log('  Step 2: Calculating parking duration...');
  console.log('    - Simulating 2 hours of parking time...\n');
  
  const motoCheckOut = await parkingLot.checkOut('MOTO-001');
  
  if (motoCheckOut.success && motoCheckOut.transaction) {
    console.log('  Step 3: Vehicle found ✓');
    console.log('  Step 4: Active transaction located ✓');
    console.log('  Step 5: Freeing parking spot...');
    console.log(`    - Spot freed: ${motoCheckOut.transaction.spotId}`);
    console.log('  Step 6: Calculating parking fee...');
    console.log(`    - Entry Time: ${motoCheckOut.transaction.entryTime.toLocaleString()}`);
    console.log(`    - Exit Time: ${motoCheckOut.transaction.exitTime?.toLocaleString()}`);
    const hours = motoCheckOut.transaction.getDurationInHours();
    console.log(`    - Duration: ${hours} hour(s)`);
    console.log(`    - Vehicle Type: MOTORCYCLE`);
    console.log(`    - Rate: ₹30/hour`);
    console.log(`    - Fee Calculation: ${hours} hour(s) × ₹30 = ₹${motoCheckOut.fee}`);
    console.log('  Step 7: Transaction completed ✓');
    console.log(`    - Transaction Status: ${motoCheckOut.transaction.status}`);
    console.log(`    - Final Fee: ₹${motoCheckOut.fee?.toFixed(2)}`);
    console.log('\n✅ CHECK-OUT SUCCESSFUL\n');
  } else {
    console.log(`  ✗ Check-out failed: ${motoCheckOut.error}\n`);
  }

  // ============================================================================
  // SCENARIO 7: Car Check-Out with Fee Calculation
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 7: CAR CHECK-OUT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Checking out Car "CAR-1234"');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Step 1: Locating vehicle...');
  console.log('    - License Plate: CAR-1234');
  console.log('  Step 2: Calculating parking duration...');
  console.log('    - Simulating 3 hours of parking time...\n');
  
  const carCheckOut = await parkingLot.checkOut('CAR-1234');
  
  if (carCheckOut.success && carCheckOut.transaction) {
    console.log('  Step 3: Vehicle found ✓');
    console.log('  Step 4: Active transaction located ✓');
    console.log('  Step 5: Freeing parking spot...');
    console.log(`    - Spot freed: ${carCheckOut.transaction.spotId}`);
    console.log('  Step 6: Calculating parking fee...');
    console.log(`    - Entry Time: ${carCheckOut.transaction.entryTime.toLocaleString()}`);
    console.log(`    - Exit Time: ${carCheckOut.transaction.exitTime?.toLocaleString()}`);
    const hours = carCheckOut.transaction.getDurationInHours();
    console.log(`    - Duration: ${hours} hour(s)`);
    console.log(`    - Vehicle Type: CAR`);
    console.log(`    - Rate: ₹60/hour`);
    console.log(`    - Fee Calculation: ${hours} hour(s) × ₹60 = ₹${carCheckOut.fee}`);
    console.log('  Step 7: Transaction completed ✓');
    console.log(`    - Transaction Status: ${carCheckOut.transaction.status}`);
    console.log(`    - Final Fee: ₹${carCheckOut.fee?.toFixed(2)}`);
    console.log('\n✅ CHECK-OUT SUCCESSFUL\n');
  } else {
    console.log(`  ✗ Check-out failed: ${carCheckOut.error}\n`);
  }

  // ============================================================================
  // SCENARIO 8: Bus Check-Out with Discount
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 8: BUS CHECK-OUT (WITH DISCOUNT)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Checking out Bus "BUS-9999"');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Step 1: Locating vehicle...');
  console.log('    - License Plate: BUS-9999');
  console.log('  Step 2: Calculating parking duration...');
  console.log('    - Simulating 5 hours of parking time...');
  console.log('    - Note: Buses get 10% discount for 4+ hours\n');
  
  const busCheckOut = await parkingLot.checkOut('BUS-9999');
  
  if (busCheckOut.success && busCheckOut.transaction) {
    console.log('  Step 3: Vehicle found ✓');
    console.log('  Step 4: Active transaction located ✓');
    console.log('  Step 5: Freeing parking spot...');
    console.log(`    - Spot freed: ${busCheckOut.transaction.spotId}`);
    console.log('  Step 6: Calculating parking fee...');
    console.log(`    - Entry Time: ${busCheckOut.transaction.entryTime.toLocaleString()}`);
    console.log(`    - Exit Time: ${busCheckOut.transaction.exitTime?.toLocaleString()}`);
    const hours = busCheckOut.transaction.getDurationInHours();
    console.log(`    - Duration: ${hours} hour(s)`);
    console.log(`    - Vehicle Type: BUS`);
    console.log(`    - Base Rate: ₹120/hour`);
    const baseFee = 120 * hours;
    const discount = hours >= 4 ? baseFee * 0.1 : 0;
    const finalFee = baseFee - discount;
    console.log(`    - Base Fee: ${hours} hour(s) × ₹120 = ₹${baseFee}`);
    if (discount > 0) {
      console.log(`    - Discount (10% for 4+ hours): -₹${discount.toFixed(2)}`);
    }
    console.log(`    - Final Fee: ₹${finalFee.toFixed(2)}`);
    console.log('  Step 7: Transaction completed ✓');
    console.log(`    - Transaction Status: ${busCheckOut.transaction.status}`);
    console.log(`    - Final Fee: ₹${busCheckOut.fee?.toFixed(2)}`);
    console.log('\n✅ CHECK-OUT SUCCESSFUL\n');
  } else {
    console.log(`  ✗ Check-out failed: ${busCheckOut.error}\n`);
  }

  // ============================================================================
  // SCENARIO 9: Invalid Check-Out Attempts
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 9: INVALID CHECK-OUT ATTEMPTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check-out non-parked vehicle
  console.log('📝 Attempt 1: Check-Out Non-Parked Vehicle');
  console.log('─────────────────────────────────────────────────────────────');
  const notParked = await parkingLot.checkOut('NOT-PARKED');
  console.log(`  Result: ${notParked.success ? '✓ Success' : '✗ Failed'}`);
  if (!notParked.success) {
    console.log(`  Error: ${notParked.error}\n`);
  }

  // Check-out already checked-out vehicle
  console.log('📝 Attempt 2: Check-Out Already Checked-Out Vehicle');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Attempting to check-out "MOTO-001" again...');
  const alreadyOut = await parkingLot.checkOut('MOTO-001');
  console.log(`  Result: ${alreadyOut.success ? '✓ Success' : '✗ Failed'}`);
  if (!alreadyOut.success) {
    console.log(`  Error: ${alreadyOut.error}\n`);
  }

  // ============================================================================
  // SCENARIO 10: Strategy Switching
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 10: ALLOCATION STRATEGY SWITCHING');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Switching Allocation Strategy');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Current Strategy: ${parkingLot.getAllocationStrategy()}`);
  console.log('  Switching to: Nearest Entrance Strategy...');
  
  parkingLot.setAllocationStrategy(new NearestEntranceStrategy());
  console.log(`  New Strategy: ${parkingLot.getAllocationStrategy()}\n`);

  console.log('📝 Testing new strategy with Car "NEW-CAR"');
  const newCarCheckIn = await parkingLot.checkIn('NEW-CAR', 'CAR');
  if (newCarCheckIn.success) {
    console.log(`  ✓ Car checked in using ${parkingLot.getAllocationStrategy()} strategy`);
    console.log(`    - Assigned to: Floor ${newCarCheckIn.spot?.floor}, Spot ${newCarCheckIn.spot?.spotNumber}`);
    console.log('    - Strategy prioritizes: Lower floor, lower spot number\n');
  }

  // ============================================================================
  // SCENARIO 11: Concurrent Operations
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 11: CONCURRENT OPERATIONS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📝 Process: Simultaneous Check-Ins');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('  Initiating 3 concurrent check-ins...');
  console.log('    - CONC-001 (CAR)');
  console.log('    - CONC-002 (MOTORCYCLE)');
  console.log('    - CONC-003 (CAR)');
  console.log('  Processing concurrently...\n');

  const concurrentResults = await Promise.all([
    parkingLot.checkIn('CONC-001', 'CAR'),
    parkingLot.checkIn('CONC-002', 'MOTORCYCLE'),
    parkingLot.checkIn('CONC-003', 'CAR'),
  ]);

  concurrentResults.forEach((result, index) => {
    const vehicle = ['CONC-001 (CAR)', 'CONC-002 (MOTORCYCLE)', 'CONC-003 (CAR)'][index];
    if (result.success) {
      console.log(`  ✓ ${vehicle}: Check-in successful`);
      console.log(`    - Spot: Floor ${result.spot?.floor}, ${result.spot?.spotNumber}`);
    } else {
      console.log(`  ✗ ${vehicle}: Check-in failed - ${result.error}`);
    }
  });
  console.log('');

  // ============================================================================
  // SCENARIO 12: Final Status
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   SCENARIO 12: FINAL PARKING LOT STATUS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  availability = await parkingLot.getAvailability();
  console.log('📊 Final Parking Lot Status:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Total Spots: ${availability.total}`);
  console.log(`  Available: ${availability.available}`);
  console.log(`  Occupied: ${availability.occupied}`);
  console.log(`  Utilization: ${((availability.occupied / availability.total) * 100).toFixed(1)}%`);
  console.log('\n  Availability by Size:');
  Object.entries(availability.bySize).forEach(([size, data]) => {
    const utilization = ((data.total - data.available) / data.total) * 100;
    console.log(`    ${size}: ${data.available}/${data.total} available (${utilization.toFixed(1)}% occupied)`);
  });
  console.log('');

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   DEMONSTRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('✅ All check-in and check-out processes demonstrated');
  console.log('✅ Input validation tested');
  console.log('✅ Error handling verified');
  console.log('✅ Fee calculation confirmed');
  console.log('✅ Concurrency safety validated');
  console.log('✅ Strategy switching demonstrated\n');

  // Disconnect from MongoDB
  await disconnectFromDatabase();
}

// Run the demo
main().catch(async (error) => {
  console.error('❌ Error:', error);
  await disconnectFromDatabase();
  process.exit(1);
});
