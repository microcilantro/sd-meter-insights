import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatCurrency, formatMonthYear } from "../../utils/formatters.ts";
import { POLICY_DATES } from "../../utils/constants.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { isCompleteMonth } from "../../utils/dateFilters.ts";
import type { MonthlyRevenueRecord, CitationMonthlyRecord } from "../../types/data.ts";

interface Props {
  monthly: MonthlyRevenueRecord[];
  citations: CitationMonthlyRecord[];
  lastCompleteMonth?: { year: number; month: number };
}

export function TotalRevenueStacked({ monthly, citations, lastCompleteMonth }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    // Build citation fine total lookup by (year, month)
    const citationMap = new Map<string, number>();
    for (const r of citations) {
      if (!r.meterRelated) continue;
      if (lastCompleteMonth && !isCompleteMonth(r.year, r.month, lastCompleteMonth)) continue;
      const key = `${r.year}-${r.month}`;
      citationMap.set(key, (citationMap.get(key) ?? 0) + r.fineTotal);
    }

    return monthly
      .filter((r) => !lastCompleteMonth || isCompleteMonth(r.year, r.month, lastCompleteMonth))
      .map((r) => {
        const key = `${r.year}-${r.month}`;
        return {
          monthKey: key,
          label: formatMonthYear(r.year, r.month),
          meterRevenue: r.revenue,
          citationFines: citationMap.get(key) ?? 0,
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [monthly, citations, lastCompleteMonth]);

  return (
    <ChartContainer
      title="Total Revenue: Meter + Citation Fines"
      subtitle="Combined meter revenue and meter-violation citation fines by month"
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            dataKey="monthKey"
            tickFormatter={(v: string) => {
              const [y, m] = v.split("-");
              return m === "1" ? y : "";
            }}
            tick={{ fontSize: 11, fill: theme.tick }}
            interval={0}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11, fill: theme.tick }}
            width={70}
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              formatCurrency(value as number),
              name === "meterRevenue" ? "Meter Revenue" : "Citation Fines",
            ]}
            labelFormatter={(label: any) => {
              const [y, m] = label.split("-");
              return formatMonthYear(parseInt(y), parseInt(m));
            }}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Legend
            formatter={(value) =>
              value === "meterRevenue" ? "Meter Revenue" : "Citation Fines (meter violations)"
            }
          />
          <Bar dataKey="meterRevenue" stackId="total" fill="#003366" name="meterRevenue" radius={[0, 0, 0, 0]} />
          <Bar dataKey="citationFines" stackId="total" fill="#C69214" name="citationFines" radius={[2, 2, 0, 0]} />
          {POLICY_DATES.map((pd) => {
            const date = new Date(pd.date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            return (
              <ReferenceLine
                key={pd.date}
                x={key}
                stroke="#CC3333"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">
        Note: Citation fines cover meter violations only (~34% zone-match rate).
      </p>
    </ChartContainer>
  );
}
