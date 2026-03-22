import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatNumber } from "../../utils/formatters.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import type { DowHeatmapRecord } from "../../types/data.ts";

interface Props {
  data: DowHeatmapRecord[];
}

export function SundayImpact({ data }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    const sunday = data.filter((r) => r.dayOfWeek === 0);
    if (sunday.length === 0) return [];

    const pre = sunday.find((r) => r.period === "pre-reform");
    const post = sunday.find((r) => r.period === "post-reform");

    return [
      {
        metric: "Avg Transactions",
        "Pre-Reform (2024)": pre?.avgTransactions ?? 0,
        "Post-Reform (2025)": post?.avgTransactions ?? 0,
      },
      {
        metric: "Avg Revenue ($)",
        "Pre-Reform (2024)": pre?.avgRevenue ?? 0,
        "Post-Reform (2025)": post?.avgRevenue ?? 0,
      },
    ];
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <ChartContainer
      title="Sunday Enforcement Impact"
      subtitle="Sunday meters were not enforced pre-reform in most districts"
    >
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis dataKey="metric" tick={{ fontSize: 11, fill: theme.tick }} />
          <YAxis tickFormatter={(v: number) => formatNumber(v)} tick={{ fontSize: 11, fill: theme.tick }} />
          <Tooltip
            formatter={(value: any) => formatNumber(value)}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Legend />
          <Bar dataKey="Pre-Reform (2024)" fill={theme.barSecondary} radius={[2, 2, 0, 0]} />
          <Bar dataKey="Post-Reform (2025)" fill={theme.barPrimary} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
