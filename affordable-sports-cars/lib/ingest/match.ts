/**
 * Listing to Trim confidence matching utilities
 */

export interface TrimMatch {
  trimId: number;
  confidence: number;
  reasons: string[];
}

export interface ParsedListing {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  engine?: string | null;
  transmission?: string | null;
  body?: string | null;
  doors?: number | null;
  seats?: number | null;
}

/**
 * Normalize text for matching
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract year from text
 */
export function extractYear(text: string): number | null {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? parseInt(yearMatch[0]) : null;
}

/**
 * Extract make from text (common car makes)
 */
export function extractMake(text: string): string | null {
  const makes = [
    'porsche', 'bmw', 'audi', 'mercedes', 'lexus', 'infiniti', 'acura',
    'toyota', 'honda', 'nissan', 'mazda', 'subaru', 'mitsubishi',
    'chevrolet', 'ford', 'dodge', 'chrysler', 'jeep', 'cadillac',
    'jaguar', 'land rover', 'volvo', 'saab', 'alfa romeo', 'maserati',
    'ferrari', 'lamborghini', 'mclaren', 'aston martin', 'bentley',
    'rolls royce', 'bugatti', 'koenigsegg', 'pagani'
  ];
  
  const normalized = normalizeText(text);
  for (const make of makes) {
    if (normalized.includes(make)) {
      return make;
    }
  }
  
  return null;
}

/**
 * Extract model from text (common sports car models)
 */
export function extractModel(text: string): string | null {
  const models = [
    'cayman', 'boxster', '911', 'carrera', 'panamera', 'macan', 'cayenne',
    'm2', 'm3', 'm4', 'm5', 'm6', 'z3', 'z4', 'z8', 'i8', 'x3', 'x5',
    'tt', 'r8', 'rs3', 'rs4', 'rs5', 'rs6', 'rs7', 's3', 's4', 's5',
    'supra', 'mr2', 'celica', '86', 'gr86', 'gr supra',
    'z', '370z', '350z', '300zx', '240z', 'gtr', 'skyline', 'altima',
    'corvette', 'camaro', 'ss', 'malibu', 'impala',
    'mustang', 'gt', 'shelby', 'focus', 'fiesta',
    'miata', 'mx-5', 'rx-7', 'rx-8', 'mazda3', 'mazda6',
    's2000', 'nsx', 'civic', 'accord', 'prelude',
    'wrx', 'sti', 'brz', 'impreza', 'legacy',
    'f-type', 'xe', 'xf', 'xj', 'xk',
    'amg', 'sl', 'slk', 'slc', 'cls', 'e-class', 's-class',
    'is', 'gs', 'ls', 'rc', 'lc', 'nx', 'rx', 'gx', 'lx',
    'q50', 'q60', 'q70', 'g35', 'g37', 'fx', 'qx',
    'tl', 'tsx', 'ilx', 'rlx', 'rdx', 'mdx'
  ];
  
  const normalized = normalizeText(text);
  for (const model of models) {
    if (normalized.includes(model)) {
      return model;
    }
  }
  
  return null;
}

/**
 * Extract trim information from text
 */
export function extractTrim(text: string): string | null {
  const trimKeywords = [
    'base', 'sport', 'performance', 'premium', 'luxury', 'limited',
    'turbo', 'supercharged', 'competition', 'track', 'racing',
    'manual', 'automatic', 'cvt', 'dsg', 'pdk',
    'coupe', 'convertible', 'roadster', 'sedan', 'hatchback',
    'awd', 'rwd', 'fwd', '4wd', '2wd'
  ];
  
  const normalized = normalizeText(text);
  for (const keyword of trimKeywords) {
    if (normalized.includes(keyword)) {
      return keyword;
    }
  }
  
  return null;
}

/**
 * Extract engine information from text
 */
export function extractEngine(text: string): string | null {
  const enginePatterns = [
    /\b(\d+\.?\d*)\s*l\b/i, // Liter displacement
    /\b(\d+)\s*cyl\b/i, // Cylinder count
    /\b(v\d+|i\d+|h\d+|w\d+)\b/i, // Engine configuration
    /\bturbo\b/i,
    /\bsupercharged\b/i,
    /\bhybrid\b/i,
    /\belectric\b/i
  ];
  
  for (const pattern of enginePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Parse a listing title to extract vehicle information
 */
export function parseListingTitle(title: string): ParsedListing {
  const normalized = normalizeText(title);
  
  return {
    year: extractYear(title),
    make: extractMake(title),
    model: extractModel(title),
    trim: extractTrim(title),
    engine: extractEngine(title),
    transmission: normalized.includes('manual') ? 'manual' : 
                  normalized.includes('automatic') ? 'automatic' : null,
    body: normalized.includes('coupe') ? 'coupe' :
          normalized.includes('convertible') ? 'convertible' :
          normalized.includes('sedan') ? 'sedan' :
          normalized.includes('hatchback') ? 'hatchback' : null,
  };
}

/**
 * Calculate confidence score for matching a listing to a trim
 */
export function calculateConfidence(
  listing: ParsedListing,
  trim: {
    id: number;
    year: number;
    name: string;
    body: string | null;
    engine: string | null;
    model: {
      name: string;
      make: {
        name: string;
      };
    };
  }
): TrimMatch {
  let confidence = 0;
  const reasons: string[] = [];
  
  // Year match (weight: 0.3)
  if (listing.year && Math.abs(listing.year - trim.year) <= 1) {
    confidence += 0.3;
    reasons.push(`Year match: ${listing.year} vs ${trim.year}`);
  } else if (listing.year) {
    reasons.push(`Year mismatch: ${listing.year} vs ${trim.year}`);
  }
  
  // Make match (weight: 0.2)
  if (listing.make && normalizeText(trim.model.make.name).includes(listing.make)) {
    confidence += 0.2;
    reasons.push(`Make match: ${listing.make}`);
  } else if (listing.make) {
    reasons.push(`Make mismatch: ${listing.make} vs ${trim.model.make.name}`);
  }
  
  // Model match (weight: 0.2)
  if (listing.model && normalizeText(trim.model.name).includes(listing.model)) {
    confidence += 0.2;
    reasons.push(`Model match: ${listing.model}`);
  } else if (listing.model) {
    reasons.push(`Model mismatch: ${listing.model} vs ${trim.model.name}`);
  }
  
  // Trim match (weight: 0.15)
  if (listing.trim && normalizeText(trim.name).includes(listing.trim)) {
    confidence += 0.15;
    reasons.push(`Trim match: ${listing.trim}`);
  }
  
  // Body match (weight: 0.1)
  if (listing.body && trim.body && normalizeText(trim.body).includes(listing.body)) {
    confidence += 0.1;
    reasons.push(`Body match: ${listing.body}`);
  }
  
  // Engine match (weight: 0.05)
  if (listing.engine && trim.engine && normalizeText(trim.engine).includes(listing.engine)) {
    confidence += 0.05;
    reasons.push(`Engine match: ${listing.engine}`);
  }
  
  return {
    trimId: trim.id,
    confidence: Math.min(confidence, 1.0),
    reasons,
  };
}

/**
 * Find the best matching trim for a listing
 */
export function findBestTrimMatch(
  listing: ParsedListing,
  trims: Array<{
    id: number;
    year: number;
    name: string;
    body: string | null;
    engine: string | null;
    model: {
      name: string;
      make: {
        name: string;
      };
    };
  }>
): TrimMatch | null {
  if (trims.length === 0) {
    return null;
  }
  
  const matches = trims.map(trim => calculateConfidence(listing, trim));
  matches.sort((a, b) => b.confidence - a.confidence);
  
  const bestMatch = matches[0];
  
  // Only return matches with confidence >= 0.7
  if (bestMatch.confidence >= 0.7) {
    return bestMatch;
  }
  
  return null;
}
