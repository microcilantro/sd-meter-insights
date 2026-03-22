import fs from "fs";
import Papa from "papaparse";
import type { MonthlyTransactionRow, MonthlyRevenueRecord, MeterLocation } from "./types.ts";

// Maximum plausible average transaction amount for a single meter in one month.
// Matches the threshold used in process-daily.ts — see that file for rationale.
const MAX_AVG_TRANS_DOLLARS = 200;

export function processMonthlyTransactions(
  filepaths: { filepath: string; year: number }[],
  poleToLocation: Map<string, MeterLocation>
): MonthlyRevenueRecord[] {
  // Aggregate: key = "year-month-zone"
  const agg = new Map<
    string,
    { revenue: number; transactions: number; poles: Set<string> }
  >();

  for (const { filepath, year } of filepaths) {
    if (!fs.existsSync(filepath)) continue;

    console.log(`  Processing monthly transactions for ${year}...`);
    const csv = fs.readFileSync(filepath, "utf-8");
    const parsed = Papa.parse<MonthlyTransactionRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    let matched = 0;
    let unmatched = 0;

    for (const row of parsed.data) {
      const location = poleToLocation.get(row.pole_id);
      const zone = location?.zone ?? "Unknown";
      if (!location) unmatched++;
      else matched++;

      const month = parseInt(row.month);
      if (isNaN(month) || month < 1 || month > 12) continue;

      const revenue = parseInt(row.sum_trans_amt) / 100; // cents → dollars
      const transactions = parseInt(row.num_trans);
      if (isNaN(revenue) || isNaN(transactions) || transactions <= 0) continue;

      // Reject physically impossible readings (data quality filter)
      const avgTrans = revenue / transactions;
      if (avgTrans > MAX_AVG_TRANS_DOLLARS) {
        console.warn(
          `  [OUTLIER SKIPPED] pole ${row.pole_id} ${year}-${String(parseInt(row.month)).padStart(2, "0")}: ` +
            `$${avgTrans.toFixed(2)}/txn avg (${transactions} txns, $${revenue.toFixed(2)} total)`
        );
        continue;
      }

      // Per-zone aggregate
      const key = `${year}-${month}-${zone}`;
      let entry = agg.get(key);
      if (!entry) {
        entry = { revenue: 0, transactions: 0, poles: new Set() };
        agg.set(key, entry);
      }
      entry.revenue += revenue;
      entry.transactions += transactions;
      entry.poles.add(row.pole_id);

      // "All" zone aggregate
      const allKey = `${year}-${month}-All`;
      let allEntry = agg.get(allKey);
      if (!allEntry) {
        allEntry = { revenue: 0, transactions: 0, poles: new Set() };
        agg.set(allKey, allEntry);
      }
      allEntry.revenue += revenue;
      allEntry.transactions += transactions;
      allEntry.poles.add(row.pole_id);
    }

    console.log(
      `    ${year}: ${matched} matched, ${unmatched} unmatched pole_ids`
    );
  }

  // Convert to output records
  const records: MonthlyRevenueRecord[] = [];
  for (const [key, entry] of agg) {
    const [yearStr, monthStr, ...zoneParts] = key.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const zone = zoneParts.join("-"); // Handle zone names with hyphens (Mid-City)

    records.push({
      year,
      month,
      zone,
      revenue: Math.round(entry.revenue * 100) / 100,
      transactions: entry.transactions,
      avgPerTrans:
        entry.transactions > 0
          ? Math.round((entry.revenue / entry.transactions) * 100) / 100
          : 0,
      meterCount: entry.poles.size,
    });
  }

  // Sort by year, month, zone
  records.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.zone.localeCompare(b.zone);
  });

  console.log(`  Generated ${records.length} monthly revenue records`);
  return records;
}
