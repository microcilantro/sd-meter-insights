import { useState } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * Collapsible "How this is calculated" panel shown at the bottom of each chart.
 * Usage: wrap explanation text/paragraphs as children.
 */
export function CalcInfo({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <span className="text-[10px]">{open ? "▾" : "▸"}</span>
        How this is calculated
      </button>
      {open && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}
