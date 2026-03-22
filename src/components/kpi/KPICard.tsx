import { formatPercent } from "../../utils/formatters.ts";

interface KPICardProps {
  title: string;
  currentValue: string;
  previousValue: string;
  percentChange: number;
  currentLabel?: string;
  previousLabel?: string;
}

export function KPICard({
  title,
  currentValue,
  previousValue,
  percentChange,
  currentLabel = "2025",
  previousLabel = "2024",
}: KPICardProps) {
  const isPositive = percentChange > 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeBg = isPositive ? "bg-green-50" : "bg-red-50";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{currentValue}</p>
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded ${changeBg} ${changeColor}`}
        >
          {formatPercent(percentChange)}
        </span>
        <span className="text-xs text-gray-400">
          vs {previousValue} ({previousLabel})
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Avg. monthly ({currentLabel})
      </p>
    </div>
  );
}
