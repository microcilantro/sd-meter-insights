import { useMemo } from "react";
import type { DashboardData } from "../types/data.ts";

export function useFilteredData(data: DashboardData | null, zone: string) {
  return useMemo(() => {
    if (!data) return null;

    const filterZone = zone === "All" ? "All" : zone;

    const monthly = data.monthly.filter((r) => r.zone === filterZone);
    const daily = data.daily.filter((r) => r.zone === filterZone);
    const dowHeatmap = data.dowHeatmap.filter((r) => r.zone === filterZone);
    const citations = data.citations.filter((r) => r.zone === filterZone);
    const payments = data.payments?.filter((r) => r.zone === filterZone) ?? null;
    const locations =
      zone === "All"
        ? data.locations
        : data.locations.filter((r) => r.z === zone);

    return { monthly, daily, dowHeatmap, citations, payments, locations };
  }, [data, zone]);
}
