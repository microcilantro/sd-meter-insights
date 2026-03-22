import fs from "fs";
import Papa from "papaparse";
import type { CitationRow, CitationMonthlyRecord } from "./types.ts";
import { normalizeAddress } from "./parse-locations.ts";

// Meter-related violation codes
const METER_VIOLATION_CODES = new Set([
  "86.0126 SDMC",     // EXPIRED METER
  "86.0127(A) SDMC",  // OVERTIME METER
  "86.0124 SDMC",     // OUT OF STALL-METER
]);

function isMeterRelated(vioCode: string): boolean {
  // Check exact match or partial match (codes may have slight variations)
  if (METER_VIOLATION_CODES.has(vioCode)) return true;
  const code = vioCode.trim();
  return (
    code.startsWith("86.0126") ||
    code.startsWith("86.0127") ||
    code.startsWith("86.0124")
  );
}

interface AggKey {
  year: number;
  month: number;
  zone: string;
  meterRelated: boolean;
}

interface AggValue {
  citationCount: number;
  fineTotal: number;
  violations: Map<string, { desc: string; count: number }>;
}

/**
 * Extract the street name from an address like "1300 3RD AV" → "3RD AV"
 */
function extractStreetName(addr: string): string {
  return addr.replace(/^\d+\s+/, "").trim();
}

export function processCitations(
  filepaths: string[],
  addressToZone: Map<string, string>,
  streetToZone?: Map<string, string>
): CitationMonthlyRecord[] {
  const agg = new Map<string, AggValue>();
  let totalCitations = 0;
  let matchedExact = 0;
  let matchedStreet = 0;

  for (const filepath of filepaths) {
    if (!fs.existsSync(filepath)) continue;

    console.log(`  Processing citations: ${filepath.split("/").pop()}...`);
    const csv = fs.readFileSync(filepath, "utf-8");
    const parsed = Papa.parse<CitationRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });

    for (const row of parsed.data) {
      if (!row.date_issue) continue;
      totalCitations++;

      // Parse date
      const dateParts = row.date_issue.split("-");
      if (dateParts.length < 2) continue;
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]);
      if (isNaN(year) || isNaN(month)) continue;

      // Map location to zone: try exact match, then street-level fallback
      let zone = "Unknown";
      if (row.location) {
        const normalized = normalizeAddress(row.location);

        // Try exact address match first
        const exactZone = addressToZone.get(normalized);
        if (exactZone) {
          zone = exactZone;
          matchedExact++;
        } else if (streetToZone) {
          // Fallback: match by street name only
          const street = extractStreetName(normalized);
          const streetZone = streetToZone.get(street);
          if (streetZone) {
            zone = streetZone;
            matchedStreet++;
          }
        }
      }

      const meterRelated = isMeterRelated(row.vio_code || "");
      const fine = parseFloat(row.vio_fine) || 0;

      const key = `${year}|${month}|${zone}|${meterRelated}`;
      let entry = agg.get(key);
      if (!entry) {
        entry = { citationCount: 0, fineTotal: 0, violations: new Map() };
        agg.set(key, entry);
      }
      entry.citationCount++;
      entry.fineTotal += fine;

      const vioCode = (row.vio_code || "").trim();
      if (vioCode) {
        const vio = entry.violations.get(vioCode);
        if (vio) {
          vio.count++;
        } else {
          entry.violations.set(vioCode, {
            desc: (row.vio_desc || "").trim(),
            count: 1,
          });
        }
      }
    }
  }

  const totalMatched = matchedExact + matchedStreet;
  const matchRate =
    totalCitations > 0
      ? Math.round((totalMatched / totalCitations) * 100)
      : 0;
  console.log(
    `  Citation zone match rate: ${matchRate}% (${totalMatched}/${totalCitations})`
  );
  console.log(
    `    Exact address: ${matchedExact}, Street-level: ${matchedStreet}`
  );

  if (matchRate < 70) {
    console.log(
      "  WARNING: Match rate below 70%. Citation zone breakdowns may be unreliable."
    );
  }

  // Convert to output records
  const records: CitationMonthlyRecord[] = [];
  for (const [key, entry] of agg) {
    const [yearStr, monthStr, zone, meterRelatedStr] = key.split("|");
    const meterRelated = meterRelatedStr === "true";
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Get top 10 violations
    const topViolations = [...entry.violations.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([code, info]) => ({
        code,
        desc: info.desc,
        count: info.count,
      }));

    records.push({
      year,
      month,
      zone,
      meterRelated,
      citationCount: entry.citationCount,
      fineTotal: Math.round(entry.fineTotal * 100) / 100,
      topViolations,
    });
  }

  // Also compute "All" zone aggregates
  const allAgg = new Map<string, AggValue>();
  for (const record of records) {
    const key = `${record.year}|${record.month}|${record.meterRelated}`;
    let entry = allAgg.get(key);
    if (!entry) {
      entry = { citationCount: 0, fineTotal: 0, violations: new Map() };
      allAgg.set(key, entry);
    }
    entry.citationCount += record.citationCount;
    entry.fineTotal += record.fineTotal;
    for (const v of record.topViolations) {
      const existing = entry.violations.get(v.code);
      if (existing) {
        existing.count += v.count;
      } else {
        entry.violations.set(v.code, { desc: v.desc, count: v.count });
      }
    }
  }

  for (const [key, entry] of allAgg) {
    const [yearStr, monthStr, meterRelatedStr] = key.split("|");
    const meterRelated = meterRelatedStr === "true";
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const topViolations = [...entry.violations.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([code, info]) => ({ code, desc: info.desc, count: info.count }));

    records.push({
      year,
      month,
      zone: "All",
      meterRelated,
      citationCount: entry.citationCount,
      fineTotal: Math.round(entry.fineTotal * 100) / 100,
      topViolations,
    });
  }

  records.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    return Number(a.meterRelated) - Number(b.meterRelated);
  });

  console.log(`  Generated ${records.length} citation records`);
  return records;
}
