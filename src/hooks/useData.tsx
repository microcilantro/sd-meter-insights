import { useState, useEffect, createContext, useContext } from "react";
import type { DashboardData } from "../types/data.ts";

const DataContext = createContext<{
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}>({ data: null, loading: true, error: null });

const BASE = import.meta.env.BASE_URL;

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`Failed to fetch ${BASE + path}: ${res.status}`);
  return res.json();
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchJSON("data/monthly-revenue.json"),
      fetchJSON("data/daily-summary.json"),
      fetchJSON("data/dow-heatmap.json"),
      fetchJSON("data/citations-monthly.json"),
      fetchJSON("data/meter-locations.json"),
      fetchJSON("data/metadata.json"),
      fetchJSON("data/payment-methods.json").catch(() => null),
      fetchJSON("data/zone-pricing.json").catch(() => null),
      fetchJSON("data/gameday-stats.json").catch(() => null),
    ])
      .then(
        ([monthly, daily, dowHeatmap, citations, locations, metadata, payments, zonePricing, gameday]) => {
          setData({
            monthly,
            daily,
            dowHeatmap,
            citations,
            locations,
            metadata,
            payments,
            zonePricing,
            gameday,
          } as DashboardData);
          setLoading(false);
        }
      )
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <DataContext.Provider value={{ data, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
