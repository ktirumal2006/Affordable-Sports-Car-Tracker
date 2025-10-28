/**
 * eBay Motors Browse API integration
 * Documentation: https://developer.ebay.com/api-docs/buy/browse/overview.html
 */

export interface EbayListing {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  itemWebUrl: string;
  image?: {
    imageUrl: string;
  };
  itemLocation?: {
    city: string;
    stateOrProvince: string;
    country: string;
  };
  condition?: string;
  listingMarketplaceId?: string;
  seller?: {
    username: string;
  };
  buyingOptions?: string[];
  itemEndDate?: string;
}

export interface EbaySearchResponse {
  itemSummaries: EbayListing[];
  total: number;
  limit: number;
  offset: number;
}

export interface EbayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const EBAY_BASE_URL = 'https://api.ebay.com';
const EBAY_OAUTH_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

/**
 * Get OAuth2 client credentials token for eBay Browse API
 */
export async function getEbayToken(): Promise<string> {
  const appId = process.env.EBAY_APP_ID;
  const appSecret = process.env.EBAY_APP_SECRET;
  
  if (!appId || !appSecret) {
    throw new Error('EBAY_APP_ID and EBAY_APP_SECRET must be set in environment variables');
  }
  
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  
  const response = await fetch(EBAY_OAUTH_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get eBay token: ${response.status} ${response.statusText}`);
  }
  
  const data: EbayTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Search eBay Motors for vehicles
 */
export async function searchEbayMotors(
  query: string,
  token: string,
  limit: number = 50,
  offset: number = 0
): Promise<EbaySearchResponse> {
  const searchUrl = new URL(`${EBAY_BASE_URL}/buy/browse/v1/item_summary/search`);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('category_ids', '6001'); // eBay Motors category
  searchUrl.searchParams.set('limit', limit.toString());
  searchUrl.searchParams.set('offset', offset.toString());
  searchUrl.searchParams.set('sort', 'price');
  searchUrl.searchParams.set('filter', 'conditionIds:{3000|4000|5000}'); // Used, Very Good, Excellent
  
  const response = await fetch(searchUrl.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`eBay search failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Generate search queries for a make/model/trim combination
 */
export function generateSearchQueries(
  make: string,
  model: string,
  year?: number,
  trim?: string
): string[] {
  const queries: string[] = [];
  
  // Base query with year range
  if (year) {
    const yearRange = `${year - 1} ${year} ${year + 1}`;
    queries.push(`${yearRange} ${make} ${model}`);
    
    if (trim && trim !== 'Base') {
      queries.push(`${yearRange} ${make} ${model} ${trim}`);
    }
  } else {
    queries.push(`${make} ${model}`);
    
    if (trim && trim !== 'Base') {
      queries.push(`${make} ${model} ${trim}`);
    }
  }
  
  // Add common sports car keywords
  const sportsKeywords = ['sport', 'performance', 'turbo', 'manual', 'automatic'];
  sportsKeywords.forEach(keyword => {
    if (year) {
      queries.push(`${year} ${make} ${model} ${keyword}`);
    } else {
      queries.push(`${make} ${model} ${keyword}`);
    }
  });
  
  return queries.slice(0, 3); // Limit to 3 queries per model
}

/**
 * Convert eBay listing to our database schema
 */
export function mapEbayListingToSchema(listing: EbayListing) {
  const price = parseFloat(listing.price.value);
  const currency = listing.price.currency;
  
  // Convert to USD if needed (simplified - in production you'd want proper currency conversion)
  let priceUSD = price;
  if (currency === 'CAD') {
    priceUSD = price * 0.75; // Approximate CAD to USD conversion
  } else if (currency === 'EUR') {
    priceUSD = price * 1.1; // Approximate EUR to USD conversion
  }
  
  return {
    id: listing.itemId,
    source: 'ebay',
    title: listing.title,
    price: Math.round(priceUSD),
    url: listing.itemWebUrl,
    image: listing.image?.imageUrl || null,
    location: listing.itemLocation ? 
      `${listing.itemLocation.city}, ${listing.itemLocation.stateOrProvince}` : 
      null,
    postedAt: listing.itemEndDate ? new Date(listing.itemEndDate) : null,
    trimId: null as number | null, // Will be filled by matching logic
    confidence: 0 as number, // Will be calculated by matching logic
  };
}

/**
 * Add a small delay to respect API rate limits
 */
export async function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
