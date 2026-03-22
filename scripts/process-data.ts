import fs from "fs";
import path from "path";
import { Command } from "commander";
import { downloadAll, getCachePath, cacheFileExists } from "./download.ts";
import { parseLocations } from "./parse-locations.ts";
import { processMonthlyTransactions } from "./process-monthly.ts";
import { processDailyTransactions } from "./process-daily.ts";
import { processCitations } from "./process-citations.ts";
import { processPaymentMethods } from "./process-payments.ts";
import { buildMeterLocations } from "./build-locations.ts";
import { buildMetadata } from "./build-metadata.ts";
import { buildZonePricing } from "./build-zone-pricing.ts";
import { fetchPadresSchedule } from "./fetch-schedule.ts";
import { processGameday } from "./process-gameday.ts";
import { processHourlyActivity, loadGameDates } from "./process-hourly.ts";

const OUTPUT_DIR = path.join(import.meta.dirname, "..", "public", "data");

const program = new Command();
program
  .option("--skip-raw", "Skip raw transaction processing (payment methods)")
  .option("--skip-schedule", "Skip Padres schedule fetch (game day analysis)")
  .option("--years <years>", "Comma-separated years to process", "2023,2024,2025,2026")
  .option("--force-download", "Re-download all files even if cached")
  .parse(process.argv);

const opts = program.opts();
const years = opts.years.split(",").map(Number);
const includeRaw = !opts.skipRaw;
const includeSchedule = !opts.skipSchedule;
const forceDownload = opts.forceDownload || false;

async function main() {
  console.log("=== SD Parking Meter Data Pipeline ===\n");
  console.log(`Years: ${years.join(", ")}`);
  console.log(`Include raw data: ${includeRaw}`);
  console.log(`Include schedule: ${includeSchedule}`);
  console.log(`Force download: ${forceDownload}\n`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Stage 1: Download
  console.log("--- Stage 1: Download ---");
  await downloadAll(years, includeRaw, forceDownload);

  // Stage 2: Parse locations
  console.log("--- Stage 2: Parse Locations ---");
  const locationsPath = getCachePath("parking_meters_current.csv");
  if (!fs.existsSync(locationsPath)) {
    throw new Error("Meter locations file not downloaded!");
  }
  const { poleToLocation, addressToZone, streetToZone, zoneBreakdown } =
    parseLocations(locationsPath);

  // Stage 3: Process monthly transactions
  console.log("\n--- Stage 3: Monthly Transactions ---");
  const monthlyFiles = years
    .map((year) => ({
      filepath: getCachePath(`monthly_transactions_${year}.csv`),
      year,
    }))
    .filter((f) => fs.existsSync(f.filepath));
  const monthlyRecords = processMonthlyTransactions(
    monthlyFiles,
    poleToLocation
  );
  writeJSON("monthly-revenue.json", monthlyRecords);

  // Stage 4: Process daily transactions
  console.log("\n--- Stage 4: Daily Transactions ---");
  const dailyFiles = years
    .filter((y) => y >= 2024)
    .map((year) => ({
      filepath: getCachePath(`daily_transactions_${year}.csv`),
      year,
    }))
    .filter((f) => fs.existsSync(f.filepath));
  const { daily, dowHeatmap } = processDailyTransactions(
    dailyFiles,
    poleToLocation
  );
  writeJSON("daily-summary.json", daily);
  writeJSON("dow-heatmap.json", dowHeatmap);

  // Stage 5: Process citations
  console.log("\n--- Stage 5: Citations ---");
  const citationFiles: string[] = [];
  for (const year of years) {
    for (const part of [1, 2]) {
      const fp = getCachePath(`citations_${year}_part${part}.csv`);
      if (fs.existsSync(fp)) citationFiles.push(fp);
    }
  }
  const citationRecords = processCitations(citationFiles, addressToZone, streetToZone);
  writeJSON("citations-monthly.json", citationRecords);

  // Stage 6: Process raw data (payment methods + hourly activity)
  if (includeRaw) {
    const rawFiles = years
      .filter((y) => y >= 2024 && y <= 2025)
      .map((year) => ({
        filepath: getCachePath(`raw_transactions_${year}.csv`),
        year,
      }))
      .filter((f) => cacheFileExists(f.filepath.split("/").pop()!));

    if (rawFiles.length > 0) {
      console.log("\n--- Stage 6a: Payment Methods (Raw Data) ---");
      const paymentRecords = processPaymentMethods(rawFiles, poleToLocation);
      writeJSON("payment-methods.json", paymentRecords);

      console.log("\n--- Stage 6b: Hourly Activity (Raw Data) ---");
      const cacheDir = path.join(import.meta.dirname, "cache");
      const gameDates = loadGameDates(cacheDir, years.filter((y) => y >= 2024 && y <= 2025));
      const hourlyRecords = processHourlyActivity(rawFiles, poleToLocation, gameDates);
      writeJSON("hourly-activity.json", hourlyRecords);
    } else {
      console.log("\n--- Stage 6: Raw Data (Skipped — no files found) ---");
    }
  } else {
    console.log("\n--- Stage 6: Raw Data (Skipped) ---");
  }

  // Stage 7: Padres game day analysis (optional)
  if (includeSchedule) {
    console.log("\n--- Stage 7: Padres Game Day Analysis ---");
    try {
      const scheduleYears = years.filter((y) => y >= 2024 && y <= 2025);
      const schedules = new Map<number, Awaited<ReturnType<typeof fetchPadresSchedule>>>();
      for (const year of scheduleYears) {
        const games = await fetchPadresSchedule(year);
        schedules.set(year, games);
      }
      const gamedayOutput = processGameday(daily, schedules);
      writeJSON("gameday-stats.json", gamedayOutput);
    } catch (err) {
      console.warn("  Warning: Game day processing failed:", (err as Error).message);
      console.warn("  Skipping gameday-stats.json. Use --skip-schedule to suppress.");
    }
  } else {
    console.log("\n--- Stage 7: Padres Game Day Analysis (Skipped) ---");
  }

  // Stage 8: Build zone pricing
  console.log("\n--- Stage 8: Zone Pricing ---");
  const zonePricing = buildZonePricing(poleToLocation);
  writeJSON("zone-pricing.json", zonePricing);

  // Stage 9: Build meter locations
  console.log("\n--- Stage 9: Meter Locations ---");
  const meterLocations = buildMeterLocations(poleToLocation, monthlyRecords);
  writeJSON("meter-locations.json", meterLocations);

  // Stage 10: Build metadata
  console.log("\n--- Stage 10: Metadata ---");
  const metadata = buildMetadata(monthlyRecords, zoneBreakdown);
  writeJSON("metadata.json", metadata);

  // Summary
  console.log("\n=== Pipeline Complete ===\n");
  const files = fs.readdirSync(OUTPUT_DIR);
  let totalSize = 0;
  for (const file of files) {
    const size = fs.statSync(path.join(OUTPUT_DIR, file)).size;
    totalSize += size;
    console.log(`  ${file}: ${formatSize(size)}`);
  }
  console.log(`\n  Total: ${formatSize(totalSize)}`);
}

function writeJSON(filename: string, data: unknown) {
  const filepath = path.join(OUTPUT_DIR, filename);
  const json = JSON.stringify(data);
  fs.writeFileSync(filepath, json);
  console.log(`  -> ${filename} (${formatSize(json.length)})`);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

main().catch((err) => {
  console.error("\nPipeline failed:", err);
  process.exit(1);
});
