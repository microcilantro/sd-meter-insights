import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
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
  const [selectedDow, setSelectedDow] = useState<number>(-1);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  const showEventFilter = zone === "All" || zone === "Downtown";

  const chartData = useMemo(() => {
    const zoneData = data.filter((r) => r.zone === zone);

    const hourMap = new Map<number, { pre: number; preCount: number; post: number; postCount: number }>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, { pre: 0, preCount: 0, post: 0, postCount: 0 });
    }

    for (const r of zoneData) {
      if (selectedDow !== -1 && r.dow !== selectedDow) continue;
      if (showEventFilter && eventFilter === "game" && !r.isGameDay) continue;
      if (showEventFilter && eventFilter === "nongame" && r.isGameDay) continue;

      const entry = hourMap.get(r.hour)!;
      if (r.period === "pre-reform") {
        entry.pre += r.occupancy * r.sampleDays;
        entry.preCount += r.sampleDays;
      } else {
        entry.post += r.occupancy * r.sampleDays;
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

  const dowLabel = selectedDow === -1 ? "all days" : `${DAY_NAMES[selectedDow]}s`;

  return (
    <ChartContainer
      title="Hourly Parking Occupancy"
      subtitle={`Payment occupancy by hour of day — ${dowLabel}`}
    >
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
          <span className="text-xs text-gray-500 dark:text-gray-400 self-center mr-1">Event:</span>
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
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11, fill: theme.tick }}
            domain={[0, 100]}
            width={45}
          />
          <ReferenceLine
            y={85}
            stroke="#CC3333"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{ value: "85% Target", position: "insideTopRight", fill: "#CC3333", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
            formatter={(value, name) => {
              const label = name === "preReform" ? "Pre-reform (2024)" : "Post-reform (2025+)";
              const v = typeof value === "number" ? value.toFixed(1) : "—";
              return [`${v}%`, label] as [string, string];
            }}
          />
          <Legend
            formatter={(v: string) =>
              v === "preReform" ? "Pre-reform (2024)" : "Post-reform (2025+)"
            }
          />
          {/* Game-start marker — Padres games typically begin ~7pm */}
          {eventFilter === "game" && (
            <ReferenceLine
              x="7pm"
              stroke="#FF6B00"
              strokeDasharray="5 3"
              strokeWidth={1.5}
              label={{ value: "Typical game start", position: "insideTopLeft", fill: "#FF6B00", fontSize: 9 }}
            />
          )}
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
      <CalcInfo>
        <p><strong>Source:</strong> Raw transaction files (~370 MB/year) which include start and expiry timestamps for each paid session. The daily/monthly summary files do not contain time-of-day data.</p>
        <p><strong>Carry-forward:</strong> Each transaction is counted as occupying a space for every hour it spans — from its start time (<em>date_trans_start</em>) through its expiry (<em>date_meter_expire</em>). A 3-hour session paid at 5pm counts as occupied at 5pm, 6pm, 7pm, and 8pm, even if the meter's enforcement window ended at 6pm. This correctly captures pre-game parking sessions that extend into game time.</p>
        <p><strong>Denominator:</strong> The peak number of active meters in the zone across all hours of the day. This stays constant regardless of how many meters are in enforcement at any particular hour, so carry-forward sessions are properly represented relative to the full parking supply.</p>
        <p><strong>Game-day effect (pre-reform):</strong> In 2024, game days show consistently higher occupancy than non-game days from 8am through 8pm — peaking ~5–8 percentage points above non-game levels in the afternoon as fans arrive.</p>
        <p><strong>Game-day post-reform:</strong> In 2025, game-day evening occupancy dips relative to non-game days. This is consistent with the September 1, 2025 Petco Park Special Event Zone surcharge ($10/hr) actively deterring meter parking on game days — parkers may be choosing garages or transit instead.</p>
        <p><strong>Values over 100%:</strong> Possible for multi-space meters (one pole ID covers several bays) where a single transaction represents multiple occupied spaces.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
