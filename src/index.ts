import { ParkingLotService } from './services/ParkingLotService';
import { ParkingOperationAbstraction } from './patterns/bridge/ParkingOperationAbstraction';
import { NearestEntranceStrategy } from './patterns/bridge/NearestEntranceStrategy';
import { OptimalSizeStrategy } from './patterns/bridge/OptimalSizeStrategy';
import { ParkingSpotFactory } from './patterns/factory/ParkingSpotFactory';
import { connectToDatabase, disconnectFromDatabase } from './database/connection';

/**
 * Main entry point demonstrating the Smart Parking Lot System
 */
async function main() {
  console.log('=== Smart Parking Lot System ===\n');

  // Try to connect to MongoDB (will fallback to in-memory if connection fails)
  const mongoConnected = await connectToDatabase();
  if (!mongoConnected) {
    console.log('ℹ Continuing with in-memory storage (data will not persist)\n');
  }

  // Initialize parking lot with a strategy (Bridge Pattern)
  // We can switch strategies at runtime
  const allocationStrategy = new OptimalSizeStrategy(); // Try: FirstAvailableStrategy, NearestEntranceStrategy, OptimalSizeStrategy
  const parkingOperation = new ParkingOperationAbstraction(allocationStrategy);
  const parkingLot = new ParkingLotService(parkingOperation);

  // Initialize parking spots using Factory Pattern
  console.log('Initializing parking spots...');
  const spots = [
    ...ParkingSpotFactory.createSpotsForFloor(1, 5, 10, 3), // Floor 1: 5 small, 10 medium, 3 large
    ...ParkingSpotFactory.createSpotsForFloor(2, 3, 8, 2),  // Floor 2: 3 small, 8 medium, 2 large
  ];

  // Initialize parking spots in the parking lot
  await parkingLot.initializeSpots(spots);

  console.log(`Created ${spots.length} parking spots across 2 floors\n`);

  // Display initial availability
  let availability = await parkingLot.getAvailability();
  console.log('Initial Availability:');
  console.log(`Total spots: ${availability.total}`);
  console.log(`Available: ${availability.available}`);
  console.log(`Occupied: ${availability.occupied}`);
  console.log(`Current allocation strategy: ${parkingLot.getAllocationStrategy()}\n`);

  // Example 1: Check-in vehicles
  console.log('=== Example 1: Vehicle Check-ins ===');
  
  const checkIn1 = await parkingLot.checkIn('ABC-1234', 'CAR');
  if (checkIn1.success) {
    console.log(`✓ Car ABC-1234 checked in at spot ${checkIn1.spot?.spotNumber} on floor ${checkIn1.spot?.floor}`);
  }

  const checkIn2 = await parkingLot.checkIn('XYZ-5678', 'MOTORCYCLE');
  if (checkIn2.success) {
    console.log(`✓ Motorcycle XYZ-5678 checked in at spot ${checkIn2.spot?.spotNumber} on floor ${checkIn2.spot?.floor}`);
  }

  const checkIn3 = await parkingLot.checkIn('BUS-9999', 'BUS');
  if (checkIn3.success) {
    console.log(`✓ Bus BUS-9999 checked in at spot ${checkIn3.spot?.spotNumber} on floor ${checkIn3.spot?.floor}`);
  }

  // Example 2: Check availability after check-ins
  console.log('\n=== Example 2: Availability After Check-ins ===');
  availability = await parkingLot.getAvailability();
  console.log(`Available spots: ${availability.available}`);
  console.log(`Occupied spots: ${availability.occupied}`);
  console.log('Availability by size:');
  Object.entries(availability.bySize).forEach(([size, data]) => {
    console.log(`  ${size}: ${data.available}/${data.total} available`);
  });

  // Example 3: Simulate time passage and check-out
  console.log('\n=== Example 3: Vehicle Check-out ===');
  console.log('Simulating 2 hours of parking...\n');

  // In a real scenario, we'd wait, but for demo we'll just check out
  const checkOut1 = await parkingLot.checkOut('ABC-1234');
  if (checkOut1.success && checkOut1.transaction) {
    const hours = checkOut1.transaction.getDurationInHours();
    console.log(`✓ Car ABC-1234 checked out`);
    console.log(`  Duration: ${hours} hour(s)`);
    console.log(`  Fee: ₹${checkOut1.fee?.toFixed(2)}`);
  }

  // Example 4: Demonstrate different allocation strategies
  console.log('\n=== Example 4: Switching Allocation Strategies ===');
  console.log(`Current strategy: ${parkingLot.getAllocationStrategy()}`);
  
  // Switch to Nearest Entrance Strategy
  parkingLot.setAllocationStrategy(new NearestEntranceStrategy());
  console.log(`Switched to: ${parkingLot.getAllocationStrategy()}`);

  const checkIn4 = await parkingLot.checkIn('NEW-1111', 'CAR');
  if (checkIn4.success) {
    console.log(`✓ New car NEW-1111 checked in using ${parkingLot.getAllocationStrategy()} strategy`);
    console.log(`  Assigned to: Floor ${checkIn4.spot?.floor}, Spot ${checkIn4.spot?.spotNumber}`);
  }

  // Example 5: Concurrent check-ins (demonstrating thread-safety)
  console.log('\n=== Example 5: Concurrent Operations ===');
  console.log('Simulating concurrent check-ins...');
  
  const concurrentCheckIns = Promise.all([
    parkingLot.checkIn('CONC-001', 'CAR'),
    parkingLot.checkIn('CONC-002', 'MOTORCYCLE'),
    parkingLot.checkIn('CONC-003', 'CAR'),
  ]);

  const results = await concurrentCheckIns;
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✓ Concurrent check-in ${index + 1} succeeded: ${result.vehicle?.licensePlate}`);
    } else {
      console.log(`✗ Concurrent check-in ${index + 1} failed: ${result.error}`);
    }
  });

  // Final availability
  console.log('\n=== Final Status ===');
  availability = await parkingLot.getAvailability();
  console.log(`Total spots: ${availability.total}`);
  console.log(`Available: ${availability.available}`);
  console.log(`Occupied: ${availability.occupied}`);

  console.log('\n=== System Demo Complete ===');

  // Disconnect from MongoDB (if connected)
  await disconnectFromDatabase();
}

// Run the demo
main().catch(async (error) => {
  console.error('Error:', error);
  await disconnectFromDatabase();
  process.exit(1);
});
