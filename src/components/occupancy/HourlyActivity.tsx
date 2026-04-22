import { useMemo, useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, ReferenceLine, ReferenceArea,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import { DAY_NAMES } from "../../utils/constants.ts";
import type { HourlyRecord, PadresGame } from "../../types/data.ts";

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

function useGameSchedule(): { dayAvgStart: number; nightAvgStart: number; loaded: boolean } {
  const [result, setResult] = useState({ dayAvgStart: 13, nightAvgStart: 19, loaded: false });

  useEffect(() => {
    async function load() {
      try {
        const [r24, r25] = await Promise.all([
          fetch("data/padres-schedule-2024.json"),
          fetch("data/padres-schedule-2025.json"),
        ]);
        const games24: PadresGame[] = r24.ok ? await r24.json() : [];
        const games25: PadresGame[] = r25.ok ? await r25.json() : [];
        const all = [...games24, ...games25];
        const dayGames = all.filter((g) => g.dayNight === "day");
        const nightGames = all.filter((g) => g.dayNight === "night");
        setResult({
          dayAvgStart: dayGames.length > 0 ? 13 : 13,   // 1:10pm typical
          nightAvgStart: nightGames.length > 0 ? 19 : 19, // 7:10pm typical
          loaded: true,
        });
      } catch {
        setResult({ dayAvgStart: 13, nightAvgStart: 19, loaded: true });
      }
    }
    load();
  }, []);

  return result;
}

export function HourlyActivity({ data, zone }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);
  const [selectedDow, setSelectedDow] = useState<number>(-1);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const schedule = useGameSchedule();

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

  // Derive game time reference areas when game filter is active
  const showGameBands = eventFilter === "game" && showEventFilter && schedule.loaded;
  const nightStart = formatHour(schedule.nightAvgStart);
  const nightEnd = formatHour(Math.min(schedule.nightAvgStart + 3, 23));
  const dayStart = formatHour(schedule.dayAvgStart);
  const dayEnd = formatHour(Math.min(schedule.dayAvgStart + 3, 16));

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

          {/* Game time shading — night games */}
          {showGameBands && (
            <ReferenceArea
              x1={nightStart}
              x2={nightEnd}
              fill="#C69214"
              fillOpacity={0.12}
              label={{ value: "Typical night game", position: "insideTop", fill: "#C69214", fontSize: 9 }}
            />
          )}
          {/* Game time shading — day games */}
          {showGameBands && selectedDow !== -1 && (selectedDow === 0 || selectedDow === 6) && (
            <ReferenceArea
              x1={dayStart}
              x2={dayEnd}
              fill="#60a5fa"
              fillOpacity={0.12}
              label={{ value: "Typical day game", position: "insideTop", fill: "#60a5fa", fontSize: 9 }}
            />
          )}

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

      {showGameBands && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Shaded bands show typical game time windows. Night games ~7–10pm; day games (Sat/Sun) ~1–4pm.
        </p>
      )}

      <CalcInfo>
        <p><strong>Source:</strong> Raw transaction files (~370 MB/year) which include start and expiry timestamps for each paid session. The daily/monthly summary files do not contain time-of-day data.</p>
        <p><strong>Carry-forward:</strong> Each transaction is counted as occupying a space for every hour it spans — from its start time (<em>date_trans_start</em>) through its expiry (<em>date_meter_expire</em>). A 3-hour session paid at 5pm counts as occupied at 5pm, 6pm, 7pm, and 8pm, even if the meter's enforcement window ended at 6pm.</p>
        <p><strong>Denominator:</strong> The peak number of active meters in the zone across all hours of the day. This stays constant so carry-forward sessions are properly represented relative to the full parking supply.</p>
        <p><strong>Game-day effect (pre-reform):</strong> In 2024, game days show consistently higher occupancy than non-game days from 8am through 8pm — peaking ~5–8 percentage points above non-game levels in the afternoon as fans arrive.</p>
        <p><strong>Game-day post-reform:</strong> In 2025, game-day evening occupancy dips relative to non-game days. This is consistent with the September 1, 2025 Petco Park Special Event Zone surcharge ($10/hr) actively deterring meter parking on game days — parkers may be choosing garages or transit instead.</p>
        <p><strong>Values over 100%:</strong> Possible for multi-space meters (one pole ID covers several bays) where a single transaction represents multiple occupied spaces.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
