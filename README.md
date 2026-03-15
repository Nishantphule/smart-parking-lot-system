# Smart Parking Lot Management System

A production-ready backend system for managing smart parking lots with automatic spot allocation, real-time availability tracking, and dynamic fee calculation. Built with TypeScript, MongoDB, and industry-standard design patterns.

## 🎯 Overview

This system efficiently manages vehicle entry and exit, automatically assigns parking spots based on vehicle size, tracks parking duration, and calculates fees dynamically. It handles concurrent operations safely and provides real-time availability updates.

## ✨ Features

- **Intelligent Spot Allocation**: Automatically assigns optimal parking spots based on vehicle size (motorcycle, car, bus)
- **Real-Time Availability**: Updates parking spot status instantly as vehicles enter and leave
- **Dynamic Fee Calculation**: Calculates parking fees based on duration and vehicle type with configurable pricing strategies
- **Production-Ready Concurrency**: Multi-layer protection with application-level locks and database-level atomic operations
- **Input Validation**: Comprehensive validation for license plates and vehicle types with clear error messages
- **Persistent Storage**: MongoDB integration with automatic in-memory fallback
- **Flexible Allocation Strategies**: Multiple algorithms for spot assignment (First Available, Nearest Entrance, Optimal Size)
- **Automated Testing**: Jest-based unit tests with comprehensive coverage

## 🏗️ Architecture

### Design Patterns

The system implements several design patterns for maintainability and extensibility:

1. **Bridge Pattern**: Separates parking spot allocation abstraction from concrete implementation strategies
   - Allows runtime switching between allocation algorithms
   - Easy to add new allocation strategies

2. **Strategy Pattern**: Encapsulates different fee calculation algorithms for different vehicle types
   - Motorcycle: ₹30/hour
   - Car: ₹60/hour
   - Bus: ₹120/hour (10% discount for 4+ hours)

3. **Factory Pattern**: Centralizes object creation for vehicles and parking spots
   - Ensures consistent object initialization
   - Simplifies bulk creation operations

4. **Repository Pattern**: Abstracts data access layer
   - MongoDB-based persistence
   - Easy to swap implementations for testing or different databases

### System Components

```
src/
├── models/              # Domain models (Vehicle, ParkingSpot, Transaction)
├── patterns/             # Design pattern implementations
│   ├── bridge/          # Spot allocation strategies
│   ├── strategy/        # Fee calculation strategies
│   └── factory/         # Object creation factories
├── repository/           # Data access layer (MongoDB)
├── database/            # MongoDB connection and models
├── services/            # Business logic (ParkingLotService)
└── index.ts             # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB instance (optional - system falls back to in-memory storage if unavailable)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-parking-lot-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure storage (optional):
   - **MongoDB (default)**: The connection string is configured in `src/database/connection.ts`
   - Set `MONGODB_URI` environment variable to use a different MongoDB instance:
     ```bash
     export MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
     ```
   - **In-Memory (fallback)**: If MongoDB is unavailable, the system automatically uses in-memory storage
   - Force in-memory mode (for testing or if MongoDB is not desired):
     ```bash
     export USE_IN_MEMORY=true
     ```

4. Build the project:
```bash
npm run build
```

5. Run the application:
```bash
npm run dev
```

## 📖 Usage

### Basic Operations

#### Initialize Parking Spots

```typescript
import { ParkingLotService } from './services/ParkingLotService';
import { ParkingOperationAbstraction } from './patterns/bridge/ParkingOperationAbstraction';
import { OptimalSizeStrategy } from './patterns/bridge/OptimalSizeStrategy';
import { ParkingSpotFactory } from './patterns/factory/ParkingSpotFactory';

// Create parking lot service
const strategy = new OptimalSizeStrategy();
const parkingOperation = new ParkingOperationAbstraction(strategy);
const parkingLot = new ParkingLotService(parkingOperation);

// Initialize spots (Floor 1: 5 small, 10 medium, 3 large)
const spots = ParkingSpotFactory.createSpotsForFloor(1, 5, 10, 3);
await parkingLot.initializeSpots(spots);
```

#### Check-In a Vehicle

```typescript
const result = await parkingLot.checkIn('ABC-1234', 'CAR');

if (result.success) {
  console.log(`Vehicle parked at spot ${result.spot?.spotNumber} on floor ${result.spot?.floor}`);
} else {
  console.error(result.error);
}
```

#### Check-Out a Vehicle

```typescript
const result = await parkingLot.checkOut('ABC-1234');

if (result.success) {
  console.log(`Fee: ₹${result.fee}`);
  console.log(`Duration: ${result.transaction?.getDurationInHours()} hours`);
}
```

#### Check Availability

```typescript
const availability = await parkingLot.getAvailability();
console.log(`Available: ${availability.available}/${availability.total}`);
console.log(`Occupied: ${availability.occupied}`);
```

#### Switch Allocation Strategy

```typescript
import { NearestEntranceStrategy } from './patterns/bridge/NearestEntranceStrategy';

parkingLot.setAllocationStrategy(new NearestEntranceStrategy());
```

### Vehicle Types

- `'MOTORCYCLE'` - Small vehicles (₹30/hour)
- `'CAR'` - Medium vehicles (₹60/hour)
- `'BUS'` - Large vehicles (₹120/hour, 10% discount for 4+ hours)

### Allocation Strategies

1. **FirstAvailableStrategy**: Assigns the first available compatible spot
2. **NearestEntranceStrategy**: Assigns the closest spot to entrance (lower floor, lower spot number)
3. **OptimalSizeStrategy**: Assigns the smallest suitable spot (reserves larger spots for larger vehicles)

## 🗄️ Database Schema

### Collections

#### Vehicles
- `licensePlate` (unique, indexed)
- `type` (MOTORCYCLE, CAR, BUS)
- `size` (SMALL, MEDIUM, LARGE)
- `entryTime`, `exitTime`
- Timestamps

#### ParkingSpots
- `floor` (indexed)
- `spotNumber`
- `size` (indexed)
- `status` (AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE) - indexed
- `vehicleId` (indexed)
- `occupiedAt`
- Unique compound index: `(floor, spotNumber)`
- Timestamps

#### Transactions
- `vehicleId` (indexed)
- `spotId` (indexed)
- `entryTime` (indexed)
- `exitTime`
- `fee`
- `status` (ACTIVE, COMPLETED, CANCELLED) - indexed
- Timestamps

## 🔒 Concurrency Handling

The system implements multi-layer concurrency protection:

- **Application-level locking**: Resource-based locks prevent concurrent operations on the same vehicle
- **Database-level atomic operations**: Spot assignment uses atomic `findOneAndUpdate` with status checks
- **MongoDB transactions**: Spot reservation is protected at the data layer to prevent race conditions
- **Thread-safe operations**: Promise-based locking mechanism ensures data consistency
- Different vehicles can operate concurrently without conflicts

## 📊 API Reference

### ParkingLotService

#### `checkIn(licensePlate: string, vehicleType: string): Promise<CheckInResult>`
Checks in a vehicle and assigns a parking spot. Validates input before processing.

**Validation:**
- License plate: Non-empty, 1-20 characters, alphanumeric with dashes/underscores
- Vehicle type: Must be MOTORCYCLE, CAR, or BUS

**Returns:**
- `success: boolean`
- `vehicle?: Vehicle`
- `spot?: ParkingSpot`
- `transaction?: Transaction`
- `error?: string` - Clear error message if validation fails or operation fails

#### `checkOut(licensePlate: string): Promise<CheckOutResult>`
Checks out a vehicle and calculates parking fee.

**Returns:**
- `success: boolean`
- `transaction?: Transaction`
- `fee?: number`
- `error?: string`

#### `getAvailability(): Promise<AvailabilityInfo>`
Gets current parking lot availability.

**Returns:**
- `total: number`
- `available: number`
- `occupied: number`
- `bySize: Record<string, { total: number; available: number }>`

#### `initializeSpots(spots: ParkingSpot[]): Promise<void>`
Initializes parking spots in the system.

#### `setAllocationStrategy(implementor: ParkingOperationImplementor): void`
Changes the spot allocation strategy at runtime.

## 🧪 Example: Complete Workflow

```typescript
import { ParkingLotService } from './services/ParkingLotService';
import { ParkingOperationAbstraction } from './patterns/bridge/ParkingOperationAbstraction';
import { OptimalSizeStrategy } from './patterns/bridge/OptimalSizeStrategy';
import { ParkingSpotFactory } from './patterns/factory/ParkingSpotFactory';
import { connectToDatabase, disconnectFromDatabase } from './database/connection';

async function main() {
  // Connect to MongoDB
  await connectToDatabase();

  // Initialize parking lot
  const parkingLot = new ParkingLotService(
    new ParkingOperationAbstraction(new OptimalSizeStrategy())
  );

  // Setup parking spots
  const spots = ParkingSpotFactory.createSpotsForFloor(1, 10, 20, 5);
  await parkingLot.initializeSpots(spots);

  // Check-in
  const checkIn = await parkingLot.checkIn('ABC-1234', 'CAR');
  if (checkIn.success) {
    console.log(`Parked at spot ${checkIn.spot?.spotNumber}`);
  }

  // Check availability
  const availability = await parkingLot.getAvailability();
  console.log(`Available: ${availability.available}`);

  // Check-out
  const checkOut = await parkingLot.checkOut('ABC-1234');
  if (checkOut.success) {
    console.log(`Fee: ₹${checkOut.fee}`);
  }

  // Disconnect
  await disconnectFromDatabase();
}
```

## 🛠️ Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run the application in development mode
- `npm start` - Run the compiled application
- `npm run test:edge` - Run edge case tests

### Testing

The system includes comprehensive automated tests using Jest:

```bash
npm test
```

**Test Coverage:**
- ✅ Input validation (license plate format, vehicle type validation)
- ✅ Check-in/check-out operations
- ✅ Error handling and edge cases
- ✅ Concurrency safety (concurrent check-ins/check-outs)
- ✅ Fee calculation accuracy
- ✅ Availability tracking
- ✅ Boundary conditions (empty/full parking lot)

**Key Features:**
- **Input Validation**: Rejects invalid license plates (empty, too long, invalid characters) and invalid vehicle types
- **Database-Level Locking**: Spot assignment protected by atomic operations at the data layer
- **Proper ID Generation**: Uses UUIDs instead of sequential counters
- **Type Safety**: No `any` types, full TypeScript type coverage

### Project Structure

- **Models**: Domain entities (Vehicle, ParkingSpot, Transaction)
- **Patterns**: Design pattern implementations
- **Repository**: MongoDB data access layer
- **Services**: Business logic and orchestration
- **Database**: MongoDB connection and schema definitions

## 📝 License

ISC

## 🤝 Contributing

This is a demonstration project showcasing low-level system design with design patterns and MongoDB integration.

---

**Built with TypeScript, MongoDB, and modern design patterns**
