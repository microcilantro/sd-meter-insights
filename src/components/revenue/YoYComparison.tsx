import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
import { formatCurrency } from "../../utils/formatters.ts";
import { MONTH_NAMES, CHART_COLORS } from "../../utils/constants.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { isCompleteMonth } from "../../utils/dateFilters.ts";
import type { MonthlyRevenueRecord } from "../../types/data.ts";

interface Props {
  data: MonthlyRevenueRecord[];
  lastCompleteMonth?: { year: number; month: number };
}

export function YoYComparison({ data, lastCompleteMonth }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const filteredData = useMemo(
    () => data.filter((r) => !lastCompleteMonth || isCompleteMonth(r.year, r.month, lastCompleteMonth)),
    [data, lastCompleteMonth]
  );

  const chartData = useMemo(() => {
    const years = [...new Set(filteredData.map((r) => r.year))].sort();
    const recentYears = years.slice(-3);

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const point: Record<string, string | number> = {
        month: MONTH_NAMES[i],
      };
      for (const year of recentYears) {
        const record = filteredData.find((r) => r.year === year && r.month === month);
        point[String(year)] = record?.revenue ?? 0;
      }
      return point;
    });
  }, [filteredData]);

  const years = [...new Set(filteredData.map((r) => r.year))].sort().slice(-3);

  return (
    <ChartContainer
      title="Year-over-Year Revenue Comparison"
      subtitle="Same-month comparison across years"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: theme.tick }} />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11, fill: theme.tick }}
            width={70}
          />
          <Tooltip
            formatter={(value: any) => formatCurrency(value)}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Legend />
          {years.map((year, i) => (
            <Bar
              key={year}
              dataKey={String(year)}
              fill={CHART_COLORS[i]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <CalcInfo>
        <p><strong>Purpose:</strong> Groups the same calendar month across years (Jan 2023 vs Jan 2024 vs Jan 2025) to separate seasonal patterns from reform-driven changes.</p>
        <p><strong>Source:</strong> Same monthly aggregated transaction files as the revenue time series. The same outlier filter ($200/transaction cap) applies.</p>
        <p><strong>Interpretation:</strong> A bar that's taller in 2025 than 2024 for the same month means the reform increased revenue for that month — even after accounting for seasonal patterns. Rate doubling on Jan 31, 2025 means February 2025 onward is the first full post-doubling month.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
