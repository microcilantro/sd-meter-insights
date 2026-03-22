import { useState, useEffect } from "react";
import { DataProvider, useData } from "./hooks/useData.tsx";
import { useFilteredData } from "./hooks/useFilteredData.ts";
import { Header } from "./components/layout/Header.tsx";
import { FilterControls } from "./components/layout/FilterControls.tsx";
import { Footer } from "./components/layout/Footer.tsx";
import { SectionHeading } from "./components/shared/SectionHeading.tsx";
import { KPICards } from "./components/kpi/KPICards.tsx";
import { RevenueTimeSeries } from "./components/revenue/RevenueTimeSeries.tsx";
import { TotalRevenueStacked } from "./components/revenue/TotalRevenueStacked.tsx";
import { YoYComparison } from "./components/revenue/YoYComparison.tsx";
import { RevenueSplit } from "./components/revenue/RevenueSplit.tsx";
import { PaymentBreakdown } from "./components/revenue/PaymentBreakdown.tsx";
import { TransactionTrend } from "./components/occupancy/TransactionTrend.tsx";
import { OccupancyTrend } from "./components/occupancy/OccupancyTrend.tsx";
import { HourlyActivity } from "./components/occupancy/HourlyActivity.tsx";
import { SundayImpact } from "./components/occupancy/SundayImpact.tsx";
import { CitationTrend } from "./components/citations/CitationTrend.tsx";
import { TopViolations } from "./components/citations/TopViolations.tsx";
import { PadresImpact } from "./components/special-events/PadresImpact.tsx";
import { MeterMap } from "./components/map/MeterMap.tsx";
import { PolicyTimeline } from "./components/timeline/PolicyTimeline.tsx";

function Dashboard() {
  const { data, loading, error } = useData();
  const [zone, setZone] = useState("All");
  const filtered = useFilteredData(data, zone);
  const [darkMode, setDarkMode] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error || !data || !filtered) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-semibold">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const lcm = data.metadata.lastCompleteMonth;
  const showPadres = data.gameday && (zone === "All" || zone === "Downtown");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <Header lastRefresh={data.metadata.dataRange.end} darkMode={darkMode} onToggleDark={() => setDarkMode(!darkMode)} />
      <FilterControls zone={zone} onZoneChange={setZone} />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Policy Timeline */}
        <PolicyTimeline policyDates={data.metadata.policyDates} />

        {/* KPI Cards */}
        <section>
          <SectionHeading
            title="Key Metrics"
            description="Year-over-year comparison of 2025 vs 2024 averages"
          />
          <KPICards monthly={filtered.monthly} citations={filtered.citations} />
        </section>

        {/* Revenue Analysis */}
        <section>
          <SectionHeading
            id="revenue-section"
            title="Revenue Analysis"
            description="Meter revenue trends with policy reform annotations"
          />
          <div className="space-y-6">
            <RevenueTimeSeries data={filtered.monthly} lastCompleteMonth={lcm} />
            <TotalRevenueStacked monthly={filtered.monthly} citations={filtered.citations} lastCompleteMonth={lcm} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <YoYComparison data={filtered.monthly} lastCompleteMonth={lcm} />
              <RevenueSplit data={filtered.monthly} />
            </div>
            <PaymentBreakdown data={filtered.payments} />
          </div>
        </section>

        {/* Demand Analysis */}
        <section>
          <SectionHeading
            id="occupancy-section"
            title="Demand Analysis"
            description="Transaction volume, implied occupancy, and day-of-week patterns"
          />
          <div className="space-y-6">
            <TransactionTrend data={filtered.monthly} lastCompleteMonth={lcm} />
            {data.zonePricing && (
              <OccupancyTrend
                data={filtered.monthly}
                zonePricing={data.zonePricing}
                lastCompleteMonth={lcm}
              />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.hourly && (
                <HourlyActivity data={data.hourly} zone={zone} />
              )}
              <SundayImpact data={filtered.dowHeatmap} />
            </div>
          </div>
        </section>

        {/* Special Events — Padres Game Day Impact (Downtown/All only) */}
        {showPadres && (
          <section>
            <SectionHeading
              id="special-events-section"
              title="Special Event Impact"
              description="Padres home game day analysis for Downtown — before and after Petco Park surge pricing"
            />
            <PadresImpact data={data.gameday!} />
          </section>
        )}

        {/* Citation Analysis */}
        <section>
          <SectionHeading
            id="citations-section"
            title="Citation Analysis"
            description="Parking citation trends for meter-related violations"
          />
          <div className="space-y-6">
            <CitationTrend data={filtered.citations} lastCompleteMonth={lcm} />
            <TopViolations data={filtered.citations} />
          </div>
        </section>

        {/* Meter Map */}
        <section>
          <SectionHeading
            id="map-section"
            title="Meter Locations"
            description="Interactive map of parking meters in San Diego"
          />
          <MeterMap data={filtered.locations} />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
}
