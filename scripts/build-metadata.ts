import type { Metadata, MonthlyRevenueRecord } from "./types.ts";

export function buildMetadata(
  monthlyRecords: MonthlyRevenueRecord[],
  zoneBreakdown: Record<string, number>
): Metadata {
  // Find data range from monthly records
  let minYear = Infinity,
    minMonth = Infinity;
  let maxYear = -Infinity,
    maxMonth = -Infinity;

  for (const r of monthlyRecords) {
    if (r.zone !== "All") continue;
    if (r.year < minYear || (r.year === minYear && r.month < minMonth)) {
      minYear = r.year;
      minMonth = r.month;
    }
    if (r.year > maxYear || (r.year === maxYear && r.month > maxMonth)) {
      maxYear = r.year;
      maxMonth = r.month;
    }
  }

  const totalMeters = Object.values(zoneBreakdown).reduce(
    (sum, n) => sum + n,
    0
  );

  const today = new Date();
  const lastCompleteMonthNum = today.getMonth() === 0 ? 12 : today.getMonth();
  const lastCompleteYearNum = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

  return {
    lastRefresh: today.toISOString().split("T")[0],
    lastCompleteMonth: { year: lastCompleteYearNum, month: lastCompleteMonthNum },
    dataRange: {
      start: `${minYear}-${String(minMonth).padStart(2, "0")}`,
      end: `${maxYear}-${String(maxMonth).padStart(2, "0")}`,
    },
    meterCount: totalMeters,
    zoneBreakdown,
    policyDates: [
      {
        date: "2025-01-31",
        label: "Rate Doubling",
        description:
          "Hourly meter rates doubled from $1.25 to $2.50/hr for most of the city's 5,332 metered spaces.",
      },
      {
        date: "2025-08-21",
        label: "Extended Hours (PB/Mid-City/Uptown)",
        description:
          "Meter hours extended and expanded to Sundays in Pacific Beach, Mid-City, and Uptown districts.",
      },
      {
        date: "2025-09-01",
        label: "Downtown Extended Hours + Petco Zone",
        description:
          "Downtown meters extended to 10 PM and Sundays. Petco Park Special Event Zone activated with $10/hr surge pricing.",
      },
      {
        date: "2025-11-01",
        label: "Credit Card Fee",
        description:
          "A $0.35 fee applies to all credit card payments at meters, Park Smarter app, and Text to Pay.",
      },
    ],
  };
}
