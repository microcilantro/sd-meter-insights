import { useState, useEffect, useMemo } from "react";
import {
  MapContainer, TileLayer, CircleMarker, Tooltip, Polygon, useMap,
} from "react-leaflet";
import L from "leaflet";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { PETCO_ZONE_BOUNDARY, ZONE_COLORS, ZONES } from "../../utils/constants.ts";
import type { MeterLocationRecord, HourlyRecord } from "../../types/data.ts";
import "leaflet/dist/leaflet.css";

interface Props {
  allLocations: MeterLocationRecord[];  // full dataset, zone-unfiltered
  hourly: HourlyRecord[] | null;
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function occupancyColor(t: number): string {
  // 0=blue, 0.5=yellow, 1=red
  t = Math.max(0, Math.min(1, t));
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${lerp(59, 234, s)},${lerp(130, 179, s)},${lerp(246, 8, s)})`;
  } else {
    const s = (t - 0.5) * 2;
    return `rgb(${lerp(234, 220, s)},${lerp(179, 38, s)},${lerp(8, 38, s)})`;
  }
}

// Fit map to locations' bounding box
function MapBoundsController({ locations }: { locations: MeterLocationRecord[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((m) => [m.la, m.ln]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [locations, map]);
  return null;
}

function parseTimeHour(s: string): number {
  if (!s) return -1;
  const lower = s.trim().toLowerCase();
  const ampm = lower.match(/^(\d+)(am|pm)$/);
  if (ampm) {
    let h = parseInt(ampm[1]);
    if (ampm[2] === "pm" && h !== 12) h += 12;
    if (ampm[2] === "am" && h === 12) h = 0;
    return h;
  }
  const n = parseFloat(lower);
  if (!isNaN(n)) return n > 24 ? Math.floor(n / 100) : n;
  return -1;
}

export function MeterMap({ allLocations, hourly }: Props) {
  const [selectedZone, setSelectedZone] = useState<string>("All");
  const [selectedHour, setSelectedHour] = useState<number>(-1); // -1 = all hours
  const [colorMode, setColorMode] = useState<"activity" | "zone">("activity");

  // Zone-filtered locations
  const locations = useMemo(
    () =>
      selectedZone === "All"
        ? allLocations
        : allLocations.filter((m) => m.z === selectedZone),
    [allLocations, selectedZone]
  );

  // Per-zone hourly occupancy for the selected hour
  const zoneHourOccupancy = useMemo<Map<string, number>>(() => {
    if (!hourly || selectedHour < 0) return new Map();
    const map = new Map<string, number>();
    for (const r of hourly) {
      if (r.hour !== selectedHour || r.isGameDay) continue;
      // Aggregate across DOWs and periods, weighted by sampleDays
      const key = r.zone;
      const existing = map.get(key);
      if (existing === undefined) {
        map.set(key, r.occupancy);
      } else {
        // Simple average accumulation (good enough for visual)
        map.set(key, (existing + r.occupancy) / 2);
      }
    }
    return map;
  }, [hourly, selectedHour]);

  // Compute per-meter traffic score
  const { colorByPole, maxT } = useMemo(() => {
    const zoneMeters = locations;
    const sorted = [...zoneMeters].sort((a, b) => a.t - b.t);
    const p95 = sorted[Math.floor(sorted.length * 0.95)]?.t ?? 1;
    const maxT = Math.max(p95, 1);
    const colorByPole = new Map<string, string>();

    for (const m of locations) {
      if (colorMode === "zone") {
        colorByPole.set(m.p, ZONE_COLORS[m.z] || "#666666");
      } else {
        // Activity-based: scale lifetime transactions, then modulate by hourly occ if hour selected
        let rawT = Math.min(m.t, maxT);
        let tNorm = rawT / maxT;

        if (selectedHour >= 0) {
          // Check if this meter is active at the selected hour
          const start = parseTimeHour(m.ts);
          const end = parseTimeHour(m.te);
          const active = start >= 0 && end > start && selectedHour >= start && selectedHour < end;
          if (!active) {
            colorByPole.set(m.p, "#d1d5db"); // gray out inactive meters
            continue;
          }
          // Scale by zone-level hourly occupancy if available
          const zoneOcc = zoneHourOccupancy.get(m.z);
          if (zoneOcc !== undefined) {
            tNorm = zoneOcc / 100;
          }
        }
        colorByPole.set(m.p, occupancyColor(tNorm));
      }
    }
    return { colorByPole, maxT };
  }, [locations, colorMode, selectedHour, zoneHourOccupancy]);

  function formatHour(h: number) {
    if (h < 0) return "All hours";
    if (h === 0) return "12am";
    if (h === 12) return "12pm";
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  }

  const selectClass =
    "border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 dark:text-gray-100";

  return (
    <ChartContainer
      title="Meter Map Explorer"
      subtitle="Color intensity shows historical parking activity. Use filters to explore by zone and hour."
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400">Zone:</label>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className={selectClass}
          >
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400">Hour:</label>
          <select
            value={selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className={selectClass}
          >
            <option value={-1}>All hours</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400">Color:</label>
          <div className="flex gap-1">
            {(["activity", "zone"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setColorMode(m)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  colorMode === m
                    ? "bg-[#003366] text-white dark:bg-[#C69214]"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {m === "activity" ? "Activity" : "Zone"}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-gray-400 dark:text-gray-500">
          {locations.length.toLocaleString()} meters shown
        </span>
      </div>

      {/* Map */}
      <div className="h-[540px] rounded overflow-hidden">
        <MapContainer
          center={[32.7157, -117.1611]}
          zoom={13}
          className="h-full w-full"
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Petco Zone polygon — behind markers, non-interactive */}
          <Polygon
            positions={PETCO_ZONE_BOUNDARY}
            pathOptions={{
              color: "#FF6600",
              weight: 2,
              dashArray: "6 4",
              fillColor: "#FF6600",
              fillOpacity: 0.08,
              interactive: false,
            }}
          />

          {/* Meter markers */}
          {locations.map((meter) => {
            const color = colorByPole.get(meter.p) ?? "#9ca3af";
            return (
              <CircleMarker
                key={meter.p}
                center={[meter.la, meter.ln]}
                radius={4}
                fillColor={color}
                fillOpacity={0.85}
                stroke={false}
                pane="markerPane"
              >
                <Tooltip>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">{meter.p}</p>
                    <p>{meter.z} · {meter.a}</p>
                    {meter.s && <p>{meter.s}</p>}
                    <p>{meter.pr} · {meter.ts}–{meter.te} {meter.d}</p>
                    <p className="text-gray-400">
                      Lifetime: {meter.t.toLocaleString()} transactions
                    </p>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          <MapBoundsController locations={locations} />
        </MapContainer>
      </div>

      {/* Legend */}
      {colorMode === "activity" ? (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Color = {selectedHour >= 0 ? `zone-level occupancy at ${formatHour(selectedHour)}` : "lifetime transaction volume"} (low → high)
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Low</span>
            <div className="flex h-3 rounded overflow-hidden flex-1 max-w-[200px]">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ backgroundColor: occupancyColor(i / 19) }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">High</span>
            {selectedHour < 0 && (
              <span className="text-xs text-gray-400 ml-2">
                (95th pct = {maxT.toLocaleString()} txn)
              </span>
            )}
          </div>
          {selectedHour >= 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Gray = meters not active at {formatHour(selectedHour)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          {Object.entries(ZONE_COLORS)
            .filter(([z]) => z !== "All" && z !== "Unknown")
            .map(([zone, color]) => (
              <div key={zone} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-600 dark:text-gray-400">{zone}</span>
              </div>
            ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
        <div className="w-4 h-3 rounded border-2 border-dashed border-orange-500 flex-shrink-0" />
        <span>Petco Park Special Event Zone ($10/hr on game days)</span>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Activity colors are based on lifetime transaction totals (2023–2026). Overpriced meters tend to show low activity; underpriced tend to show very high activity.
      </p>
    </ChartContainer>
  );
}
