/**
 * CarQuery API integration
 * Documentation: https://www.carqueryapi.com/
 */

export interface CarQueryTrim {
  model_year: number;
  model_make_id: string;
  model_name: string;
  model_trim: string;
  model_body: string;
  model_engine_position: string;
  model_engine_cc: number;
  model_engine_cyl: number;
  model_engine_type: string;
  model_engine_valves_per_cyl: number;
  model_engine_power_ps: number;
  model_engine_power_rpm: number;
  model_engine_torque_nm: number;
  model_engine_torque_rpm: number;
  model_engine_bore_mm: number;
  model_engine_stroke_mm: number;
  model_engine_compression: string;
  model_engine_fuel: string;
  model_top_speed_kph: number;
  model_0_to_100_kph: number;
  model_drive: string;
  model_transmission_type: string;
  model_seats: number;
  model_doors: number;
  model_weight_kg: number;
  model_length_mm: number;
  model_width_mm: number;
  model_height_mm: number;
  model_wheelbase_mm: number;
  model_lkm_hwy: number;
  model_lkm_mixed: number;
  model_lkm_city: number;
  model_fuel_cap_l: number;
  model_sold_in_us: boolean;
  model_co2: number;
  model_make_display: string;
}

export interface CarQueryResponse {
  Models: CarQueryTrim[];
}

const CARQUERY_BASE_URL = 'https://www.carqueryapi.com/api/0.3';

/**
 * Fetch trims for a specific make and model from CarQuery API
 */
export async function fetchTrimsForMakeModel(make: string, model: string): Promise<CarQueryTrim[]> {
  try {
    const url = `${CARQUERY_BASE_URL}/?cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: CarQueryResponse = await response.json();
    
    if (!data.Models || data.Models.length === 0) {
      console.warn(`No trims found for ${make} ${model}`);
      return [];
    }
    
    return data.Models;
  } catch (error) {
    console.error(`Failed to fetch trims for ${make} ${model}:`, error);
    throw error;
  }
}

/**
 * Car body types that we consider valid cars
 */
export const VALID_CAR_BODIES = [
  'coupe',
  'convertible', 
  'roadster',
  'hatchback',
  'sedan',
  'fastback',
  'liftback',
  'wagon',
  'suv',
  'pickup',
];

/**
 * Check if a CarQuery trim represents a valid car
 */
export function isValidCarTrim(trim: CarQueryTrim): boolean {
  // Check body type
  const body = trim.model_body?.toLowerCase();
  if (!body || !VALID_CAR_BODIES.includes(body)) {
    return false;
  }
  
  // Exclude motorcycles, ATVs, scooters, UTVs
  const excludeKeywords = ['motorcycle', 'atv', 'scooter', 'utv', 'quad', 'bike', 'moped'];
  const name = trim.model_name?.toLowerCase() || '';
  const trimName = trim.model_trim?.toLowerCase() || '';
  const engineType = trim.model_engine_type?.toLowerCase() || '';
  
  if (excludeKeywords.some(keyword => 
    name.includes(keyword) || trimName.includes(keyword) || engineType.includes(keyword)
  )) {
    return false;
  }
  
  // Optional heuristic: doors >= 2 OR seats >= 2
  const doors = trim.model_doors || 0;
  const seats = trim.model_seats || 0;
  
  if (doors < 2 && seats < 2) {
    return false;
  }
  
  return true;
}

/**
 * Convert CarQuery trim data to our database schema
 */
export function mapCarQueryTrimToSchema(trim: CarQueryTrim) {
  return {
    year: trim.model_year,
    name: trim.model_trim || 'Base',
    body: trim.model_body || null,
    engine: trim.model_engine_type ? `${trim.model_engine_cyl} cyl ${trim.model_engine_type}` : null,
    horsepower: trim.model_engine_power_ps ? Math.round(trim.model_engine_power_ps * 0.9863) : null, // PS to HP conversion
    torque: trim.model_engine_torque_nm ? Math.round(trim.model_engine_torque_nm * 0.7376) : null, // Nm to lb-ft conversion
    zeroToSixty: trim.model_0_to_100_kph ? trim.model_0_to_100_kph / 3.6 : null, // Convert to seconds
    mpgCity: trim.model_lkm_city ? Math.round(235.214 / trim.model_lkm_city) : null, // L/100km to MPG
    mpgHwy: trim.model_lkm_hwy ? Math.round(235.214 / trim.model_lkm_hwy) : null, // L/100km to MPG
  };
}

/**
 * Add a small delay to respect API rate limits
 */
export async function delay(ms: number = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
