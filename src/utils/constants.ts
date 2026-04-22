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

// Exact boundary from official City of San Diego KMZ file.
// Coordinates converted from KML [lng, lat] → Leaflet [lat, lng].
export const PETCO_ZONE_BOUNDARY: [number, number][] = [
  [32.7142896, -117.1665094],
  [32.7114279, -117.1665095],
  [32.7101324, -117.1665040],
  [32.7068396, -117.1605841],
  [32.7015875, -117.1524009],
  [32.7049189, -117.1493967],
  [32.7052236, -117.1494262],
  [32.7052394, -117.1474869],
  [32.7087839, -117.1476264],
  [32.7107123, -117.1476693],
  [32.7157506, -117.1476853],
  [32.7157836, -117.1504481],
  [32.7157069, -117.1664988],
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
