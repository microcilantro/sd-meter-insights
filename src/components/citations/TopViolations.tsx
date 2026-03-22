import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatNumber } from "../../utils/formatters.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import type { CitationMonthlyRecord } from "../../types/data.ts";

interface Props {
  data: CitationMonthlyRecord[];
}

export function TopViolations({ data }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    const preAgg = new Map<string, { desc: string; count: number }>();
    const postAgg = new Map<string, { desc: string; count: number }>();

    for (const r of data.filter((r) => r.meterRelated)) {
      const agg = r.year < 2025 ? preAgg : postAgg;
      for (const v of r.topViolations) {
        const entry = agg.get(v.code) || { desc: v.desc, count: 0 };
        entry.count += v.count;
        agg.set(v.code, entry);
      }
    }

    const allCodes = new Map<string, { desc: string; total: number }>();
    for (const [code, info] of preAgg) {
      allCodes.set(code, {
        desc: info.desc,
        total: info.count + (postAgg.get(code)?.count ?? 0),
      });
    }
    for (const [code, info] of postAgg) {
      if (!allCodes.has(code)) {
        allCodes.set(code, { desc: info.desc, total: info.count });
      }
    }

    return [...allCodes.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([code, info]) => ({
        violation: info.desc || code,
        "Pre-Reform": preAgg.get(code)?.count ?? 0,
        "Post-Reform": postAgg.get(code)?.count ?? 0,
      }));
  }, [data]);

  return (
    <ChartContainer
      title="Top Violation Types"
      subtitle="Pre-reform (2023-2024) vs post-reform (2025+)"
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 120 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{ fontSize: 11, fill: theme.tick }}
          />
          <YAxis
            type="category"
            dataKey="violation"
            tick={{ fontSize: 10, fill: theme.tick }}
            width={115}
          />
          <Tooltip
            formatter={(value: any) => formatNumber(value)}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Legend />
          <Bar dataKey="Pre-Reform" fill={theme.barSecondary} radius={[0, 2, 2, 0]} />
          <Bar dataKey="Post-Reform" fill={theme.barPrimary} radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
