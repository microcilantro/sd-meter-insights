import fs from "fs";
import Papa from "papaparse";
import type { RawTransactionRow, MeterLocation } from "./types.ts";

export interface HourlyRecord {
  hour: number;         // 0–23
  dow: number;          // 0=Sun, 1=Mon, … 6=Sat
  zone: string;
  isGameDay: boolean;
  period: "pre-reform" | "post-reform";
  avgTrans: number;
  sampleDays: number;
}

/**
 * Processes raw transaction files to build hourly activity profiles.
 *
 * Aggregation key: (hour, dow, zone, isGameDay, period)
 * Output: average transactions per hour for each bucket.
 *
 * "pre-reform"  = before Feb 2025 (rates doubled Jan 31 2025)
 * "post-reform" = Feb 2025 onwards
 *
 * isGameDay is only tagged for Downtown zone on Padres home game dates.
 */
export function processHourlyActivity(
  filepaths: { filepath: string; year: number }[],
  poleToLocation: Map<string, MeterLocation>,
  gameDates: Set<string>   // "YYYY-MM-DD" strings of Padres home games
): HourlyRecord[] {
  // key → { totalTrans, uniqueDates: Set<string> }
  const agg = new Map<string, { totalTrans: number; dates: Set<string> }>();

  const zones = ["All", "Downtown", "Uptown", "Mid-City", "Pacific Beach", "City", "Balboa Park"];

  function getOrCreate(key: string) {
    let entry = agg.get(key);
    if (!entry) {
      entry = { totalTrans: 0, dates: new Set() };
      agg.set(key, entry);
    }
    return entry;
  }

  for (const { filepath, year } of filepaths) {
    if (!fs.existsSync(filepath)) {
      console.log(`  [skipped] Raw file not found: ${filepath.split("/").pop()}`);
      continue;
    }

    console.log(`  Processing hourly data for ${year}...`);

    const csv = fs.readFileSync(filepath, "utf-8");
    const parsed = Papa.parse<RawTransactionRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    let rowCount = 0;
    for (const row of parsed.data) {
      rowCount++;
      if (rowCount % 1_000_000 === 0) {
        console.log(`    ${(rowCount / 1_000_000).toFixed(0)}M rows...`);
      }

      if (!row.date_trans_start) continue;

      // Parse timestamp: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
      const ts = row.date_trans_start.replace("T", " ");
      const dateStr = ts.slice(0, 10);           // "YYYY-MM-DD"
      const hourStr = ts.slice(11, 13);
      const hour = parseInt(hourStr);
      if (isNaN(hour) || hour < 0 || hour > 23) continue;

      // Day of week from date
      const dateObj = new Date(dateStr + "T12:00:00");
      if (isNaN(dateObj.getTime())) continue;
      const dow = dateObj.getDay(); // 0=Sun

      // Period
      const month = parseInt(dateStr.slice(5, 7));
      const isPreReform =
        year < 2025 || (year === 2025 && month < 2);
      const period: "pre-reform" | "post-reform" = isPreReform
        ? "pre-reform"
        : "post-reform";

      // Zone
      const location = poleToLocation.get(row.pole_id);
      const zone = location?.zone ?? "Unknown";
      if (!zones.includes(zone)) continue;

      // Game day — only tag Downtown meters
      const isGameDay = zone === "Downtown" && gameDates.has(dateStr);

      // Aggregate for zone-specific and "All" buckets
      for (const z of [zone, "All"]) {
        // For "All" zone, isGameDay = false (game day filter only meaningful for Downtown)
        const gd = z === "All" ? false : isGameDay;
        const key = `${hour}|${dow}|${z}|${gd ? "1" : "0"}|${period}`;
        const entry = getOrCreate(key);
        entry.totalTrans++;
        entry.dates.add(`${z}|${dateStr}`);
      }
    }

    console.log(`    ${year}: ${rowCount.toLocaleString()} rows processed`);
  }

  // Convert to output records
  const records: HourlyRecord[] = [];
  for (const [key, entry] of agg) {
    const parts = key.split("|");
    const hour = parseInt(parts[0]);
    const dow = parseInt(parts[1]);
    const zone = parts[2];
    const isGameDay = parts[3] === "1";
    const period = parts[4] as "pre-reform" | "post-reform";
    const sampleDays = entry.dates.size;

    records.push({
      hour,
      dow,
      zone,
      isGameDay,
      period,
      avgTrans: sampleDays > 0 ? entry.totalTrans / sampleDays : 0,
      sampleDays,
    });
  }

  records.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    if (a.period !== b.period) return a.period.localeCompare(b.period);
    if (a.dow !== b.dow) return a.dow - b.dow;
    if (a.hour !== b.hour) return a.hour - b.hour;
    return Number(a.isGameDay) - Number(b.isGameDay);
  });

  console.log(`  Generated ${records.length} hourly activity records`);
  return records;
}

/** Load Padres game dates from cached schedule JSON files. */
export function loadGameDates(cacheDir: string, years: number[]): Set<string> {
  const dates = new Set<string>();
  for (const year of years) {
    const fp = `${cacheDir}/padres_schedule_${year}.json`;
    if (!fs.existsSync(fp)) continue;
    try {
      const games = JSON.parse(fs.readFileSync(fp, "utf-8")) as { date: string }[];
      for (const g of games) {
        if (g.date) dates.add(g.date);
      }
    } catch {
      console.warn(`  Warning: could not parse ${fp}`);
    }
  }
  return dates;
}
