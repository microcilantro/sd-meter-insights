import { useMemo } from "react";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { CalcInfo } from "../shared/CalcInfo.tsx";
import { formatCurrencyFull } from "../../utils/formatters.ts";
import type { MonthlyRevenueRecord } from "../../types/data.ts";

interface Props {
  data: MonthlyRevenueRecord[];
}

export function RevenueSplit({ data }: Props) {
  const { avgMonthlyRevenue } = useMemo(() => {
    const records2025 = data.filter((r) => r.year === 2025);
    const total = records2025.reduce((sum, r) => sum + r.revenue, 0);
    return {
      avgMonthlyRevenue: records2025.length > 0 ? total / records2025.length : 0,
    };
  }, [data]);

  const oldCity = avgMonthlyRevenue * 0.55;
  const oldDistrict = avgMonthlyRevenue * 0.45;
  const newCity = avgMonthlyRevenue * 0.85;
  const newDistrict = avgMonthlyRevenue * 0.15;

  return (
    <ChartContainer
      title="Revenue Split: City vs. Community Parking Districts"
      subtitle="Based on 2025 average monthly revenue"
    >
      <div className="space-y-4">
        <SplitBar
          label="Old Split (55/45)"
          cityPct={55}
          districtPct={45}
          cityAmount={oldCity}
          districtAmount={oldDistrict}
        />
        <SplitBar
          label="New Split (85/15)"
          cityPct={85}
          districtPct={15}
          cityAmount={newCity}
          districtAmount={newDistrict}
        />
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Note: Illustrative split based on current revenue. Actual allocations
        may differ due to net revenue calculations.
      </p>
      <CalcInfo>
        <p><strong>Old split (55/45):</strong> Under the prior policy, 55% of net meter revenue went to the City's General Fund and 45% to Community Parking Districts (used for local transportation improvements).</p>
        <p><strong>New split (85/15):</strong> The 2025 reform shifted the split to 85% General Fund / 15% Community Parking Districts — meaning significantly less funding flows to neighborhood parking programs.</p>
        <p><strong>Dollar amounts:</strong> Calculated by applying each percentage to the average monthly revenue across all 2025 months in this dataset. These are illustrative — the city calculates splits on net revenue (after operating costs) which is not available in this dataset.</p>
        <p><strong>New split segment:</strong> The 15% district segment is too narrow to display a dollar amount — hover to see the value in the tooltip.</p>
      </CalcInfo>
    </ChartContainer>
  );
}

function SplitBar({
  label,
  cityPct,
  districtPct,
  cityAmount,
  districtAmount,
}: {
  label: string;
  cityPct: number;
  districtPct: number;
  cityAmount: number;
  districtAmount: number;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      <div className="flex h-8 rounded overflow-hidden text-xs font-medium">
        <div
          className="bg-[#003366] text-white flex items-center justify-center"
          style={{ width: `${cityPct}%` }}
        >
          City {cityPct}% ({formatCurrencyFull(cityAmount)})
        </div>
        <div
          className="bg-[#C69214] text-white flex items-center justify-center"
          style={{ width: `${districtPct}%` }}
        >
          {districtPct >= 20 ? `District ${districtPct}% (${formatCurrencyFull(districtAmount)})` : `${districtPct}%`}
        </div>
      </div>
      {districtPct < 20 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
          District {districtPct}%: {formatCurrencyFull(districtAmount)}
        </p>
      )}
    </div>
  );
}
