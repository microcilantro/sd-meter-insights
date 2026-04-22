import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
import { formatCurrency, formatMonthYear } from "../../utils/formatters.ts";
import { POLICY_DATES } from "../../utils/constants.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { isCompleteMonth } from "../../utils/dateFilters.ts";
import type { MonthlyRevenueRecord } from "../../types/data.ts";

interface Props {
  data: MonthlyRevenueRecord[];
  lastCompleteMonth?: { year: number; month: number };
}

export function RevenueTimeSeries({ data, lastCompleteMonth }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    return data
      .filter((r) => !lastCompleteMonth || isCompleteMonth(r.year, r.month, lastCompleteMonth))
      .map((r) => ({
        monthKey: `${r.year}-${r.month}`,
        label: formatMonthYear(r.year, r.month),
        revenue: r.revenue,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [data, lastCompleteMonth]);

  return (
    <ChartContainer
      title="Monthly Meter Revenue"
      subtitle="Total meter revenue by month with policy reform dates"
    >
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
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
            formatter={(value: any) => [formatCurrency(value), "Revenue"]}
            labelFormatter={(label: any) => {
              const [y, m] = label.split("-");
              return formatMonthYear(parseInt(y), parseInt(m));
            }}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={theme.line}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
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
                label={{
                  value: pd.label,
                  position: "insideTopRight",
                  fill: "#CC3333",
                  fontSize: 9,
                }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      <CalcInfo>
        <p><strong>Source:</strong> City of San Diego monthly aggregated transaction files (one CSV per year). Each row represents one meter-pole's total for a given month.</p>
        <p><strong>Amount:</strong> The city stores transaction amounts in cents; values are divided by 100 to convert to dollars.</p>
        <p><strong>Zone assignment:</strong> Each pole ID is joined to its zone via the meter locations file. Poles that don't appear in the locations file are excluded.</p>
        <p><strong>Outlier filter:</strong> Any pole-month record where the average transaction amount exceeds $200 is dropped as a data-quality error (e.g. one meter registered $130,563/transaction in Jan 2026 — a firmware glitch).</p>
        <p><strong>Partial months:</strong> The current in-progress month is excluded so charts always end on a complete month.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
