import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { formatCurrency } from "../../utils/formatters.ts";
import { getChartTheme } from "../../utils/chartTheme.ts";
import { useIsDark } from "../../hooks/useDarkMode.ts";
import type { PaymentMethodRecord } from "../../types/data.ts";

const COLORS = ["#003366", "#C69214", "#0066CC", "#009933", "#CC3333"];

interface Props {
  data: PaymentMethodRecord[] | null;
}

export function PaymentBreakdown({ data }: Props) {
  const dark = useIsDark();
  const theme = getChartTheme(dark);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Aggregate by payment method for the latest year
    const latestYear = Math.max(...data.map((r) => r.year));
    const yearData = data.filter((r) => r.year === latestYear);
    const byMethod = new Map<string, { transactions: number; revenue: number }>();

    for (const r of yearData) {
      if (r.payMethod === "Smart Card Refund") continue;
      const entry = byMethod.get(r.payMethod) || { transactions: 0, revenue: 0 };
      entry.transactions += r.transactions;
      entry.revenue += r.revenue;
      byMethod.set(r.payMethod, entry);
    }

    return [...byMethod.entries()]
      .map(([method, data]) => ({
        name: method,
        value: data.transactions,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (!chartData) {
    return (
      <ChartContainer
        title="Payment Method Breakdown"
        subtitle="Requires raw transaction data processing"
      >
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Payment method data not available. Run pipeline with raw data.
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title="Payment Method Breakdown"
      subtitle="Transaction share by payment type"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            label={(props: any) => {
              const text = `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`;
              return <text x={props.x} y={props.y} fill={theme.tick} fontSize={12} textAnchor={props.textAnchor}>{text}</text>;
            }}
            labelLine={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, _name: any, props: any) => [
              `${value.toLocaleString()} txns (${formatCurrency(props.payload.revenue)})`,
              "Total",
            ]}
            contentStyle={{ backgroundColor: theme.tooltipBg, borderColor: theme.tooltipBorder, color: theme.tooltipText }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
