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
  const isPreRateDoubling = record.year < 2025 || (record.year === 2025 && record.month < 2);
  const effectivePrice = isPreRateDoubling ? pricing.avgPrice / 2 : pricing.avgPrice;

  // Extended hours + Sunday enforcement began Aug–Sep 2025.
  // zone-pricing.json reflects current (post-reform) hours. Pre-reform meters
  // were typically 8am–6pm (10 hrs/day) Mon–Sat (6 days/week).
  const isPreExtendedHours = record.year < 2025 || (record.year === 2025 && record.month < 9);
  const effectiveHours = isPreExtendedHours
    ? Math.min(10, pricing.avgEnforcementHours)
    : pricing.avgEnforcementHours;
  const effectiveDays = isPreExtendedHours
    ? Math.min(6, pricing.avgDaysPerWeek)
    : pricing.avgDaysPerWeek;

  const daysInMonth = new Date(record.year, record.month, 0).getDate();
  const daysEnforced = daysInMonth * (effectiveDays / 7);
  const availableHours = record.meterCount * effectiveHours * daysEnforced;
  const paidHours = record.revenue / effectivePrice;

  return availableHours > 0 ? paidHours / availableHours : 0;
}
