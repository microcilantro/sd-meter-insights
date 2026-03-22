import type { MonthlyRevenueRecord, ZonePricing } from "../types/data.ts";

/**
 * Computes implied payment occupancy for a single month record.
 *
 * Formula:
 *   paidHours = revenue / effectivePrice
 *   daysEnforced = daysInMonth × (avgDaysPerWeek / 7)
 *   availableHours = meterCount × avgEnforcementHours × daysEnforced
 *   occupancy = paidHours / availableHours
 *
 * zone-pricing.json uses current (post-reform) rates. Rates doubled on
 * Jan 31, 2025, so pre-reform months use half the current price.
 *
 * This is a lower bound — it only counts paid parking time, not unpaid
 * occupancy or periods outside enforcement windows.
 *
 * Returns a value 0–1+ (can exceed 1 due to multi-space meters or data quirks).
 */
export function computeOccupancy(
  record: MonthlyRevenueRecord,
  pricing: ZonePricing
): number {
  if (!pricing || pricing.avgPrice <= 0 || pricing.avgEnforcementHours <= 0) return 0;
  if (record.meterCount <= 0 || record.revenue <= 0) return 0;

  // Rates doubled on Jan 31 2025; Feb 2025 is the first full month at new rates.
  const isPreReform = record.year < 2025 || (record.year === 2025 && record.month < 2);
  const effectivePrice = isPreReform ? pricing.avgPrice / 2 : pricing.avgPrice;

  const daysInMonth = new Date(record.year, record.month, 0).getDate();
  const daysEnforced = daysInMonth * (pricing.avgDaysPerWeek / 7);
  const availableHours =
    record.meterCount * pricing.avgEnforcementHours * daysEnforced;
  const paidHours = record.revenue / effectivePrice;

  return availableHours > 0 ? paidHours / availableHours : 0;
}
