import { useMemo } from "react";
import { KPICard } from "./KPICard.tsx";
import { formatCurrency, formatNumber, formatMonthYear } from "../../utils/formatters.ts";
import type { MonthlyRevenueRecord, CitationMonthlyRecord, DateRange } from "../../types/data.ts";

interface KPICardsProps {
  monthly: MonthlyRevenueRecord[];      // date+zone filtered
  allMonthly: MonthlyRevenueRecord[];   // zone filtered, full history
  citations: CitationMonthlyRecord[];
  allCitations: CitationMonthlyRecord[];
  dateRange: DateRange | null;
}

function avg(records: MonthlyRevenueRecord[], field: "revenue" | "transactions"): number {
  if (records.length === 0) return 0;
  return records.reduce((s, r) => s + r[field], 0) / records.length;
}

function avgCitations(records: CitationMonthlyRecord[], field: "citationCount" | "fineTotal"): number {
  const filtered = records.filter((r) => r.meterRelated);
  if (filtered.length === 0) return 0;
  return filtered.reduce((s, r) => s + r[field], 0) / filtered.length;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function KPICards({ monthly, allMonthly, citations, allCitations, dateRange }: KPICardsProps) {
  const { current, previous, label } = useMemo(() => {
    if (!dateRange) {
      // Default: 2025 vs 2024
      const cur = allMonthly.filter((r) => r.year === 2025);
      const prev = allMonthly.filter((r) => r.year === 2024);
      const curCit = allCitations.filter((r) => r.year === 2025);
      const prevCit = allCitations.filter((r) => r.year === 2024);
      return {
        current: { monthly: cur, citations: curCit },
        previous: { monthly: prev, citations: prevCit },
        label: "2025 avg vs 2024 avg",
      };
    }

    // With date range: current = months in range, previous = same months prior year
    const { start, end } = dateRange;
    const priorStart = { year: start.year - 1, month: start.month };
    const priorEnd = { year: end.year - 1, month: end.month };

    function inRange(year: number, month: number, s: typeof start, e: typeof end) {
      const key = year * 100 + month;
      return key >= s.year * 100 + s.month && key <= e.year * 100 + e.month;
    }

    const cur = monthly; // already filtered to range
    const prev = allMonthly.filter((r) => inRange(r.year, r.month, priorStart, priorEnd));
    const curCit = citations;
    const prevCit = allCitations.filter((r) => inRange(r.year, r.month, priorStart, priorEnd));

    const curLabel = `${formatMonthYear(start.year, start.month)}–${formatMonthYear(end.year, end.month)}`;
    const prevLabel = `${formatMonthYear(priorStart.year, priorStart.month)}–${formatMonthYear(priorEnd.year, priorEnd.month)}`;

    return {
      current: { monthly: cur, citations: curCit },
      previous: { monthly: prev, citations: prevCit },
      label: `${curLabel} vs ${prevLabel}`,
    };
  }, [monthly, allMonthly, citations, allCitations, dateRange]);

  const rev = { cur: avg(current.monthly, "revenue"), prev: avg(previous.monthly, "revenue") };
  const tx  = { cur: avg(current.monthly, "transactions"), prev: avg(previous.monthly, "transactions") };
  const apt = {
    cur: tx.cur > 0 ? rev.cur / tx.cur : 0,
    prev: tx.prev > 0 ? rev.prev / tx.prev : 0,
  };
  const cit = {
    cur: avgCitations(current.citations, "citationCount"),
    prev: avgCitations(previous.citations, "citationCount"),
  };
  const citRev = {
    cur: avgCitations(current.citations, "fineTotal"),
    prev: avgCitations(previous.citations, "fineTotal"),
  };

  const curLabel = dateRange
    ? `${dateRange.start.year}–${dateRange.end.year === dateRange.start.year ? "" : dateRange.end.year}`.replace("–", dateRange.start.year === dateRange.end.year ? "" : "–")
    : "2025";
  const prevLabel = dateRange ? `${dateRange.start.year - 1}` : "2024";

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Monthly Meter Revenue"
          currentValue={formatCurrency(rev.cur)} previousValue={formatCurrency(rev.prev)}
          percentChange={pctChange(rev.cur, rev.prev)} currentLabel={curLabel} previousLabel={prevLabel} />
        <KPICard title="Monthly Transactions"
          currentValue={formatNumber(Math.round(tx.cur))} previousValue={formatNumber(Math.round(tx.prev))}
          percentChange={pctChange(tx.cur, tx.prev)} currentLabel={curLabel} previousLabel={prevLabel} />
        <KPICard title="Avg Revenue / Transaction"
          currentValue={`$${apt.cur.toFixed(2)}`} previousValue={`$${apt.prev.toFixed(2)}`}
          percentChange={pctChange(apt.cur, apt.prev)} currentLabel={curLabel} previousLabel={prevLabel} />
        <KPICard title="Monthly Meter Citations"
          currentValue={formatNumber(Math.round(cit.cur))} previousValue={formatNumber(Math.round(cit.prev))}
          percentChange={pctChange(cit.cur, cit.prev)} currentLabel={curLabel} previousLabel={prevLabel} />
        <KPICard title="Monthly Citation Revenue"
          currentValue={formatCurrency(citRev.cur)} previousValue={formatCurrency(citRev.prev)}
          percentChange={pctChange(citRev.cur, citRev.prev)} currentLabel={curLabel} previousLabel={prevLabel} />
      </div>
    </div>
  );
}
