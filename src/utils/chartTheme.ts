export function getChartTheme(dark: boolean) {
  return {
    grid: dark ? "#374151" : "#f0f0f0",
    tick: dark ? "#9ca3af" : "#666666",
    tooltipBg: dark ? "#1f2937" : "#ffffff",
    tooltipBorder: dark ? "#374151" : "#cccccc",
    tooltipText: dark ? "#f3f4f6" : "#333333",
    line: dark ? "#60a5fa" : "#003366",
    lineSecondary: dark ? "#fbbf24" : "#C69214",
    barPrimary: dark ? "#60a5fa" : "#003366",
    barSecondary: dark ? "#9ca3af" : "#a0aec0",
    citationBar: dark ? "#fbbf24" : "#C69214",
  };
}
