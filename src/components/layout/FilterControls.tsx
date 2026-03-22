import { ZONES } from "../../utils/constants.ts";

interface FilterControlsProps {
  zone: string;
  onZoneChange: (zone: string) => void;
}

export function FilterControls({ zone, onZoneChange }: FilterControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Zone:</label>
        <select
          value={zone}
          onChange={(e) => onZoneChange(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
