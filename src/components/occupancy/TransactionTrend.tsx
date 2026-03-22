import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatNumber, formatMonthYear } from "../../utils/formatters.ts";
import { POLICY_DATES } from "../../utils/constants.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { isCompleteMonth } from "../../utils/dateFilters.ts";
import type { MonthlyRevenueRecord } from "../../types/data.ts";

interface Props {
  data: MonthlyRevenueRecord[];
  lastCompleteMonth?: { year: number; month: number };
}

export function TransactionTrend({ data, lastCompleteMonth }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    return data
      .filter((r) => !lastCompleteMonth || isCompleteMonth(r.year, r.month, lastCompleteMonth))
      .map((r) => ({
        monthKey: `${r.year}-${r.month}`,
        label: formatMonthYear(r.year, r.month),
        transactions: r.transactions,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [data, lastCompleteMonth]);

  return (
    <ChartContainer
      title="Monthly Transaction Volume"
      subtitle="Total parking meter transactions by month"
    >
      <ResponsiveContainer width="100%" height={300}>
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
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{ fontSize: 11, fill: theme.tick }}
            width={70}
          />
          <Tooltip
            formatter={(value: any) => [formatNumber(value), "Transactions"]}
            labelFormatter={(label: any) => {
              const [y, m] = label.split("-");
              return formatMonthYear(parseInt(y), parseInt(m));
            }}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Line
            type="monotone"
            dataKey="transactions"
            stroke={theme.lineSecondary}
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
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
