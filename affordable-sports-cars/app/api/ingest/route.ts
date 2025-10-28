import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllMakes, fetchModelsForMakeName, delay as vpicDelay, isMakeModelPassengerCar } from "@/lib/ingest/vpic";
import { fetchTrimsForMakeModel, mapCarQueryTrimToSchema, delay as carqueryDelay, isValidCarTrim } from "@/lib/ingest/carquery";
import { findBestMPGMatch, delay as fueleconomyDelay } from "@/lib/ingest/fueleconomy";
import { isSportsyModel, isHeroMake, HERO_MAKES, generateTrimId } from "@/lib/ingest/util";
import { getEbayToken, searchEbayMotors, generateSearchQueries, mapEbayListingToSchema, delay as ebayDelay } from "@/lib/ingest/ebay";
import { parseListingTitle, findBestTrimMatch } from "@/lib/ingest/match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IngestStats {
  makesProcessed: number;
  modelsProcessed: number;
  trimsProcessed: number;
  mpgEnriched: number;
  listingsFetched: number;
  listingsLinked: number;
  listingsUnlinked: number;
  errors: string[];
}

/**
 * Main ETL pipeline for catalog ingestion
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage") || "catalog";
  
  if (!["catalog", "listings"].includes(stage)) {
    return NextResponse.json({ 
      ok: false, 
      error: `Unknown stage: ${stage}. Supported stages: 'catalog', 'listings'.` 
    }, { status: 400 });
  }

  console.log(`Starting ${stage} ingestion at ${new Date().toISOString()}`);
  
  const stats: IngestStats = {
    makesProcessed: 0,
    modelsProcessed: 0,
    trimsProcessed: 0,
    mpgEnriched: 0,
    listingsFetched: 0,
    listingsLinked: 0,
    listingsUnlinked: 0,
    errors: [],
  };

  try {
    if (stage === "catalog") {
      await runCatalogIngestion(stats);
    } else if (stage === "listings") {
      await runListingsIngestion(stats);
    }
    
    console.log(`Completed ${stage} ingestion:`, stats);
    
    return NextResponse.json({
      ok: true,
      stage,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error(`Failed ${stage} ingestion:`, error);
    
    return NextResponse.json({
      ok: false,
      stage,
      error: error instanceof Error ? error.message : "Unknown error",
      stats,
    }, { status: 500 });
  }
}

/**
 * Run the catalog ingestion process
 */
async function runCatalogIngestion(stats: IngestStats) {
  // Step 1: Process hero makes
  console.log("Processing hero makes...");
  for (const makeName of HERO_MAKES) {
    try {
      await processMake(makeName, stats);
      await vpicDelay(100); // Rate limiting
    } catch (error) {
      const errorMsg = `Failed to process make ${makeName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      stats.errors.push(errorMsg);
    }
  }
  
  console.log(`Catalog ingestion complete. Stats:`, stats);
}

/**
 * Process a single make: fetch models, filter sports cars, get trims
 */
async function processMake(makeName: string, stats: IngestStats) {
  console.log(`Processing make: ${makeName}`);
  
  // Upsert the make
  const make = await prisma.make.upsert({
    where: { name: makeName },
    update: {},
    create: { name: makeName },
  });
  
  stats.makesProcessed++;
  console.log(`✓ Upserted make: ${makeName} (ID: ${make.id})`);
  
  // Fetch models for this make
  const models = await fetchModelsForMakeName(makeName);
  console.log(`Found ${models.length} models for ${makeName}`);
  
  // Filter for sports cars
  const sportsModels = models.filter(model => isSportsyModel(model.Model_Name));
  console.log(`Filtered to ${sportsModels.length} sports models for ${makeName}`);
  
  // Process each sports model
  for (const modelData of sportsModels) {
    try {
      await processModel(make, modelData.Model_Name, stats);
      await carqueryDelay(200); // Rate limiting
    } catch (error) {
      const errorMsg = `Failed to process model ${makeName} ${modelData.Model_Name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      stats.errors.push(errorMsg);
    }
  }
}

/**
 * Process a single model: upsert model, fetch trims, enrich with MPG
 */
async function processModel(make: { id: number; name: string }, modelName: string, stats: IngestStats) {
  console.log(`Processing model: ${make.name} ${modelName}`);
  
  // Upsert the model
  const model = await prisma.model.upsert({
    where: { 
      name_makeId: {
        name: modelName,
        makeId: make.id,
      }
    },
    update: {},
    create: {
      name: modelName,
      makeId: make.id,
    },
  });
  
  stats.modelsProcessed++;
  console.log(`✓ Upserted model: ${make.name} ${modelName} (ID: ${model.id})`);
  
  // Fetch trims for this make/model
  const trims = await fetchTrimsForMakeModel(make.name, modelName);
  console.log(`Found ${trims.length} trims for ${make.name} ${modelName}`);
  
  // Filter for valid cars only
  const validTrims = trims.filter(isValidCarTrim);
  console.log(`Filtered to ${validTrims.length} valid car trims for ${make.name} ${modelName}`);
  
  // Process each valid trim
  for (const trimData of validTrims) {
    try {
      await processTrim(model, trimData, stats);
      await fueleconomyDelay(300); // Rate limiting
    } catch (error) {
      const errorMsg = `Failed to process trim ${make.name} ${modelName} ${trimData.model_trim}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      stats.errors.push(errorMsg);
    }
  }
}

/**
 * Process a single trim: upsert trim, enrich with MPG data
 */
async function processTrim(model: { id: number }, trimData: any, stats: IngestStats) {
  const trimSchema = mapCarQueryTrimToSchema(trimData);
  const trimId = generateTrimId(trimData.model_make_display, trimData.model_name, trimData.model_year, trimData.model_trim);
  
  console.log(`Processing trim: ${trimData.model_year} ${trimData.model_make_display} ${trimData.model_name} ${trimData.model_trim}`);
  
  // Upsert the trim
  const trim = await prisma.trim.upsert({
    where: {
      year_name_modelId: {
        year: trimSchema.year,
        name: trimSchema.name,
        modelId: model.id,
      }
    },
    update: {
      body: trimSchema.body,
      engine: trimSchema.engine,
      horsepower: trimSchema.horsepower,
      torque: trimSchema.torque,
      zeroToSixty: trimSchema.zeroToSixty,
      mpgCity: trimSchema.mpgCity,
      mpgHwy: trimSchema.mpgHwy,
    },
    create: {
      year: trimSchema.year,
      name: trimSchema.name,
      body: trimSchema.body,
      engine: trimSchema.engine,
      horsepower: trimSchema.horsepower,
      torque: trimSchema.torque,
      zeroToSixty: trimSchema.zeroToSixty,
      mpgCity: trimSchema.mpgCity,
      mpgHwy: trimSchema.mpgHwy,
      modelId: model.id,
    },
  });
  
  stats.trimsProcessed++;
  console.log(`✓ Upserted trim: ${trimSchema.year} ${trimData.model_make_display} ${trimData.model_name} ${trimSchema.name} (ID: ${trim.id})`);
  
  // Try to enrich with MPG data if not already present
  if (!trim.mpgCity || !trim.mpgHwy) {
    try {
      const mpgData = await findBestMPGMatch(
        trimSchema.year, 
        trimData.model_make_display, 
        trimData.model_name,
        trimSchema.engine || undefined,
        trimData.model_transmission_type || undefined
      );
      
      if (mpgData) {
        await prisma.trim.update({
          where: { id: trim.id },
          data: {
            mpgCity: mpgData.cityMpg,
            mpgHwy: mpgData.highwayMpg,
          },
        });
        
        stats.mpgEnriched++;
        console.log(`✓ Enriched MPG: ${mpgData.cityMpg}/${mpgData.highwayMpg} for ${trimSchema.year} ${trimData.model_make_display} ${trimData.model_name}`);
      }
    } catch (error) {
      console.warn(`Failed to enrich MPG for trim ${trim.id}:`, error);
    }
  }
}

/**
 * Run the listings ingestion process
 */
async function runListingsIngestion(stats: IngestStats) {
  console.log("Starting listings ingestion...");
  
  try {
    // Get eBay token
    const token = await getEbayToken();
    console.log("✓ Got eBay token");
    
    // Get high-priority trims for searching
    const trims = await prisma.trim.findMany({
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
      take: 50, // Limit for performance
      orderBy: {
        year: 'desc',
      },
    });
    
    console.log(`Found ${trims.length} trims to search for`);
    
    // Process each trim
    for (const trim of trims) {
      try {
        await processTrimListings(trim, token, stats);
        await ebayDelay(500); // Rate limiting
      } catch (error) {
        const errorMsg = `Failed to process listings for ${trim.model.make.name} ${trim.model.name} ${trim.year} ${trim.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }
    
    // Update trim statistics
    await updateTrimStatistics();
    
  } catch (error) {
    console.error("Failed to run listings ingestion:", error);
    throw error;
  }
}

/**
 * Process listings for a specific trim
 */
async function processTrimListings(
  trim: {
    id: number;
    year: number;
    name: string;
    model: {
      name: string;
      make: {
        name: string;
      };
    };
  },
  token: string,
  stats: IngestStats
) {
  const queries = generateSearchQueries(
    trim.model.make.name,
    trim.model.name,
    trim.year,
    trim.name
  );
  
  console.log(`Searching for ${trim.model.make.name} ${trim.model.name} ${trim.year} ${trim.name}`);
  
  for (const query of queries) {
    try {
      const response = await searchEbayMotors(query, token, 50, 0);
      
      if (response.itemSummaries.length === 0) {
        continue;
      }
      
      console.log(`Found ${response.itemSummaries.length} listings for query: ${query}`);
      
      // Process each listing
      for (const listing of response.itemSummaries) {
        try {
          await processListing(listing, trim, stats);
        } catch (error) {
          console.warn(`Failed to process listing ${listing.itemId}:`, error);
        }
      }
      
      stats.listingsFetched += response.itemSummaries.length;
      
    } catch (error) {
      console.warn(`Failed to search eBay for query "${query}":`, error);
    }
  }
}

/**
 * Process a single listing
 */
async function processListing(
  listing: any,
  trim: { id: number },
  stats: IngestStats
) {
  const listingData = mapEbayListingToSchema(listing);
  
  // Parse listing title for matching
  const parsedListing = parseListingTitle(listingData.title);
  
  // Find best matching trim
  const allTrims = await prisma.trim.findMany({
    include: {
      model: {
        include: {
          make: true,
        },
      },
    },
  });
  
  const match = findBestTrimMatch(parsedListing, allTrims);
  
  if (match && match.confidence >= 0.7) {
    listingData.trimId = match.trimId;
    listingData.confidence = match.confidence;
    stats.listingsLinked++;
  } else {
    stats.listingsUnlinked++;
  }
  
  // Upsert the listing
  await prisma.listing.upsert({
    where: { id: listingData.id },
    update: {
      title: listingData.title,
      price: listingData.price,
      url: listingData.url,
      image: listingData.image,
      location: listingData.location,
      postedAt: listingData.postedAt,
      trimId: listingData.trimId,
    },
    create: listingData,
  });
}

/**
 * Update trim statistics after listings ingestion
 */
async function updateTrimStatistics() {
  console.log("Updating trim statistics...");
  
  const trims = await prisma.trim.findMany({
    include: {
      listings: true,
    },
  });
  
  for (const trim of trims) {
    if (trim.listings.length === 0) {
      continue;
    }
    
    const prices = trim.listings.map(l => l.price).filter(p => p > 0);
    if (prices.length === 0) {
      continue;
    }
    
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    
    // Note: We'll need to add these fields to the schema
    // For now, we'll just log the statistics
    console.log(`Trim ${trim.id}: ${trim.listings.length} listings, price range: $${min} - $${max}, median: $${median}`);
  }
}
