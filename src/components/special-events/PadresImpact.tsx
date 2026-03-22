import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, ComposedChart, Line,
  ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatCurrency } from "../../utils/formatters.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import type { GamedayData } from "../../types/data.ts";

interface Props {
  data: GamedayData;
}

const SURCHARGE_DATE = "2025-09-01";

const BUCKET_COLORS = ["#9ca3af", "#60a5fa", "#003366", "#C69214"];
const BUCKET_LABELS = [
  "Pre-Surcharge Non-Game",
  "Pre-Surcharge Game Day",
  "Post-Surcharge Non-Game",
  "Post-Surcharge Game Day",
];

export function PadresImpact({ data }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  // Summary grouped bar data — 4 buckets
  const summaryData = useMemo(() => {
    const periods: Array<"pre-surcharge" | "post-surcharge"> = [
      "pre-surcharge",
      "post-surcharge",
    ];
    const result = [];
    let i = 0;
    for (const period of periods) {
      for (const isGameDay of [false, true]) {
        const s = data.summary.find(
          (x) => x.period === period && x.isGameDay === isGameDay
        );
        result.push({
          label: BUCKET_LABELS[i],
          avgRevenue: s?.avgDailyRevenue ?? 0,
          avgTransactions: s?.avgDailyTransactions ?? 0,
          sampleDays: s?.sampleDays ?? 0,
          color: BUCKET_COLORS[i],
        });
        i++;
      }
    }
    return result;
  }, [data.summary]);

  // Daily time-series: line for all, custom dot for game days.
  // Cap outliers at 99th percentile to prevent one bad data point from compressing the chart.
  const dailyChartData = useMemo(() => {
    const sorted = [...data.daily].sort((a, b) => a.revenue - b.revenue);
    const p99idx = Math.floor(sorted.length * 0.99);
    const cap = sorted[p99idx]?.revenue ?? Infinity;
    return data.daily
      .filter((d) => d.revenue <= cap)
      .map((d) => ({
        date: d.date,
        revenue: d.revenue,
        isGameDay: d.isGameDay,
      }));
  }, [data.daily]);

  return (
    <div className="space-y-6">
      {/* Summary comparison bars */}
      <ChartContainer
        title="Padres Game Day Revenue Impact"
        subtitle="Average daily Downtown revenue — before and after Petco Park surge pricing (Sep 1, 2025)"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={summaryData}
            margin={{ top: 10, right: 20, bottom: 60, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: theme.tick, width: 80 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 11, fill: theme.tick }}
              width={70}
            />
            <Tooltip
              formatter={(value: any, _: any, props: any) => [
                `${formatCurrency(value as number)} avg/day`,
                `${props.payload.sampleDays} sample days`,
              ]}
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                color: theme.tooltipText,
              }}
            />
            <Bar dataKey="avgRevenue" name="Avg Daily Revenue" radius={[2, 2, 0, 0]}>
              {summaryData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400 justify-center">
          {BUCKET_LABELS.map((label, i) => (
            <span key={i} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                style={{ background: BUCKET_COLORS[i] }}
              />
              {label}
            </span>
          ))}
        </div>
      </ChartContainer>

      {/* Daily revenue time series with game day dot markers */}
      <ChartContainer
        title="Downtown Daily Revenue with Padres Game Days"
        subtitle="Orange dots mark Padres home game days. Dashed line marks Petco Park surge pricing start (Sep 1, 2025)."
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={dailyChartData}
            margin={{ top: 10, right: 20, bottom: 5, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => {
                // Show month/year label only for the 1st of each month
                if (v && v.slice(8) === "01") {
                  const parts = v.split("-");
                  const months = [
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec",
                  ];
                  return `${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
                }
                return "";
              }}
              tick={{ fontSize: 10, fill: theme.tick }}
              interval={0}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 11, fill: theme.tick }}
              width={70}
            />
            <Tooltip
              formatter={(value: any, _: any, props: any) => [
                formatCurrency(value as number),
                props.payload.isGameDay ? "Game Day Revenue" : "Daily Revenue",
              ]}
              labelFormatter={(label: any) => String(label)}
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                color: theme.tooltipText,
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={theme.line}
              strokeWidth={1}
              name="Daily Revenue"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!payload.isGameDay) return <g key={props.key} />;
                return (
                  <circle
                    key={props.key}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#C69214"
                    stroke="#C69214"
                  />
                );
              }}
              activeDot={{ r: 5 }}
            />
            <ReferenceLine
              x={SURCHARGE_DATE}
              stroke="#CC3333"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Petco Zone Start",
                position: "insideTopRight",
                fill: "#CC3333",
                fontSize: 9,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2">
          Orange dots = Padres home game days. Downtown zone only.
        </p>
      </ChartContainer>
    </div>
  );
}
