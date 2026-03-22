import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatMonthYear } from "../../utils/formatters.ts";
import { POLICY_DATES } from "../../utils/constants.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { isCompleteMonth } from "../../utils/dateFilters.ts";
import { computeOccupancy } from "../../utils/occupancy.ts";
import type { MonthlyRevenueRecord, ZonePricing } from "../../types/data.ts";

interface Props {
  data: MonthlyRevenueRecord[];
  zonePricing: ZonePricing[];
  lastCompleteMonth?: { year: number; month: number };
}

export function OccupancyTrend({ data, zonePricing, lastCompleteMonth }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    // Build a zone → pricing lookup
    const pricingMap = new Map<string, ZonePricing>(
      zonePricing.map((zp) => [zp.zone, zp])
    );

    return data
      .filter((r) => !lastCompleteMonth || isCompleteMonth(r.year, r.month, lastCompleteMonth))
      .map((r) => {
        const pricing = pricingMap.get(r.zone);
        const occ = pricing ? computeOccupancy(r, pricing) : 0;
        return {
          monthKey: `${r.year}-${r.month}`,
          occupancy: Math.min(occ * 100, 120), // cap display at 120%
        };
      })
      .filter((r) => r.occupancy > 0)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [data, zonePricing, lastCompleteMonth]);

  if (chartData.length === 0) return null;

  return (
    <ChartContainer
      title="Implied Parking Occupancy"
      subtitle="Payment occupancy vs. 85% optimal target — lower bound (excludes unpaid parking)"
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
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: theme.tick }}
            domain={[0, 120]}
            width={55}
          />
          <Tooltip
            formatter={(value: any) => [`${(value as number).toFixed(1)}%`, "Implied Occupancy"]}
            labelFormatter={(label: any) => {
              const [y, m] = label.split("-");
              return formatMonthYear(parseInt(y), parseInt(m));
            }}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          {/* 85% target reference line */}
          <ReferenceLine
            y={85}
            stroke="#CC3333"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: "85% Target",
              position: "insideTopRight",
              fill: "#CC3333",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="occupancy"
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
                stroke="#999999"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
