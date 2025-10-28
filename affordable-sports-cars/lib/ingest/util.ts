/**
 * Utility functions for data normalization and sports car detection
 */

/**
 * Normalize make/model names for consistent matching
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if a model name suggests it's a sports car
 * This is a heuristic filter - easily editable for different criteria
 */
export function isSportsyModel(modelName: string): boolean {
  const normalized = normalizeName(modelName);
  
  // Sports car indicators (broadened list)
  const sportsKeywords = [
    // Porsche models
    'cayman', 'boxster', '911', 'carrera', 'turbo', 'gt3', 'gt2', 'spyder',
    
    // BMW models
    'm2', 'm3', 'm4', 'm5', 'm6', 'z3', 'z4', 'z8', 'i8',
    
    // Audi models
    'tt', 'r8', 'rs3', 'rs4', 'rs5', 'rs6', 'rs7', 's3', 's4', 's5',
    
    // Toyota models
    'supra', 'mr2', 'celica', '86', 'gr86', 'gr supra',
    
    // Nissan models
    'z', '370z', '350z', '300zx', '240z', 'gtr', 'skyline',
    
    // Chevrolet models
    'corvette', 'camaro', 'ss',
    
    // Ford models
    'mustang', 'gt', 'shelby',
    
    // Mazda models
    'miata', 'mx-5', 'rx-7', 'rx-8',
    
    // Honda models
    's2000', 'nsx', 'civic si', 'civic type r',
    
    // Subaru models
    'wrx', 'sti', 'brz',
    
    // Jaguar models
    'f-type', 'xe', 'xf',
    
    // Mercedes models
    'amg', 'sl', 'slk', 'slc',
    
    // Lexus models
    'is', 'gs', 'rc', 'lc',
    
    // Infiniti models
    'q50', 'q60', 'g35', 'g37',
    
    // Acura models
    'tl', 'tsx', 'ilx', 'rlx',
    
    // Volkswagen models
    'gti', 'golf r', 'gli', 'jetta gli',
    
    // Ferrari, Lamborghini, etc. (though these might be over $200k)
    'ferrari', 'lamborghini', 'mclaren', 'aston martin',
    
    // Generic sports terms
    'coupe', 'convertible', 'roadster', 'spider', 'spyder', 'sport', 'performance',
  ];
  
  return sportsKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Hero makes that we prioritize for ingestion
 */
export const HERO_MAKES = [
  'Porsche',
  'Audi', 
  'Toyota',
  'BMW',
  'Nissan',
  'Subaru',
  'Chevrolet',
  'Ford',
  'Mazda',
  'Honda',
  'Jaguar',
  'Mercedes-Benz',
  'Lexus',
  'Infiniti',
  'Acura',
];

/**
 * Check if a make is in our hero list
 */
export function isHeroMake(makeName: string): boolean {
  return HERO_MAKES.some(heroMake => 
    normalizeName(makeName) === normalizeName(heroMake)
  );
}

/**
 * Generate a unique identifier for a trim
 * Used for upsert operations
 */
export function generateTrimId(makeName: string, modelName: string, year: number, trimName: string): string {
  return `${normalizeName(makeName)}-${normalizeName(modelName)}-${year}-${normalizeName(trimName)}`;
}

/**
 * Safe number conversion with fallback
 */
export function safeNumber(value: any, fallback: number | null = null): number | null {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Safe string conversion with fallback
 */
export function safeString(value: any, fallback: string | null = null): string | null {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  const str = String(value).trim();
  return str === '' ? fallback : str;
}
