import fs from "fs";
import Papa from "papaparse";
import type { RawTransactionRow, MeterLocation } from "./types.ts";

export interface HourlyRecord {
  hour: number;         // 0–23
  dow: number;          // 0=Sun, 1=Mon, … 6=Sat
  zone: string;
  isGameDay: boolean;
  period: "pre-reform" | "post-reform";
  occupancy: number;    // 0–100 (payment occupancy %)
  sampleDays: number;
}

/** Parse a time string like "8am", "6pm", "800", "1800", "8" into 24-hour float. */
function parseTimeHour(s: string): number {
  if (!s) return -1;
  s = s.trim().toLowerCase();
  const ampm = s.match(/^(\d+)(am|pm)$/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    if (ampm[2] === "pm" && h !== 12) h += 12;
    if (ampm[2] === "am" && h === 12) h = 0;
    return h;
  }
  const n = parseFloat(s);
  if (!isNaN(n)) {
    if (n > 24) return Math.floor(n / 100); // HHMM format
    return n;
  }
  return -1;
}

/**
 * For each zone and each hour 0–23, count how many meters are active
 * (i.e. timeStart <= hour < timeEnd).
 * Used as the denominator when computing hourly occupancy.
 */
function buildActiveMetersByHour(
  poleToLocation: Map<string, MeterLocation>
): Map<string, number[]> {
  // zone → array of 24 counts
  const result = new Map<string, number[]>();

  const initZone = (z: string) => {
    if (!result.has(z)) result.set(z, new Array(24).fill(0));
  };

  for (const loc of poleToLocation.values()) {
    const zone = loc.zone;
    if (!zone) continue;

    const start = parseTimeHour(loc.timeStart);
    const end = parseTimeHour(loc.timeEnd);
    if (start < 0 || end <= start) continue;

    initZone(zone);
    initZone("All");

    // Meter is active for hours [start, end)
    const endH = Math.min(Math.ceil(end), 24);
    for (let h = Math.floor(start); h < endH; h++) {
      result.get(zone)![h]++;
      result.get("All")![h]++;
    }
  }

  return result;
}

/**
 * Processes raw transaction files to build hourly payment occupancy profiles.
 *
 * For each transaction, we expand it across every hour it covers
 * (from start hour through expire hour) and count meter-hours occupied.
 *
 * Denominator per hour H = meters that are *active* at hour H (not all meters).
 * This ensures occupancy is only computed relative to meters actually operating.
 *
 * "pre-reform"  = before Feb 2025 (rates doubled Jan 31 2025)
 * "post-reform" = Feb 2025 onwards
 */
export function processHourlyActivity(
  filepaths: { filepath: string; year: number }[],
  poleToLocation: Map<string, MeterLocation>,
  gameDates: Set<string>
): HourlyRecord[] {
  const validZones = new Set([
    "All", "Downtown", "Uptown", "Mid-City", "Pacific Beach", "City", "Balboa Park",
  ]);

  // Active meter count per (zone, hour)
  const activeMetersByHour = buildActiveMetersByHour(poleToLocation);

  // key → { occupiedSum, dates }
  const agg = new Map<string, { occupiedSum: number; dates: Set<string> }>();

  function getOrCreate(key: string) {
    let entry = agg.get(key);
    if (!entry) {
      entry = { occupiedSum: 0, dates: new Set() };
      agg.set(key, entry);
    }
    return entry;
  }

  for (const { filepath, year } of filepaths) {
    if (!fs.existsSync(filepath)) {
      console.log(`  [skipped] Raw file not found: ${filepath.split("/").pop()}`);
      continue;
    }

    console.log(`  Processing hourly occupancy for ${year}...`);

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

      if (!row.date_trans_start || !row.date_meter_expire) continue;

      const tsStart = row.date_trans_start.replace("T", " ");
      const dateStr = tsStart.slice(0, 10);
      const startHour = parseInt(tsStart.slice(11, 13));
      if (isNaN(startHour) || startHour < 0 || startHour > 23) continue;

      const tsExpire = row.date_meter_expire.replace("T", " ");
      const expireDateStr = tsExpire.slice(0, 10);
      const expireHour = parseInt(tsExpire.slice(11, 13));
      if (isNaN(expireHour)) continue;

      const effectiveExpireHour =
        expireDateStr !== dateStr || expireHour < startHour
          ? Math.min(startHour + 8, 23)
          : Math.min(expireHour, 23);

      const dateObj = new Date(dateStr + "T12:00:00");
      if (isNaN(dateObj.getTime())) continue;
      const dow = dateObj.getDay();

      const month = parseInt(dateStr.slice(5, 7));
      const isPreReform = year < 2025 || (year === 2025 && month < 2);
      const period: "pre-reform" | "post-reform" = isPreReform ? "pre-reform" : "post-reform";

      const location = poleToLocation.get(row.pole_id);
      const zone = location?.zone ?? "Unknown";
      if (!validZones.has(zone)) continue;

      const isGameDay = zone === "Downtown" && gameDates.has(dateStr);

      for (let h = startHour; h <= effectiveExpireHour; h++) {
        for (const z of [zone, "All"]) {
          const gd = z === "All" ? false : isGameDay;
          const key = `${h}|${dow}|${z}|${gd ? "1" : "0"}|${period}`;
          const entry = getOrCreate(key);
          entry.occupiedSum++;
          entry.dates.add(`${z}|${dateStr}`);
        }
      }
    }

    console.log(`    ${year}: ${rowCount.toLocaleString()} rows processed`);
  }

  const records: HourlyRecord[] = [];
  for (const [key, entry] of agg) {
    const parts = key.split("|");
    const hour = parseInt(parts[0]);
    const dow = parseInt(parts[1]);
    const zone = parts[2];
    const isGameDay = parts[3] === "1";
    const period = parts[4] as "pre-reform" | "post-reform";
    const sampleDays = entry.dates.size;

    // Use active meter count at this specific hour as denominator
    const activeMeters = activeMetersByHour.get(zone)?.[hour] ?? 0;
    if (activeMeters === 0) continue; // skip hours when no meters are active

    const avgOccupied = sampleDays > 0 ? entry.occupiedSum / sampleDays : 0;
    const occupancy = Math.min((avgOccupied / activeMeters) * 100, 120);

    records.push({
      hour, dow, zone, isGameDay, period,
      occupancy: Math.round(occupancy * 10) / 10,
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

  console.log(`  Generated ${records.length} hourly occupancy records`);
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
