import fs from "fs";
import Papa from "papaparse";
import type {
  RawTransactionRow,
  PaymentMethodRecord,
  MeterLocation,
} from "./types.ts";

export function processPaymentMethods(
  filepaths: { filepath: string; year: number }[],
  poleToLocation: Map<string, MeterLocation>
): PaymentMethodRecord[] {
  // Aggregate: key = "year-month-zone-payMethod"
  const agg = new Map<
    string,
    { transactions: number; revenue: number }
  >();

  for (const { filepath, year } of filepaths) {
    if (!fs.existsSync(filepath)) {
      console.log(`  [skipped] Raw file not found: ${filepath.split("/").pop()}`);
      continue;
    }

    console.log(
      `  Processing raw transactions for ${year} (this may take a while)...`
    );

    // Stream-parse the large file in chunks
    const csv = fs.readFileSync(filepath, "utf-8");
    const parsed = Papa.parse<RawTransactionRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    let rowCount = 0;
    for (const row of parsed.data) {
      rowCount++;
      if (rowCount % 1_000_000 === 0) {
        console.log(`    ${(rowCount / 1_000_000).toFixed(0)}M rows processed...`);
      }

      if (!row.date_trans_start || !row.pay_method) continue;

      // Extract month from date_trans_start (format: "YYYY-MM-DD HH:MM:SS" or similar)
      const dateParts = row.date_trans_start.split(/[-/ ]/);
      if (dateParts.length < 2) continue;
      const month = parseInt(dateParts[1]);
      if (isNaN(month) || month < 1 || month > 12) continue;

      const location = poleToLocation.get(row.pole_id);
      const zone = location?.zone ?? "Unknown";

      const payMethod = normalizePayMethod(row.pay_method);
      const revenue = parseInt(row.trans_amt) / 100; // cents → dollars
      if (isNaN(revenue)) continue;

      // Per-zone aggregate
      const key = `${year}|${month}|${zone}|${payMethod}`;
      let entry = agg.get(key);
      if (!entry) {
        entry = { transactions: 0, revenue: 0 };
        agg.set(key, entry);
      }
      entry.transactions++;
      entry.revenue += revenue;

      // "All" zone aggregate
      const allKey = `${year}|${month}|All|${payMethod}`;
      let allEntry = agg.get(allKey);
      if (!allEntry) {
        allEntry = { transactions: 0, revenue: 0 };
        agg.set(allKey, allEntry);
      }
      allEntry.transactions++;
      allEntry.revenue += revenue;
    }

    console.log(`    ${year}: ${rowCount.toLocaleString()} total rows`);
  }

  // Convert to output records
  const records: PaymentMethodRecord[] = [];
  for (const [key, entry] of agg) {
    const [yearStr, monthStr, zone, payMethod] = key.split("|");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    records.push({
      year,
      month,
      zone,
      payMethod,
      transactions: entry.transactions,
      revenue: Math.round(entry.revenue * 100) / 100,
    });
  }

  records.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return a.payMethod.localeCompare(b.payMethod);
  });

  console.log(`  Generated ${records.length} payment method records`);
  return records;
}

function normalizePayMethod(method: string): string {
  const m = method.trim().toUpperCase();
  if (m === "CREDIT CARD") return "Credit Card";
  if (m === "CASH") return "Cash";
  if (m === "PAYBYPHONE") return "PayByPhone";
  if (m === "SMART CARD") return "Smart Card";
  if (m === "SMART CARD REFUND") return "Smart Card Refund";
  return m;
}
