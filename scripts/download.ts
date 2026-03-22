import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(import.meta.dirname, "cache");

const BASE = "https://seshat.datasd.org";

interface DownloadSpec {
  url: string;
  filename: string;
  optional?: boolean;
}

function buildDownloadList(
  years: number[],
  includeRaw: boolean
): DownloadSpec[] {
  const specs: DownloadSpec[] = [];

  // Meter locations (always)
  specs.push({
    url: `${BASE}/parking_meters_locations/parking_meters_current.csv`,
    filename: "parking_meters_current.csv",
  });

  for (const year of years) {
    // Monthly transactions
    specs.push({
      url: `${BASE}/parking_meters_transactions_monthly/treas_meters_${year}_pole_by_month_datasd.csv`,
      filename: `monthly_transactions_${year}.csv`,
      optional: true,
    });

    // Daily transactions (only 2024+)
    if (year >= 2024) {
      specs.push({
        url: `${BASE}/parking_meters_transactions_daily/treas_meters_${year}_pole_by_mo_day_datasd.csv`,
        filename: `daily_transactions_${year}.csv`,
        optional: true,
      });
    }

    // Citations (part 1 and 2)
    specs.push({
      url: `${BASE}/parking_citations/parking_citations_${year}_part1_datasd.csv`,
      filename: `citations_${year}_part1.csv`,
      optional: true,
    });
    specs.push({
      url: `${BASE}/parking_citations/parking_citations_${year}_part2_datasd.csv`,
      filename: `citations_${year}_part2.csv`,
      optional: true,
    });

    // Raw transactions (large files, optional)
    if (includeRaw && year >= 2024 && year <= 2025) {
      specs.push({
        url: `${BASE}/parking_meters_transactions/treas_parking_payments_${year}_datasd.csv`,
        filename: `raw_transactions_${year}.csv`,
        optional: true,
      });
    }
  }

  return specs;
}

async function downloadFile(
  spec: DownloadSpec,
  forceDownload: boolean
): Promise<boolean> {
  const filepath = path.join(CACHE_DIR, spec.filename);

  // Check cache (skip if not forcing and file exists)
  if (!forceDownload && fs.existsSync(filepath)) {
    const stat = fs.statSync(filepath);
    if (stat.size > 0) {
      console.log(`  [cached] ${spec.filename} (${formatSize(stat.size)})`);
      return true;
    }
  }

  console.log(`  [downloading] ${spec.filename}...`);

  try {
    const response = await fetch(spec.url);

    if (response.status === 404 || response.status === 403) {
      if (spec.optional) {
        console.log(`  [skipped] ${spec.filename} (${response.status})`);
        return false;
      }
      throw new Error(`HTTP ${response.status} for ${spec.url}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${spec.url}`);
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(
      `  [done] ${spec.filename} (${formatSize(buffer.byteLength)})`
    );
    return true;
  } catch (err) {
    if (spec.optional) {
      console.log(
        `  [skipped] ${spec.filename} (${err instanceof Error ? err.message : err})`
      );
      return false;
    }
    throw err;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export async function downloadAll(
  years: number[],
  includeRaw: boolean,
  forceDownload: boolean
): Promise<void> {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const specs = buildDownloadList(years, includeRaw);
  console.log(`\nDownloading ${specs.length} files...\n`);

  // Download sequentially to avoid overwhelming the server
  for (const spec of specs) {
    await downloadFile(spec, forceDownload);
  }

  console.log("\nDownload complete.\n");
}

export function getCachePath(filename: string): string {
  return path.join(CACHE_DIR, filename);
}

export function cacheFileExists(filename: string): boolean {
  const filepath = path.join(CACHE_DIR, filename);
  return fs.existsSync(filepath) && fs.statSync(filepath).size > 0;
}
