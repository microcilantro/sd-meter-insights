import { ZONES, MONTH_NAMES } from "../../utils/constants.ts";
import type { DateRange } from "../../types/data.ts";

export type AppTab = "dashboard" | "map";

interface FilterControlsProps {
  zone: string;
  onZoneChange: (zone: string) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  dataYears: number[];
}

const DATA_YEARS = [2023, 2024, 2025, 2026];

export function FilterControls({
  zone,
  onZoneChange,
  dateRange,
  onDateRangeChange,
  activeTab,
  onTabChange,
  dataYears,
}: FilterControlsProps) {
  const years = dataYears.length > 0 ? dataYears : DATA_YEARS;

  function handleStartChange(field: "year" | "month", raw: string) {
    const val = parseInt(raw);
    const current = dateRange ?? {
      start: { year: years[0], month: 1 },
      end: { year: years[years.length - 1], month: 12 },
    };
    const next = { ...current, start: { ...current.start, [field]: val } };
    onDateRangeChange(next);
  }

  function handleEndChange(field: "year" | "month", raw: string) {
    const val = parseInt(raw);
    const current = dateRange ?? {
      start: { year: years[0], month: 1 },
      end: { year: years[years.length - 1], month: 12 },
    };
    const next = { ...current, end: { ...current.end, [field]: val } };
    onDateRangeChange(next);
  }

  const tabClass = (tab: AppTab) =>
    `px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
      activeTab === tab
        ? "bg-[#003366] text-white dark:bg-[#C69214]"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  const selectClass =
    "border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex gap-1 mr-2">
          <button className={tabClass("dashboard")} onClick={() => onTabChange("dashboard")}>
            Dashboard
          </button>
          <button className={tabClass("map")} onClick={() => onTabChange("map")}>
            Map Explorer
          </button>
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />

        {/* Zone filter */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Zone:</label>
          <select
            value={zone}
            onChange={(e) => onZoneChange(e.target.value)}
            className={selectClass}
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-600 hidden sm:block" />

        {/* Date range */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">From:</label>
          <select
            value={dateRange?.start.month ?? ""}
            onChange={(e) => handleStartChange("month", e.target.value)}
            className={selectClass}
          >
            {!dateRange && <option value="">Month</option>}
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={dateRange?.start.year ?? ""}
            onChange={(e) => handleStartChange("year", e.target.value)}
            className={selectClass}
          >
            {!dateRange && <option value="">Year</option>}
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <span className="text-xs text-gray-400">to</span>

          <select
            value={dateRange?.end.month ?? ""}
            onChange={(e) => handleEndChange("month", e.target.value)}
            className={selectClass}
          >
            {!dateRange && <option value="">Month</option>}
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={dateRange?.end.year ?? ""}
            onChange={(e) => handleEndChange("year", e.target.value)}
            className={selectClass}
          >
            {!dateRange && <option value="">Year</option>}
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {dateRange && (
            <button
              onClick={() => onDateRangeChange(null)}
              className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
