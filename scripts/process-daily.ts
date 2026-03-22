import fs from "fs";
import Papa from "papaparse";
import type {
  DailyTransactionRow,
  DailySummaryRecord,
  DowHeatmapRecord,
  MeterLocation,
} from "./types.ts";

// Reform date: Jan 31 2025 (rate doubling)
const REFORM_DATE = new Date("2025-01-31");

// Maximum plausible average transaction amount for a single meter on one day.
// Data analysis shows p99.9 ≈ $21.85/txn; the highest legitimate single-session
// amount is ~$60 (max rate × max duration). $200 is a generous safety margin that
// definitively catches firmware/data-entry errors (e.g. CL-603: $130,563/txn on
// 2026-01-17) while never touching real data.
const MAX_AVG_TRANS_DOLLARS = 200;

export function processDailyTransactions(
  filepaths: { filepath: string; year: number }[],
  poleToLocation: Map<string, MeterLocation>
): { daily: DailySummaryRecord[]; dowHeatmap: DowHeatmapRecord[] } {
  // Aggregate: key = "date-zone"
  const dailyAgg = new Map<
    string,
    { revenue: number; transactions: number; dayOfWeek: number }
  >();

  for (const { filepath, year } of filepaths) {
    if (!fs.existsSync(filepath)) continue;

    console.log(`  Processing daily transactions for ${year}...`);
    const csv = fs.readFileSync(filepath, "utf-8");
    const parsed = Papa.parse<DailyTransactionRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of parsed.data) {
      const location = poleToLocation.get(row.pole_id);
      const zone = location?.zone ?? "Unknown";

      const month = parseInt(row.month);
      const day = parseInt(row.day);
      if (isNaN(month) || isNaN(day)) continue;

      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(dateStr + "T12:00:00"); // Noon to avoid timezone issues
      if (isNaN(dateObj.getTime())) continue;

      const revenue = parseInt(row.sum_trans_amt) / 100;
      const transactions = parseInt(row.num_trans);
      if (isNaN(revenue) || isNaN(transactions) || transactions <= 0) continue;

      // Reject physically impossible readings (data quality filter)
      const avgTrans = revenue / transactions;
      if (avgTrans > MAX_AVG_TRANS_DOLLARS) {
        console.warn(
          `  [OUTLIER SKIPPED] pole ${row.pole_id} on ${dateStr}: ` +
            `$${avgTrans.toFixed(2)}/txn avg (${transactions} txns, $${revenue.toFixed(2)} total)`
        );
        continue;
      }

      const dayOfWeek = dateObj.getDay(); // 0=Sunday

      // Per-zone daily aggregate
      const key = `${dateStr}|${zone}`;
      let entry = dailyAgg.get(key);
      if (!entry) {
        entry = { revenue: 0, transactions: 0, dayOfWeek };
        dailyAgg.set(key, entry);
      }
      entry.revenue += revenue;
      entry.transactions += transactions;

      // "All" zone aggregate
      const allKey = `${dateStr}|All`;
      let allEntry = dailyAgg.get(allKey);
      if (!allEntry) {
        allEntry = { revenue: 0, transactions: 0, dayOfWeek };
        dailyAgg.set(allKey, allEntry);
      }
      allEntry.revenue += revenue;
      allEntry.transactions += transactions;
    }
  }

  // Convert to daily summary records
  const daily: DailySummaryRecord[] = [];
  for (const [key, entry] of dailyAgg) {
    const [date, zone] = key.split("|");

    daily.push({
      date,
      zone,
      revenue: Math.round(entry.revenue * 100) / 100,
      transactions: entry.transactions,
      dayOfWeek: entry.dayOfWeek,
    });
  }

  daily.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.zone.localeCompare(b.zone);
  });

  // Build DOW heatmap
  const dowHeatmap = buildDowHeatmap(daily);

  console.log(
    `  Generated ${daily.length} daily records, ${dowHeatmap.length} DOW heatmap records`
  );

  return { daily, dowHeatmap };
}

function buildDowHeatmap(daily: DailySummaryRecord[]): DowHeatmapRecord[] {
  // Group by zone-dayOfWeek-period
  const groups = new Map<
    string,
    { totalTrans: number; totalRev: number; dayCount: number }
  >();

  for (const record of daily) {
    const dateObj = new Date(record.date + "T12:00:00");
    const period: "pre-reform" | "post-reform" =
      dateObj < REFORM_DATE ? "pre-reform" : "post-reform";
    const key = `${record.zone}|${record.dayOfWeek}|${period}`;

    let group = groups.get(key);
    if (!group) {
      group = { totalTrans: 0, totalRev: 0, dayCount: 0 };
      groups.set(key, group);
    }
    group.totalTrans += record.transactions;
    group.totalRev += record.revenue;
    group.dayCount++;
  }

  const heatmap: DowHeatmapRecord[] = [];
  for (const [key, group] of groups) {
    const [zone, dowStr, period] = key.split("|");
    const dayOfWeek = parseInt(dowStr);

    heatmap.push({
      zone,
      dayOfWeek,
      period,
      avgTransactions: Math.round(group.totalTrans / group.dayCount),
      avgRevenue:
        Math.round((group.totalRev / group.dayCount) * 100) / 100,
    });
  }

  heatmap.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    if (a.period !== b.period) return a.period.localeCompare(b.period);
    return a.dayOfWeek - b.dayOfWeek;
  });

  return heatmap;
}
