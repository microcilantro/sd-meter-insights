import type { PolicyDate } from "../../types/data.ts";

interface Props {
  policyDates: PolicyDate[];
}

export function PolicyTimeline({ policyDates }: Props) {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
        2025 Reform Timeline
      </h3>
      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-600" />

        <div className="flex justify-between relative">
          {policyDates.map((pd, i) => {
            const date = new Date(pd.date + "T12:00:00");
            const monthNames = [
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            ];
            const dateLabel = `${monthNames[date.getMonth()]} ${date.getDate()}`;

            return (
              <button
                key={pd.date}
                onClick={() => scrollTo("revenue-section")}
                className="flex flex-col items-center text-center group cursor-pointer w-1/4"
              >
                <div className="w-8 h-8 rounded-full bg-[#003366] text-white text-xs font-bold flex items-center justify-center z-10 group-hover:bg-[#C69214] transition-colors">
                  {i + 1}
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2">
                  {dateLabel}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[140px]">
                  {pd.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
