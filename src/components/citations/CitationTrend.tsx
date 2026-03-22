import { useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatNumber, formatCurrency, formatMonthYear } from "../../utils/formatters.ts";
import { POLICY_DATES } from "../../utils/constants.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { isCompleteMonth } from "../../utils/dateFilters.ts";
import type { CitationMonthlyRecord } from "../../types/data.ts";

interface Props {
  data: CitationMonthlyRecord[];
  lastCompleteMonth?: { year: number; month: number };
}

export function CitationTrend({ data, lastCompleteMonth }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    return data
      .filter((r) => r.meterRelated && (!lastCompleteMonth || isCompleteMonth(r.year, r.month, lastCompleteMonth)))
      .map((r) => ({
        monthKey: `${r.year}-${r.month}`,
        citations: r.citationCount,
        revenue: r.fineTotal,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [data, lastCompleteMonth]);

  return (
    <ChartContainer
      title="Meter-Related Citations & Revenue"
      subtitle="Expired meter, overtime, and out-of-stall violations"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
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
            yAxisId="left"
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{ fontSize: 11, fill: theme.tick }}
            width={60}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11, fill: theme.tick }}
            width={70}
          />
          <Tooltip
            formatter={(value: any, name: any) => [
              name === "revenue" ? formatCurrency(value) : formatNumber(value),
              name === "revenue" ? "Fine Revenue" : "Citations",
            ]}
            labelFormatter={(label: any) => {
              const [y, m] = label.split("-");
              return formatMonthYear(parseInt(y), parseInt(m));
            }}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="citations"
            fill={theme.citationBar}
            opacity={0.7}
            radius={[2, 2, 0, 0]}
            name="Citations"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke={theme.line}
            strokeWidth={2}
            dot={false}
            name="Fine Revenue"
          />
          {POLICY_DATES.map((pd) => {
            const date = new Date(pd.date);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            return (
              <ReferenceLine
                key={pd.date}
                x={key}
                yAxisId="left"
                stroke="#CC3333"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
