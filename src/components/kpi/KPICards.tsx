import { useMemo } from "react";
import { KPICard } from "./KPICard.tsx";
import { formatCurrency, formatNumber } from "../../utils/formatters.ts";
import type { MonthlyRevenueRecord, CitationMonthlyRecord } from "../../types/data.ts";

interface KPICardsProps {
  monthly: MonthlyRevenueRecord[];
  citations: CitationMonthlyRecord[];
}

function avgMonthly(
  records: MonthlyRevenueRecord[],
  year: number,
  field: "revenue" | "transactions"
): number {
  const yearRecords = records.filter((r) => r.year === year);
  if (yearRecords.length === 0) return 0;
  const total = yearRecords.reduce((sum, r) => sum + r[field], 0);
  return total / yearRecords.length;
}

function avgMonthlyCitations(
  records: CitationMonthlyRecord[],
  year: number,
  field: "citationCount" | "fineTotal"
): number {
  const yearRecords = records.filter(
    (r) => r.year === year && r.meterRelated
  );
  if (yearRecords.length === 0) return 0;
  const total = yearRecords.reduce((sum, r) => sum + r[field], 0);
  return total / yearRecords.length;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function KPICards({ monthly, citations }: KPICardsProps) {
  const kpis = useMemo(() => {
    const rev2025 = avgMonthly(monthly, 2025, "revenue");
    const rev2024 = avgMonthly(monthly, 2024, "revenue");

    const trans2025 = avgMonthly(monthly, 2025, "transactions");
    const trans2024 = avgMonthly(monthly, 2024, "transactions");

    const avgPerTrans2025 = trans2025 > 0 ? rev2025 / trans2025 : 0;
    const avgPerTrans2024 = trans2024 > 0 ? rev2024 / trans2024 : 0;

    const citCount2025 = avgMonthlyCitations(citations, 2025, "citationCount");
    const citCount2024 = avgMonthlyCitations(citations, 2024, "citationCount");

    const citRev2025 = avgMonthlyCitations(citations, 2025, "fineTotal");
    const citRev2024 = avgMonthlyCitations(citations, 2024, "fineTotal");

    return {
      revenue: { current: rev2025, previous: rev2024 },
      transactions: { current: trans2025, previous: trans2024 },
      avgPerTrans: { current: avgPerTrans2025, previous: avgPerTrans2024 },
      citationCount: { current: citCount2025, previous: citCount2024 },
      citationRevenue: { current: citRev2025, previous: citRev2024 },
    };
  }, [monthly, citations]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KPICard
        title="Monthly Meter Revenue"
        currentValue={formatCurrency(kpis.revenue.current)}
        previousValue={formatCurrency(kpis.revenue.previous)}
        percentChange={pctChange(kpis.revenue.current, kpis.revenue.previous)}
      />
      <KPICard
        title="Monthly Transactions"
        currentValue={formatNumber(Math.round(kpis.transactions.current))}
        previousValue={formatNumber(Math.round(kpis.transactions.previous))}
        percentChange={pctChange(
          kpis.transactions.current,
          kpis.transactions.previous
        )}
      />
      <KPICard
        title="Avg Revenue / Transaction"
        currentValue={`$${kpis.avgPerTrans.current.toFixed(2)}`}
        previousValue={`$${kpis.avgPerTrans.previous.toFixed(2)}`}
        percentChange={pctChange(
          kpis.avgPerTrans.current,
          kpis.avgPerTrans.previous
        )}
      />
      <KPICard
        title="Monthly Meter Citations"
        currentValue={formatNumber(Math.round(kpis.citationCount.current))}
        previousValue={formatNumber(Math.round(kpis.citationCount.previous))}
        percentChange={pctChange(
          kpis.citationCount.current,
          kpis.citationCount.previous
        )}
      />
      <KPICard
        title="Monthly Citation Revenue"
        currentValue={formatCurrency(kpis.citationRevenue.current)}
        previousValue={formatCurrency(kpis.citationRevenue.previous)}
        percentChange={pctChange(
          kpis.citationRevenue.current,
          kpis.citationRevenue.previous
        )}
      />
    </div>
  );
}
