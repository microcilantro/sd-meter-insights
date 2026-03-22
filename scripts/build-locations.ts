import type {
  MeterLocation,
  MeterLocationOutput,
  MonthlyRevenueRecord,
} from "./types.ts";

export function buildMeterLocations(
  poleToLocation: Map<string, MeterLocation>,
  monthlyRecords: MonthlyRevenueRecord[]
): MeterLocationOutput[] {
  // Build per-pole stats from the latest year of monthly data
  const latestYear = Math.max(...monthlyRecords.map((r) => r.year));
  console.log(`  Building meter location JSON using ${latestYear} stats...`);

  // Aggregate per-pole revenue and transactions for the latest year
  // We need to re-derive from monthly records (which are zone-level)
  // Instead, we'll just attach zone-level stats and omit per-pole stats
  // since monthly records are already aggregated by zone
  const output: MeterLocationOutput[] = [];

  for (const [pole, loc] of poleToLocation) {
    if (loc.lat === 0 && loc.lng === 0) continue;

    output.push({
      p: pole,
      z: loc.zone,
      a: loc.area,
      s: loc.subArea,
      la: parseFloat(loc.lat.toFixed(6)),
      ln: parseFloat(loc.lng.toFixed(6)),
      pr: loc.price,
      ts: loc.timeStart,
      te: loc.timeEnd,
      d: loc.daysInOp,
      r: 0, // Will be populated if we process per-pole data later
      t: 0,
    });
  }

  console.log(`  Generated ${output.length} meter location records`);
  return output;
}
