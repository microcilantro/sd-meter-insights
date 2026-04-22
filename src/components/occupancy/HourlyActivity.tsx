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
      {eventFilter === "game" && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
          ⚠ Payment occupancy drops at game time because time-limited meters expire while cars remain inside the stadium. The pre-game arrival surge (2–6pm) is the meaningful signal for game-day demand.
        </p>
      )}
      <CalcInfo>
        <p><strong>Source:</strong> Raw transaction files (~370 MB/year) which include a timestamp for each individual paid session. The daily/monthly files do not contain time-of-day data.</p>
        <p><strong>Carry-forward:</strong> Each transaction is counted as occupying a space for every hour from its start time through its expire time (from <em>date_trans_start</em> to <em>date_meter_expire</em>). Carry-forward is capped at the individual meter's enforcement end hour so sessions don't bleed into hours when that meter is no longer active.</p>
        <p><strong>Denominator:</strong> For each hour H, only meters whose enforcement window covers hour H are counted (e.g. a meter enforced 8am–6pm is not in the denominator at 7pm). This prevents artificially low readings during off-hours.</p>
        <p><strong>Game-day paradox:</strong> On game days, payment occupancy dips sharply at game time (~7pm) because most Downtown meters have 1–2 hour time limits — sessions paid before the game expire while the car remains in the space. The occupancy drop is real in payment terms but not in physical presence terms. Look at the 2–6pm window for the true pre-game demand signal.</p>
        <p><strong>Values over 100%:</strong> Possible for multi-space meters (one pole ID covers several bays), or when a meter's enforce window extends past the hour boundary used in our count.</p>
      </CalcInfo>
    </ChartContainer>
  );
}
