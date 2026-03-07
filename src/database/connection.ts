import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Connect to MongoDB
 * Returns true if connection successful, false otherwise
 */
export async function connectToDatabase(): Promise<boolean> {
  try {
    await mongoose.connect(MONGODB_URI || '');
    console.log('✓ Connected to MongoDB');
    return true;
  } catch (error) {
    console.warn('⚠ MongoDB connection failed, using in-memory storage');
    console.warn('  Error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Disconnect from MongoDB
 * Safe to call even if not connected
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    if (isConnected()) {
      await mongoose.disconnect();
      console.log('✓ Disconnected from MongoDB');
    }
  } catch (error) {
    console.warn('⚠ MongoDB disconnection error:', error);
  }
}

/**
 * Check if connected to MongoDB
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
