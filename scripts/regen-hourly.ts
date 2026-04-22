/**
 * Standalone script to regenerate hourly-activity.json without running
 * the full pipeline. Reads cached raw files + locations.
 */
import fs from "fs";
import path from "path";
import { parseLocations } from "./parse-locations.ts";
import { processHourlyActivity, loadGameDates } from "./process-hourly.ts";

const CACHE_DIR = path.join(import.meta.dirname, "cache");
const OUTPUT = path.join(import.meta.dirname, "..", "public", "data", "hourly-activity.json");

const locationsPath = path.join(CACHE_DIR, "parking_meters_current.csv");
if (!fs.existsSync(locationsPath)) {
  console.error("Locations file not found:", locationsPath);
  process.exit(1);
}

console.log("Parsing locations...");
const { poleToLocation } = parseLocations(locationsPath);
console.log(`  ${poleToLocation.size} meter poles loaded`);

const rawFiles = [2024, 2025].flatMap((year) => {
  const fp = path.join(CACHE_DIR, `raw_transactions_${year}.csv`);
  if (!fs.existsSync(fp)) {
    console.log(`  [skip] No raw file for ${year}`);
    return [];
  }
  return [{ filepath: fp, year }];
});

if (rawFiles.length === 0) {
  console.error("No raw files found in cache!");
  process.exit(1);
}

console.log(`\nProcessing ${rawFiles.length} raw file(s)...`);
const gameDates = loadGameDates(CACHE_DIR, [2024, 2025]);
console.log(`  ${gameDates.size} Padres game dates loaded`);

const records = processHourlyActivity(rawFiles, poleToLocation, gameDates);

fs.writeFileSync(OUTPUT, JSON.stringify(records));
console.log(`\nWrote ${records.length} records → ${OUTPUT}`);
