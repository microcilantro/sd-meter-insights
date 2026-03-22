import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon } from "react-leaflet";
import { ChartContainer } from "../shared/ChartContainer.tsx";
import { PETCO_ZONE_BOUNDARY, ZONE_COLORS } from "../../utils/constants.ts";
import type { MeterLocationRecord } from "../../types/data.ts";
import "leaflet/dist/leaflet.css";

interface Props {
  data: MeterLocationRecord[];
}

export function MeterMap({ data }: Props) {
  return (
    <ChartContainer
      title="Meter Location Map"
      subtitle="Parking meters colored by zone. Orange boundary shows Petco Park Special Event Zone."
    >
      <div className="h-[500px] rounded overflow-hidden">
        <MapContainer
          center={[32.7157, -117.1611]}
          zoom={14}
          className="h-full w-full"
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data.map((meter) => (
            <CircleMarker
              key={meter.p}
              center={[meter.la, meter.ln]}
              radius={3}
              fillColor={ZONE_COLORS[meter.z] || "#666"}
              fillOpacity={0.7}
              stroke={false}
            >
              <Tooltip>
                <div className="text-xs">
                  <p className="font-bold">{meter.p}</p>
                  <p>
                    {meter.z} &middot; {meter.a}
                  </p>
                  <p>{meter.s}</p>
                  <p>
                    {meter.pr} &middot; {meter.ts}-{meter.te} {meter.d}
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
          <Polygon
            positions={PETCO_ZONE_BOUNDARY}
            pathOptions={{
              color: "#FF6600",
              weight: 2,
              dashArray: "6 4",
              fillColor: "#FF6600",
              fillOpacity: 0.1,
            }}
          >
            <Tooltip sticky>Petco Park Special Event Zone ($10/hr)</Tooltip>
          </Polygon>
        </MapContainer>
      </div>
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {Object.entries(ZONE_COLORS)
          .filter(([z]) => z !== "All" && z !== "Unknown")
          .map(([zone, color]) => (
            <div key={zone} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-600">{zone}</span>
            </div>
          ))}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border-2 border-dashed border-orange-500" />
          <span className="text-gray-600">Petco Event Zone</span>
        </div>
      </div>
    </ChartContainer>
  );
}
