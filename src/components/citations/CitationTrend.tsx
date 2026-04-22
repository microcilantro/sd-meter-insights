import { useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
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
      <CalcInfo>
        <p><strong>Meter-related only:</strong> Only three violation codes are included — expired meter (86.0126), overtime parking (86.0127A), and out-of-stall (86.0124). Street sweeping, residential permit, and other non-meter violations are excluded.</p>
        <p><strong>Zone matching:</strong> Citations don't include a meter ID, only a street address. Addresses are normalized (uppercase, abbreviated street types) and matched against meter locations. Only ~34% of citations successfully match a zone; the remaining 66% are excluded from zone breakdowns but included in the "All" total.</p>
        <p><strong>Fine totals:</strong> Based on the fine amount listed in the citation at time of issue, before any appeals or reductions.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
