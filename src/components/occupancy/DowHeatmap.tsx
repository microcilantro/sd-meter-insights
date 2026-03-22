import { useMemo } from "react";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { DAY_NAMES } from "../../utils/constants.ts";
import { formatNumber } from "../../utils/formatters.ts";
import type { DowHeatmapRecord } from "../../types/data.ts";

interface Props {
  data: DowHeatmapRecord[];
}

export function DowHeatmap({ data }: Props) {
  const { pre, post, maxVal } = useMemo(() => {
    const pre = new Array(7).fill(0);
    const post = new Array(7).fill(0);
    let maxVal = 0;

    for (const r of data) {
      if (r.period === "pre-reform") {
        pre[r.dayOfWeek] = r.avgTransactions;
      } else {
        post[r.dayOfWeek] = r.avgTransactions;
      }
      maxVal = Math.max(maxVal, r.avgTransactions);
    }

    return { pre, post, maxVal };
  }, [data]);

  function cellColor(value: number): string {
    if (maxVal === 0) return "bg-gray-100";
    const intensity = value / maxVal;
    if (intensity > 0.8) return "bg-blue-700 text-white";
    if (intensity > 0.6) return "bg-blue-500 text-white";
    if (intensity > 0.4) return "bg-blue-400 text-white";
    if (intensity > 0.2) return "bg-blue-200";
    if (intensity > 0) return "bg-blue-100";
    return "bg-gray-50 text-gray-400";
  }

  // Reorder to Mon-Sun (shift Sunday from index 0 to end)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <ChartContainer
      title="Day-of-Week Transaction Heatmap"
      subtitle="Average daily transactions, pre-reform (2024) vs post-reform (2025)"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs text-gray-500 dark:text-gray-400 py-1 pr-2 w-28">
                Period
              </th>
              {dayOrder.map((d) => (
                <th
                  key={d}
                  className="text-center text-xs text-gray-500 dark:text-gray-400 py-1 px-1"
                >
                  {DAY_NAMES[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-xs text-gray-600 dark:text-gray-300 py-1 pr-2">Pre-Reform</td>
              {dayOrder.map((d) => (
                <td key={d} className="p-1">
                  <div
                    className={`text-center rounded py-2 px-1 text-xs font-medium ${cellColor(pre[d])}`}
                  >
                    {formatNumber(pre[d])}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className="text-xs text-gray-600 dark:text-gray-300 py-1 pr-2">Post-Reform</td>
              {dayOrder.map((d) => (
                <td key={d} className="p-1">
                  <div
                    className={`text-center rounded py-2 px-1 text-xs font-medium ${cellColor(post[d])}`}
                  >
                    {formatNumber(post[d])}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </ChartContainer>
  );
}
