export const ZONES = [
  "All",
  "Downtown",
  "Uptown",
  "Mid-City",
  "Pacific Beach",
  "City",
  "Balboa Park",
] as const;

export type Zone = (typeof ZONES)[number];

export const ZONE_COLORS: Record<string, string> = {
  All: "#003366",
  Downtown: "#003366",
  Uptown: "#0066CC",
  "Mid-City": "#009933",
  "Pacific Beach": "#FF6600",
  City: "#CC3333",
  "Balboa Park": "#9933CC",
  Unknown: "#999999",
};

export const POLICY_DATES = [
  { date: "2025-01-31", label: "Rate Doubling" },
  { date: "2025-08-21", label: "Extended Hours" },
  { date: "2025-09-01", label: "Petco Zone" },
  { date: "2025-11-01", label: "CC Fee" },
];

export const PETCO_ZONE_BOUNDARY: [number, number][] = [
  [32.7066, -117.165],
  [32.7066, -117.1565],
  [32.7195, -117.1565],
  [32.7195, -117.165],
];

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CHART_COLORS = [
  "#003366", "#C69214", "#0066CC", "#009933",
  "#FF6600", "#CC3333", "#9933CC", "#666666",
];
