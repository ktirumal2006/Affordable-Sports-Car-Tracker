/**
 * NHTSA vPIC API integration
 * Documentation: https://vpic.nhtsa.dot.gov/api/
 */

export interface VPICMake {
  Make_ID: number;
  Make_Name: string;
}

export interface VPICModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

export interface VPICVehicleType {
  VehicleTypeId: number;
  VehicleTypeName: string;
}

export interface VPICVehicleTypeResponse {
  Count: number;
  Message: string;
  Results: VPICVehicleType[];
}

const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

/**
 * Fetch all makes from NHTSA vPIC API
 */
export async function fetchAllMakes(): Promise<VPICMake[]> {
  try {
    const response = await fetch(`${VPIC_BASE_URL}/getallmakes?format=json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.Count === 0) {
      console.warn('No makes returned from vPIC API');
      return [];
    }
    
    return data.Results || [];
  } catch (error) {
    console.error('Failed to fetch makes from vPIC:', error);
    throw error;
  }
}

/**
 * Fetch models for a specific make from NHTSA vPIC API
 */
export async function fetchModelsForMake(makeId: number): Promise<VPICModel[]> {
  try {
    const response = await fetch(`${VPIC_BASE_URL}/getmodelsformakeid/${makeId}?format=json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.Count === 0) {
      console.warn(`No models returned for make ID ${makeId}`);
      return [];
    }
    
    return data.Results || [];
  } catch (error) {
    console.error(`Failed to fetch models for make ${makeId}:`, error);
    throw error;
  }
}

/**
 * Fetch models for a specific make by name from NHTSA vPIC API
 */
export async function fetchModelsForMakeName(makeName: string): Promise<VPICModel[]> {
  try {
    const response = await fetch(`${VPIC_BASE_URL}/getmodelsformake/${encodeURIComponent(makeName)}?format=json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.Count === 0) {
      console.warn(`No models returned for make ${makeName}`);
      return [];
    }
    
    return data.Results || [];
  } catch (error) {
    console.error(`Failed to fetch models for make ${makeName}:`, error);
    throw error;
  }
}

/**
 * Get vehicle types for a specific make and model
 */
export async function getVehicleTypesForMakeModel(makeId: number, modelId: number): Promise<VPICVehicleType[]> {
  try {
    const response = await fetch(`${VPIC_BASE_URL}/getvehiclevariablevalueslist/Vehicle%20Type?make=${makeId}&model=${modelId}&format=json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: VPICVehicleTypeResponse = await response.json();
    if (data.Count === 0) {
      console.warn(`No vehicle types returned for make ${makeId}, model ${modelId}`);
      return [];
    }
    
    return data.Results || [];
  } catch (error) {
    console.error(`Failed to fetch vehicle types for make ${makeId}, model ${modelId}:`, error);
    throw error;
  }
}

/**
 * Check if a vehicle type indicates it's a passenger car
 */
export function isPassengerCar(vehicleTypes: VPICVehicleType[]): boolean {
  const carTypes = [
    'Passenger Car',
    'Sedan',
    'Coupe',
    'Convertible',
    'Hatchback',
    'Wagon',
    'Sport Utility Vehicle',
    'Pickup',
  ];
  
  return vehicleTypes.some(type => 
    carTypes.some(carType => 
      type.VehicleTypeName.toLowerCase().includes(carType.toLowerCase())
    )
  );
}

/**
 * Check if a make/model combination is likely a passenger car
 */
export async function isMakeModelPassengerCar(makeId: number, modelId: number): Promise<boolean> {
  try {
    const vehicleTypes = await getVehicleTypesForMakeModel(makeId, modelId);
    return isPassengerCar(vehicleTypes);
  } catch (error) {
    console.warn(`Could not verify vehicle type for make ${makeId}, model ${modelId}, assuming it's a car:`, error);
    return true; // Default to true if we can't verify
  }
}

/**
 * Add a small delay to respect API rate limits
 */
export async function delay(ms: number = 100): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
