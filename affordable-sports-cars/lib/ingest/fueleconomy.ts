/**
 * FuelEconomy.gov API integration
 * Documentation: https://www.fueleconomy.gov/feg/ws/
 */

export interface FuelEconomyVehicle {
  id: number;
  make: string;
  model: string;
    year: number;
  fuelType: string;
  cityMpg: number;
  highwayMpg: number;
  combinedMpg: number;
}

export interface FuelEconomyResponse {
  vehicles: FuelEconomyVehicle[];
}

const FUELECONOMY_BASE_URL = 'https://www.fueleconomy.gov/ws/rest/vehicle';

/**
 * Search for vehicles by year, make, and model
 */
export async function searchVehiclesByMakeModel(year: number, make: string, model: string): Promise<FuelEconomyVehicle[]> {
  try {
    // FuelEconomy.gov API endpoint for searching vehicles
    const url = `${FUELECONOMY_BASE_URL}/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: FuelEconomyResponse = await response.json();
    
    if (!data.vehicles || data.vehicles.length === 0) {
      console.warn(`No fuel economy data found for ${year} ${make} ${model}`);
      return [];
    }
    
    return data.vehicles;
  } catch (error) {
    console.error(`Failed to fetch fuel economy data for ${year} ${make} ${model}:`, error);
    throw error;
  }
}

/**
 * Get detailed fuel economy data for a specific vehicle ID
 */
export async function getVehicleFuelEconomy(vehicleId: number): Promise<FuelEconomyVehicle | null> {
  try {
    const url = `${FUELECONOMY_BASE_URL}/${vehicleId}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      make: data.make,
      model: data.model,
      year: data.year,
      fuelType: data.fuelType,
      cityMpg: data.cityMpg,
      highwayMpg: data.highwayMpg,
      combinedMpg: data.combinedMpg,
    };
  } catch (error) {
    console.error(`Failed to fetch fuel economy details for vehicle ${vehicleId}:`, error);
    return null;
  }
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Find the best matching vehicle for MPG data with improved matching
 */
export async function findBestMPGMatch(
  year: number, 
  make: string, 
  model: string,
  engine?: string,
  transmission?: string
): Promise<{ cityMpg: number; highwayMpg: number } | null> {
  return withRetry(async () => {
    const vehicles = await searchVehiclesByMakeModel(year, make, model);
    
    if (vehicles.length === 0) {
      return null;
    }
    
    // Score vehicles based on engine and transmission matching
    const scoredVehicles = vehicles.map(vehicle => {
      let score = 0;
      
      // Prefer gasoline vehicles
      if (vehicle.fuelType.toLowerCase().includes('gasoline')) {
        score += 10;
      }
      
      // Match engine keywords if provided
      if (engine) {
        const engineLower = engine.toLowerCase();
        const vehicleEngine = vehicle.make.toLowerCase() + ' ' + vehicle.model.toLowerCase();
        
        if (engineLower.includes('turbo') && vehicleEngine.includes('turbo')) score += 5;
        if (engineLower.includes('v6') && vehicleEngine.includes('v6')) score += 5;
        if (engineLower.includes('v8') && vehicleEngine.includes('v8')) score += 5;
        if (engineLower.includes('4 cyl') && vehicleEngine.includes('4')) score += 3;
        if (engineLower.includes('6 cyl') && vehicleEngine.includes('6')) score += 3;
      }
      
      // Match transmission if provided
      if (transmission) {
        const transLower = transmission.toLowerCase();
        if (transLower.includes('manual') && vehicle.make.toLowerCase().includes('manual')) score += 2;
        if (transLower.includes('automatic') && vehicle.make.toLowerCase().includes('automatic')) score += 2;
      }
      
      return { vehicle, score };
    });
    
    // Sort by score and take the best match
    scoredVehicles.sort((a, b) => b.score - a.score);
    const bestMatch = scoredVehicles[0];
    
    return {
      cityMpg: bestMatch.vehicle.cityMpg,
      highwayMpg: bestMatch.vehicle.highwayMpg,
    };
  });
}

/**
 * Add a small delay to respect API rate limits
 */
export async function delay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
