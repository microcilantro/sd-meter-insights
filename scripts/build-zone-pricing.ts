import type { MeterLocation } from "./types.ts";

export interface ZonePricingOutput {
  zone: string;
  avgPrice: number;            // $/hr
  avgEnforcementHours: number; // hours/day on enforced days
  avgDaysPerWeek: number;      // avg enforced days per week
}

/**
 * Parse a time string like "8am", "10pm", "8", "20" into a 24-hour float.
 * Returns -1 if unparseable.
 */
function parseTimeStr(s: string): number {
  if (!s) return -1;
  s = s.trim().toLowerCase();

  // Handle "8am", "10pm", "12pm" etc.
  const amPm = s.match(/^(\d+)(am|pm)$/);
  if (amPm) {
    let hour = parseInt(amPm[1]);
    const period = amPm[2];
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return hour;
  }

  // Handle plain numbers like "800", "2000", "8", "20"
  const num = parseFloat(s);
  if (!isNaN(num)) {
    if (num > 24) return Math.floor(num / 100) + (num % 100) / 60; // HHMM format
    return num;
  }

  return -1;
}

/**
 * Parse a price string like "$2.50 HR", "$1.25", "2.50" → number.
 * Returns 0 if unparseable.
 */
function parsePrice(s: string): number {
  if (!s) return 0;
  const match = s.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Parse a days_in_operation string like "Mon-Sat", "Mon-Sun", "Mon-Fri" into a day count.
 * Day order: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
 */
function parseDaysPerWeek(s: string): number {
  if (!s) return 0;
  s = s.trim();

  const DAY_MAP: Record<string, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };

  // Handle range like "Mon-Sat" or "Mon-Fri"
  const rangeMatch = s.match(/^(\w{3})-(\w{3})$/i);
  if (rangeMatch) {
    const start = DAY_MAP[rangeMatch[1].toLowerCase()];
    const end = DAY_MAP[rangeMatch[2].toLowerCase()];
    if (start !== undefined && end !== undefined) {
      // Wrap around if end < start (e.g., Fri-Mon would be unusual but handle it)
      if (end >= start) return end - start + 1;
      return 7 - start + end + 1;
    }
  }

  // Handle single day
  const single = DAY_MAP[s.toLowerCase().slice(0, 3)];
  if (single !== undefined) return 1;

  return 5; // default fallback: weekdays
}

export function buildZonePricing(
  poleToLocation: Map<string, MeterLocation>
): ZonePricingOutput[] {
  // Collect per-zone stats
  const zoneStats = new Map<
    string,
    { prices: number[]; hours: number[]; days: number[] }
  >();

  for (const loc of poleToLocation.values()) {
    const { zone, price, timeStart, timeEnd, daysInOp } = loc;

    const parsedPrice = parsePrice(price);
    const start = parseTimeStr(timeStart);
    const end = parseTimeStr(timeEnd);
    const daysPerWeek = parseDaysPerWeek(daysInOp);

    if (!zone) continue;

    let stats = zoneStats.get(zone);
    if (!stats) {
      stats = { prices: [], hours: [], days: [] };
      zoneStats.set(zone, stats);
    }

    if (parsedPrice > 0) stats.prices.push(parsedPrice);
    if (start >= 0 && end > start) stats.hours.push(end - start);
    if (daysPerWeek > 0) stats.days.push(daysPerWeek);
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const results: ZonePricingOutput[] = [];
  for (const [zone, stats] of zoneStats.entries()) {
    results.push({
      zone,
      avgPrice: avg(stats.prices),
      avgEnforcementHours: avg(stats.hours),
      avgDaysPerWeek: avg(stats.days),
    });
  }

  // Add an "All" zone entry as weighted average
  const allPrices = [...poleToLocation.values()].map((l) => parsePrice(l.price)).filter((p) => p > 0);
  const allHours = [...poleToLocation.values()]
    .map((l) => {
      const s = parseTimeStr(l.timeStart);
      const e = parseTimeStr(l.timeEnd);
      return s >= 0 && e > s ? e - s : -1;
    })
    .filter((h) => h > 0);
  const allDays = [...poleToLocation.values()]
    .map((l) => parseDaysPerWeek(l.daysInOp))
    .filter((d) => d > 0);

  results.push({
    zone: "All",
    avgPrice: avg(allPrices),
    avgEnforcementHours: avg(allHours),
    avgDaysPerWeek: avg(allDays),
  });

  console.log(`  Zone pricing computed for ${results.length} zones`);
  for (const r of results) {
    console.log(
      `    ${r.zone}: $${r.avgPrice.toFixed(2)}/hr, ${r.avgEnforcementHours.toFixed(1)} hrs/day, ${r.avgDaysPerWeek.toFixed(1)} days/wk`
    );
  }

  return results;
}
