import { useMemo } from "react";
import type { DashboardData, DateRange } from "../types/data.ts";

function inDateRange(year: number, month: number, range: DateRange | null): boolean {
  if (!range) return true;
  const key = year * 100 + month;
  return key >= range.start.year * 100 + range.start.month &&
         key <= range.end.year * 100 + range.end.month;
}

function dateStrInRange(dateStr: string, range: DateRange | null): boolean {
  if (!range) return true;
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(5, 7));
  return inDateRange(year, month, range);
}

export function useFilteredData(
  data: DashboardData | null,
  zone: string,
  dateRange: DateRange | null = null
) {
  return useMemo(() => {
    if (!data) return null;

    const monthly = data.monthly.filter(
      (r) => r.zone === zone && inDateRange(r.year, r.month, dateRange)
    );
    const allMonthly = data.monthly.filter((r) => r.zone === zone);

    const daily = data.daily.filter(
      (r) => r.zone === zone && dateStrInRange(r.date, dateRange)
    );
    const dowHeatmap = data.dowHeatmap.filter((r) => r.zone === zone);
    const citations = data.citations.filter(
      (r) => r.zone === zone && inDateRange(r.year, r.month, dateRange)
    );
    const allCitations = data.citations.filter((r) => r.zone === zone);
    const payments =
      data.payments?.filter(
        (r) => r.zone === zone && inDateRange(r.year, r.month, dateRange)
      ) ?? null;
    const locations =
      zone === "All"
        ? data.locations
        : data.locations.filter((r) => r.z === zone);

    return { monthly, allMonthly, daily, dowHeatmap, citations, allCitations, payments, locations };
  }, [data, zone, dateRange]);
}
