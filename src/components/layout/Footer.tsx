export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-6 px-4 mt-8">
      <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Source:{" "}
          <a
            href="https://data.sandiego.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            City of San Diego Open Data Portal
          </a>
        </p>
        <p className="mt-1">
          Datasets: Parking Meter Transactions, Parking Meter Locations,
          Parking Citations
        </p>
      </div>
    </footer>
  );
}
