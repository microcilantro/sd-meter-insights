interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function ChartContainer({ title, subtitle, children }: ChartContainerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
