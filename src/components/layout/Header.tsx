interface HeaderProps {
  lastRefresh: string;
  darkMode: boolean;
  onToggleDark: () => void;
}

export function Header({ lastRefresh, darkMode, onToggleDark }: HeaderProps) {
  return (
    <header className="bg-[#003366] text-white py-6 px-4">
      <div className="max-w-7xl mx-auto flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            San Diego Parking Meter Reform Impact Dashboard
          </h1>
          <p className="text-blue-200 mt-1 text-sm">
            Analyzing the impact of the 2025 parking meter reforms on San Diego
            {lastRefresh && (
              <span className="ml-2 text-blue-300">
                &middot; Data through {lastRefresh}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onToggleDark}
          className="ml-4 mt-1 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          aria-label="Toggle dark mode"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "\u2600\uFE0F" : "\uD83C\uDF19"}
        </button>
      </div>
    </header>
  );
}
