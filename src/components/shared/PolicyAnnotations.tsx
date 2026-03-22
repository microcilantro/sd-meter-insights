import { ReferenceLine } from "recharts";
import { POLICY_DATES } from "../../utils/constants.ts";

interface PolicyAnnotationsProps {
  xKey?: string;
}

export function getPolicyAnnotations({ xKey = "monthKey" }: PolicyAnnotationsProps = {}) {
  void xKey;
  // Stagger vertical offsets to avoid overlapping labels
  const offsets = [10, 25, 10, 25];
  return POLICY_DATES.map((pd, i) => {
    const date = new Date(pd.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${month}`;
    return (
      <ReferenceLine
        key={pd.date}
        x={key}
        stroke="#CC3333"
        strokeDasharray="4 4"
        strokeWidth={1.5}
        label={{
          value: pd.label,
          position: "top",
          fill: "#CC3333",
          fontSize: 10,
          offset: offsets[i],
        }}
      />
    );
  });
}
