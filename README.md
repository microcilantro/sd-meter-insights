# San Diego Parking Meter Reform Impact Dashboard

A public dashboard visualizing the impact of San Diego's 2025 parking meter reforms on revenue, demand, and enforcement patterns. Built with open data from the [City of San Diego Data Portal](https://data.sandiego.gov/).

**Live site:** https://microcilantro.github.io/sd-meter-insights/

---

## What This Shows

The City of San Diego enacted sweeping parking meter reforms in 2025:

| Date | Policy Change |
|---|---|
| Jan 31, 2025 | Meter rates doubled citywide |
| Aug–Sep 2025 | Extended hours + Sunday enforcement |
| Sep 1, 2025 | Petco Park surge zone activated |
| Nov 1, 2025 | Credit card processing fee added |
| Ongoing | Revenue split changed from 55/45 to 85/15 (city/infrastructure) |

This dashboard shows before/after data across revenue, transaction volume, day-of-week patterns, citation enforcement, and Padres game-day impact.

---

## Data Sources

All data is sourced from [seshat.datasd.org](https://seshat.datasd.org) (City of San Diego open data):

- **Meter locations:** `parking_meters_current.csv`
- **Monthly transactions:** `treas_meters_{YYYY}_pole_by_month_datasd.csv`
- **Daily transactions:** `treas_meters_{YYYY}_pole_by_mo_day_datasd.csv`
- **Raw transactions:** `treas_parking_payments_{YYYY}_datasd.csv` (payment method analysis)
- **Citations:** `parking_citations_{YYYY}_part{1,2}_datasd.csv`
- **Padres schedule:** MLB Stats API

Data is refreshed automatically on the 5th of each month via GitHub Actions.

---

## Tech Stack

- **React + TypeScript + Vite** — frontend
- **Tailwind CSS v4** — styling with dark mode
- **Recharts** — charts with policy date annotations
- **Leaflet** — interactive meter map
- **GitHub Actions** — automated data refresh + deployment
- **GitHub Pages** — free static hosting

---

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

### Refreshing Data

```bash
# Run the full data pipeline (downloads CSVs, processes to JSON)
npx tsx scripts/process-data.ts

# Skip the large raw transaction files (~370MB/year) for faster runs
npx tsx scripts/process-data.ts --skip-raw
```

Processed JSON files are committed to `public/data/` and served as static assets.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to suggest changes, report data issues, or add features.

---

## License

Data is public domain via City of San Diego open data. Code is MIT licensed.
