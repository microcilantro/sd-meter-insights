import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
import { formatCurrency } from "../../utils/formatters.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import type { GamedayData } from "../../types/data.ts";

interface Props {
  data: GamedayData;
}

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

  return (
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

      <CalcInfo>
        <p><strong>Game dates:</strong> Fetched from the MLB Stats API (statsapi.mlb.com) for the Padres (team ID 135). Only regular-season home games are included; postponed and cancelled games are excluded.</p>
        <p><strong>Revenue source:</strong> Downtown daily aggregated transaction files. Each day's total is the sum of all paid meter sessions in the Downtown zone.</p>
        <p><strong>Period split:</strong> "Pre-surcharge" = before Sep 1, 2025. "Post-surcharge" = Sep 1, 2025 onward, when the Petco Park Special Event Zone ($10/hr surge pricing) was activated.</p>
        <p><strong>Sample size:</strong> Post-surcharge game days are limited to the 2025 Padres season (Sep–Oct 2025 home games only), so the sample is smaller than pre-surcharge.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
