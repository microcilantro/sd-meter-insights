import fs from "fs";
import Papa from "papaparse";
import type { LocationRow, MeterLocation } from "./types.ts";

const EXCLUDED_ZONES = new Set(["Spares", "Test Zone"]);

export function normalizeAddress(addr: string): string {
  return addr
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bAVENUE\b/g, "AV")
    .replace(/\bAVE\b/g, "AV")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bBLVD\b/g, "BLVD")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bCOURT\b/g, "CT")
    .replace(/\bCIRCLE\b/g, "CIR")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bWAY\b/g, "WY")
    .replace(/\bHIGHWAY\b/g, "HWY")
    .replace(/\bPARKWAY\b/g, "PKWY")
    .replace(/\bWEST\b/g, "W")
    .replace(/\bEAST\b/g, "E")
    .replace(/\bNORTH\b/g, "N")
    .replace(/\bSOUTH\b/g, "S")
    // Normalize ordinal streets: FIRST->1ST, SECOND->2ND, etc.
    .replace(/\bFIRST\b/g, "1ST")
    .replace(/\bSECOND\b/g, "2ND")
    .replace(/\bTHIRD\b/g, "3RD")
    .replace(/\bFOURTH\b/g, "4TH")
    .replace(/\bFIFTH\b/g, "5TH")
    .replace(/\bSIXTH\b/g, "6TH")
    .replace(/\bSEVENTH\b/g, "7TH")
    .replace(/\bEIGHTH\b/g, "8TH")
    .replace(/\bNINTH\b/g, "9TH")
    .replace(/\bTENTH\b/g, "10TH")
    .replace(/\bELEVENTH\b/g, "11TH")
    .replace(/\bTWELFTH\b/g, "12TH");
}

/**
 * Extract the street name from an address like "1300 3RD AV" → "3RD AV"
 */
function extractStreetName(addr: string): string {
  // Remove leading block number (one or more digits at start)
  return addr.replace(/^\d+\s+/, "").trim();
}

export interface LocationData {
  poleToLocation: Map<string, MeterLocation>;
  addressToZone: Map<string, string>;
  streetToZone: Map<string, string>;
  zoneBreakdown: Record<string, number>;
}

export function parseLocations(filepath: string): LocationData {
  const csv = fs.readFileSync(filepath, "utf-8");
  const parsed = Papa.parse<LocationRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const poleToLocation = new Map<string, MeterLocation>();
  const addressToZone = new Map<string, string>();
  const zoneBreakdown: Record<string, number> = {};

  // For street-based matching: count meters per street per zone
  const streetZoneCounts = new Map<string, Map<string, number>>();

  for (const row of parsed.data) {
    if (EXCLUDED_ZONES.has(row.zone)) continue;
    if (!row.pole || !row.zone) continue;

    const location: MeterLocation = {
      zone: row.zone,
      area: row.area,
      subArea: row["sub-area"],
      lat: parseFloat(row.latitude) || 0,
      lng: parseFloat(row.longitude) || 0,
      price: row.price || "",
      timeStart: row.time_start || "",
      timeEnd: row.time_end || "",
      daysInOp: row.days_in_operation || "",
      timeLimit: row.time_limit || "",
      configName: row.configname || "",
    };

    poleToLocation.set(row.pole, location);

    // Build exact address → zone lookup
    if (row["sub-area"]) {
      const normalized = normalizeAddress(row["sub-area"]);
      if (!addressToZone.has(normalized)) {
        addressToZone.set(normalized, row.zone);
      }

      // Build street-level zone counts
      const street = extractStreetName(normalized);
      if (street) {
        let zoneCounts = streetZoneCounts.get(street);
        if (!zoneCounts) {
          zoneCounts = new Map();
          streetZoneCounts.set(street, zoneCounts);
        }
        zoneCounts.set(row.zone, (zoneCounts.get(row.zone) || 0) + 1);
      }
    }

    zoneBreakdown[row.zone] = (zoneBreakdown[row.zone] || 0) + 1;
  }

  // Build street → zone lookup (use the zone with the most meters on that street)
  const streetToZone = new Map<string, string>();
  for (const [street, zoneCounts] of streetZoneCounts) {
    let bestZone = "";
    let bestCount = 0;
    for (const [zone, count] of zoneCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestZone = zone;
      }
    }
    if (bestZone) {
      streetToZone.set(street, bestZone);
    }
  }

  console.log(
    `Parsed ${poleToLocation.size} meters across ${Object.keys(zoneBreakdown).length} zones`
  );
  console.log("Zone breakdown:", zoneBreakdown);
  console.log(
    `Address lookup: ${addressToZone.size} exact, ${streetToZone.size} street-level`
  );

  return { poleToLocation, addressToZone, streetToZone, zoneBreakdown };
}
