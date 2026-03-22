import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { DAY_NAMES } from "../../utils/constants.ts";
import type { HourlyRecord } from "../../types/data.ts";

interface Props {
  data: HourlyRecord[];
  zone: string;
}

const DOW_OPTIONS = [
  { label: "All Days", value: -1 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

type EventFilter = "all" | "game" | "nongame";

function formatHour(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function HourlyActivity({ data, zone }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);
  const [selectedDow, setSelectedDow] = useState<number>(-1); // -1 = all days
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  const showEventFilter =
    zone === "All" || zone === "Downtown";

  const chartData = useMemo(() => {
    const zoneData = data.filter((r) => r.zone === zone);

    // Build map: hour → { pre: number, post: number }
    const hourMap = new Map<number, { pre: number; preCount: number; post: number; postCount: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { pre: 0, preCount: 0, post: 0, postCount: 0 });
    }

    for (const r of zoneData) {
      // Day of week filter
      if (selectedDow !== -1 && r.dow !== selectedDow) continue;

      // Event filter (only applies to Downtown)
      if (showEventFilter && eventFilter === "game" && !r.isGameDay) continue;
      if (showEventFilter && eventFilter === "nongame" && r.isGameDay) continue;
      // For non-downtown zones or "all" event filter, include everything (isGameDay is always false)

      const entry = hourMap.get(r.hour)!;
      if (r.period === "pre-reform") {
        entry.pre += r.avgTrans * r.sampleDays;
        entry.preCount += r.sampleDays;
      } else {
        entry.post += r.avgTrans * r.sampleDays;
        entry.postCount += r.sampleDays;
      }
    }

    return Array.from({ length: 24 }, (_, h) => {
      const e = hourMap.get(h)!;
      return {
        hour: h,
        label: formatHour(h),
        preReform: e.preCount > 0 ? Math.round((e.pre / e.preCount) * 10) / 10 : null,
        postReform: e.postCount > 0 ? Math.round((e.post / e.postCount) * 10) / 10 : null,
      };
    });
  }, [data, zone, selectedDow, eventFilter, showEventFilter]);

  if (!data.length) return null;

  const filterBtnClass = (active: boolean) =>
    `px-2 py-1 text-xs rounded font-medium transition-colors ${
      active
        ? "bg-[#003366] text-white dark:bg-[#C69214]"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
    }`;

  const subtitle =
    selectedDow === -1
      ? "Average transactions per hour across all days"
      : `Average transactions per hour on ${DAY_NAMES[selectedDow === 0 ? 0 : selectedDow]}s`;

  return (
    <ChartContainer title="Hourly Activity Profile" subtitle={subtitle}>
      {/* Day of week filter */}
      <div className="flex flex-wrap gap-1 mb-3">
        {DOW_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={filterBtnClass(selectedDow === opt.value)}
            onClick={() => setSelectedDow(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Special event filter — Downtown/All only */}
      {showEventFilter && (
        <div className="flex gap-1 mb-4">
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center mr-1">
            Event:
          </span>
          {(
            [
              { label: "All Days", value: "all" },
              { label: "Padres Game Day", value: "game" },
              { label: "Non-Game Day", value: "nongame" },
            ] as { label: string; value: EventFilter }[]
          ).map((opt) => (
            <button
              key={opt.value}
              className={filterBtnClass(eventFilter === opt.value)}
              onClick={() => setEventFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: theme.tick }}
            interval={1}
          />
          <YAxis
            tick={{ fontSize: 11, fill: theme.tick }}
            label={{
              value: "Avg transactions",
              angle: -90,
              position: "insideLeft",
              offset: 10,
              style: { fontSize: 10, fill: theme.tick },
            }}
            width={65}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.tooltipBg,
              borderColor: theme.tooltipBorder,
              color: theme.tooltipText,
            }}
            formatter={(v: any, name: string) => [
              v != null ? v.toFixed(1) : "—",
              name === "preReform" ? "Pre-reform (2024)" : "Post-reform (2025+)",
            ]}
          />
          <Legend
            formatter={(v) =>
              v === "preReform" ? "Pre-reform (2024)" : "Post-reform (2025+)"
            }
          />
          <Line
            type="monotone"
            dataKey="preReform"
            stroke="#999999"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="postReform"
            stroke={dark ? "#C69214" : "#003366"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">
        Based on raw transaction timestamps. Pre-reform = before Feb 2025. Game day filter applies to Downtown zone only.
      </p>
    </ChartContainer>
  );
}
