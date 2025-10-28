# Scripts

This directory contains utility scripts for managing the car database.

## Available Scripts

### `fetchCarImages.ts`

Automatically fetches and stores car image URLs for all cars in the database.

**Usage:**
```bash
npm run fetch-images
```

**Environment Variables:**
- `UNSPLASH_ACCESS_KEY` - Required for Unsplash API (optional if FuelEconomy.gov provides images)

**What it does:**
1. Queries all cars without images from the database
2. For each unique (year, make, model) combination:
   - First tries FuelEconomy.gov API
   - Falls back to Unsplash API if needed
   - Uses placeholder image if both fail
3. Updates all matching trim records with the image URL
4. Includes rate limiting (300ms delay between requests)
5. Logs progress to console

**Before running:**
1. Make sure you've applied the latest Prisma migration:
   ```bash
   npm run db:migrate
   ```
2. Set the `UNSPLASH_ACCESS_KEY` environment variable (optional)

**Example output:**
```
🚗 Starting car image fetch...

📊 Found 45 unique car combinations to process
📊 Total trims to update: 147

[1/45] Processing: 2017 Porsche Boxster
  🔍 Trying FuelEconomy.gov...
  ✅ Updated 3 trim(s) → https://www.fueleconomy.gov/...

[2/45] Processing: 2018 BMW Z4
  🔍 Trying FuelEconomy.gov...
  🔍 Trying Unsplash...
  ✅ Updated 2 trim(s) → https://images.unsplash.com/...
```

### `ingest.ts`

Runs the data ingestion pipeline for car listings.

**Usage:**
```bash
npm run ingest
```

## Notes

- All scripts use `tsx` for TypeScript execution
- Scripts connect to the database using Prisma
- Make sure your database is running and `DATABASE_URL` is set

