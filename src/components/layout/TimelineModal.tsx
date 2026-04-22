import type { PolicyDate } from "../../types/data.ts";

interface Props {
  policyDates: PolicyDate[];
  onClose: () => void;
}

const DETAILS: Record<string, string> = {
  "Rate Doubling": "Hourly parking rates doubled city-wide effective January 31, 2025. For example, Downtown meters went from $1.25/hr to $2.50/hr.",
  "Extended Hours": "Enforcement hours extended to 10pm (previously 8pm) and Sunday enforcement added in most zones, effective August 21, 2025.",
  "Petco Zone": "Special Event Zone around Petco Park activated September 1, 2025, charging $10/hr on Padres home game days.",
  "CC Fee": "A credit card processing surcharge added to meter transactions effective November 1, 2025.",
};

export function TimelineModal({ policyDates, onClose }: Props) {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            2025 Parking Reform Timeline
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Timeline */}
        <div className="relative mb-6">
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 dark:bg-gray-600" />
          <div className="flex justify-between">
            {policyDates.map((pd, i) => {
              const date = new Date(pd.date + "T12:00:00");
              return (
                <div key={pd.date} className="flex flex-col items-center w-1/4 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#003366] dark:bg-[#C69214] text-white text-sm font-bold flex items-center justify-center z-10">
                    {i + 1}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2">
                    {monthNames[date.getMonth()]} {date.getDate()}, {date.getFullYear()}
                  </p>
                  <p className="text-xs font-bold text-[#003366] dark:text-[#C69214] mt-0.5">
                    {pd.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail cards */}
        <div className="space-y-3">
          {policyDates.map((pd, i) => (
            <div
              key={pd.date}
              className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="w-6 h-6 rounded-full bg-[#003366] dark:bg-[#C69214] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {pd.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {pd.description || DETAILS[pd.label] || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
