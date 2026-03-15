import { VehicleType } from '../models/Vehicle';

/**
 * Input validation utilities
 */

/**
 * Validate license plate format
 * Basic validation: non-empty, reasonable length (1-20 characters), alphanumeric with dashes
 */
export function validateLicensePlate(licensePlate: string): { valid: boolean; error?: string } {
  if (!licensePlate || licensePlate.trim().length === 0) {
    return { valid: false, error: 'License plate cannot be empty' };
  }

  const trimmed = licensePlate.trim();
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'License plate cannot exceed 20 characters' };
  }

  if (trimmed.length < 1) {
    return { valid: false, error: 'License plate must be at least 1 character' };
  }

  // Allow alphanumeric, spaces, dashes, and underscores
  const validPattern = /^[A-Za-z0-9\s\-_]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: 'License plate contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Validate vehicle type
 */
export function validateVehicleType(vehicleType: string): { valid: boolean; type?: VehicleType; error?: string } {
  if (!vehicleType || typeof vehicleType !== 'string') {
    return { valid: false, error: 'Vehicle type is required' };
  }

  const upperType = vehicleType.toUpperCase().trim();
  const validType = VehicleType[upperType as keyof typeof VehicleType];

  if (!validType) {
    return { 
      valid: false, 
      error: `Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}` 
    };
  }

  return { valid: true, type: validType };
}
