#!/usr/bin/env tsx

/**
 * Script to fetch and store car image URLs for all cars in the database.
 * Usage: npm run fetch-images
 * 
 * Requires UNSPLASH_ACCESS_KEY environment variable.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FuelEconomyVehicle {
  id: number;
  year: number;
  make: string;
  model: string;
}

interface FuelEconomyResponse {
  menuItem?: FuelEconomyVehicle[];
}

interface FuelEconomyVehicleDetail {
  id: number;
  year: number;
  make: string;
  model: string;
  VClass?: string;
  image?: {
    imageUrl?: string;
  };
}

interface UnsplashResponse {
  results: Array<{
    urls: {
      regular: string;
    };
  }>;
}

// Add delay to avoid API rate limits
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch image from FuelEconomy.gov API
async function fetchFuelEconomyImage(year: number, make: string, model: string): Promise<string | null> {
  try {
    // Step 1: Get vehicle options
    const optionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    const optionsResponse = await fetch(optionsUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!optionsResponse.ok) {
      return null;
    }

    const optionsData: FuelEconomyResponse = await optionsResponse.json();
    
    if (!optionsData.menuItem || optionsData.menuItem.length === 0) {
      return null;
    }

    // Step 2: Get vehicle details for the first vehicleId
    const vehicleId = optionsData.menuItem[0].id;
    const vehicleUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`;
    const vehicleResponse = await fetch(vehicleUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!vehicleResponse.ok) {
      return null;
    }

    const vehicleData: FuelEconomyVehicleDetail = await vehicleResponse.json();
    
    if (vehicleData.image?.imageUrl) {
      return vehicleData.image.imageUrl;
    }

    return null;
  } catch (error) {
    console.error(`  ⚠️  FuelEconomy API error for ${year} ${make} ${model}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Fetch image from Unsplash API
async function fetchUnsplashImage(year: number, make: string, model: string): Promise<string | null> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (!unsplashKey) {
    console.warn('  ⚠️  UNSPLASH_ACCESS_KEY not set in environment variables');
    return null;
  }

  try {
    const query = `${year} ${make} ${model} car`;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${unsplashKey}&per_page=1`;
    
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data: UnsplashResponse = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error(`  ⚠️  Unsplash API error for ${year} ${make} ${model}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Main function to fetch images for all cars
async function fetchCarImages() {
  console.log('🚗 Starting car image fetch...\n');

  try {
    // Get all unique (year, make, model) combinations from Trim table
    const trims = await prisma.trim.findMany({
      where: {
        imageUrl: null, // Only fetch for cars without images
      },
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { model: { make: { name: 'asc' } } },
        { model: { name: 'asc' } },
      ],
    });

    // Group by (year, make, model) to avoid duplicate API calls
    const uniqueCombinations = new Map<string, typeof trims>();
    
    for (const trim of trims) {
      const key = `${trim.year}-${trim.model.make.name}-${trim.model.name}`;
      if (!uniqueCombinations.has(key)) {
        uniqueCombinations.set(key, []);
      }
      uniqueCombinations.get(key)?.push(trim);
    }

    console.log(`📊 Found ${uniqueCombinations.size} unique car combinations to process`);
    console.log(`📊 Total trims to update: ${trims.length}\n`);

    let processed = 0;
    let success = 0;
    let failed = 0;

    for (const [key, trimGroup] of uniqueCombinations) {
      const firstTrim = trimGroup[0];
      const year = firstTrim.year;
      const make = firstTrim.model.make.name;
      const model = firstTrim.model.name;

      processed++;
      const progressStr = `[${processed}/${uniqueCombinations.size}]`;
      
      console.log(`${progressStr} Processing: ${year} ${make} ${model}`);

      let imageUrl: string | null = null;

      // Try FuelEconomy.gov first
      console.log(`  🔍 Trying FuelEconomy.gov...`);
      imageUrl = await fetchFuelEconomyImage(year, make, model);
      await delay(300); // Rate limit delay

      // If FuelEconomy fails, try Unsplash
      if (!imageUrl) {
        console.log(`  🔍 Trying Unsplash...`);
        imageUrl = await fetchUnsplashImage(year, make, model);
        await delay(300); // Rate limit delay
      }

      // If both fail, use placeholder
      if (!imageUrl) {
        console.log(`  📷 Using placeholder image`);
        imageUrl = '/placeholder-car.jpg';
        failed++;
      } else {
        success++;
      }

      // Update all trims with this (year, make, model) combination
      const trimIds = trimGroup.map(t => t.id);
      await prisma.trim.updateMany({
        where: {
          id: { in: trimIds },
        },
        data: {
          imageUrl,
        },
      });

      console.log(`  ✅ Updated ${trimIds.length} trim(s) → ${imageUrl.substring(0, 60)}${imageUrl.length > 60 ? '...' : ''}\n`);
    }

    console.log('\n🎉 Image fetch completed!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total combinations processed: ${processed}`);
    console.log(`   - Successfully fetched images: ${success}`);
    console.log(`   - Used placeholder: ${failed}`);

  } catch (error) {
    console.error('💥 Error during image fetch:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fetchCarImages().catch(console.error);

export { fetchCarImages };

