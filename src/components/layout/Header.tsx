interface HeaderProps {
  lastRefresh: string;
  darkMode: boolean;
  onToggleDark: () => void;
  onShowTimeline: () => void;
}

export function Header({ lastRefresh, darkMode, onToggleDark, onShowTimeline }: HeaderProps) {
  return (
    <header className="bg-[#003366] text-white py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold leading-tight">
            San Diego Parking Meter Reform Impact Dashboard
          </h1>
          {lastRefresh && (
            <p className="text-blue-200 mt-0.5 text-xs">
              Data through {lastRefresh}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onShowTimeline}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            Timeline
          </button>
          <button
            onClick={onToggleDark}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
        </div>
      </div>
    </header>
  );
}
