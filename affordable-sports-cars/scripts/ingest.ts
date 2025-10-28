#!/usr/bin/env tsx

/**
 * Local ingestion script for testing the ETL pipeline
 * Usage: npm run ingest
 */

// Using native fetch (available in Node.js 18+)

const BASE_URL = process.env.INGEST_BASE_URL || 'http://localhost:3000';

async function runIngestion() {
  console.log('🚀 Starting local ingestion...');
  console.log(`📡 Calling: ${BASE_URL}/api/ingest?stage=catalog`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/ingest?stage=catalog`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.ok) {
      console.log('✅ Ingestion completed successfully!');
      console.log('📊 Stats:', result.stats);
    } else {
      console.error('❌ Ingestion failed:', result.error);
      if (result.stats?.errors?.length > 0) {
        console.error('🔍 Errors:', result.stats.errors);
      }
    }
  } catch (error) {
    console.error('💥 Failed to run ingestion:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngestion();
}
