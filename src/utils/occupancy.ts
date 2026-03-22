import type { MonthlyRevenueRecord, ZonePricing } from "../types/data.ts";

/**
 * Computes implied payment occupancy for a single month record.
 *
 * Formula:
 *   paidHours = revenue / avgPrice
 *   daysEnforced = daysInMonth × (avgDaysPerWeek / 7)
 *   availableHours = meterCount × avgEnforcementHours × daysEnforced
 *   occupancy = paidHours / availableHours
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

  const daysInMonth = new Date(record.year, record.month, 0).getDate();
  const daysEnforced = daysInMonth * (pricing.avgDaysPerWeek / 7);
  const availableHours =
    record.meterCount * pricing.avgEnforcementHours * daysEnforced;
  const paidHours = record.revenue / pricing.avgPrice;

  return availableHours > 0 ? paidHours / availableHours : 0;
}
