# Claude Code Prompt: San Diego Parking Meter Reform Impact Dashboard

## Project Overview

Build a web dashboard that analyzes the impact of the City of San Diego's 2025 parking meter reforms on Downtown San Diego. The dashboard should be a static site (React + Vite or Next.js static export) deployed to **Cloudflare Pages** and backed by pre-processed data files. It should be designed so that data can be refreshed monthly with minimal effort using a local Node or Python script.

---

## Policy Context (Embed in the App's "About" Section)

In 2025, the City of San Diego enacted a comprehensive package of parking meter reforms. The key changes, all effective in 2025, were:

1. **Rate Doubling (Jan 31, 2025):** Hourly meter rates doubled from $1.25 to $2.50/hr for most of the city's 5,332 metered spaces. Over 4,400 meters charge the $2.50 max. Remaining meters (previously $0.50–$1.00) also doubled. Waterfront meters operated by the Port of San Diego (already at $2.50) were unaffected.
2. **Extended Hours & Sunday Enforcement (Aug–Sep 2025):** Meter hours extended by at least 2 hours (e.g., 6 PM → 8 PM) and expanded to Sundays in commercial areas across four Community Parking Districts: Pacific Beach, Mid-City, Uptown, and Downtown. Three districts extended to 10 PM; Mid-City to 8 PM.
3. **Special Event Zone Near Petco Park (Sep 1, 2025):** Meters within ~½ mile of Petco Park surge to $10/hr starting 2 hours before any event expected to draw 10,000+ people, lasting through 4 hours after event start (6-hour window). Disabled placards remain exempt.
4. **Credit Card Transaction Fee (Nov 1, 2025):** A $0.35 fee applies to all credit card payments (meter, Park Smarter app, Text to Pay). Collected by meter vendor, not the City.
5. **Revenue Split Change:** Community Parking District share shifted from 45% to 15% of net meter revenue (City: 55% → 85%). City stated dollar amounts to districts would remain roughly the same due to doubled rates.

The analysis period should compare **pre-reform** (calendar year 2024 and ideally 2023) to **post-reform** (2025 onward). No significant meter changes occurred in 2024 — it was the analytical/policy development phase.

---

## Data Sources

All data is open and free from the City of San Diego Open Data Portal. Files are hosted on `seshat.datasd.org`.

### 1. Parking Meter Transactions

**Portal page:** https://data.sandiego.gov/datasets/parking-meters-transactions/

Available in three granularities per year (2018–2026):
- **Raw:** `https://seshat.datasd.org/parking_meters/meters_transactions_{YYYY}_datasd.csv`
- **Aggregated by day:** `https://seshat.datasd.org/parking_meters/meters_transactions_day_{YYYY}_datasd.csv`
- **Aggregated by month:** `https://seshat.datasd.org/parking_meters/meters_transactions_month_{YYYY}_datasd.csv`

**Data dictionary:** `https://seshat.datasd.org/parking_meters/meters_transactions_dictionary_datasd.csv`

**Important:** The raw files are very large (millions of rows per year). For the dashboard, **use the aggregated-by-month files as the primary data source** for most charts. Use the aggregated-by-day files for more granular occupancy analysis. Only pull raw data if needed for a specific deep-dive feature.

**Expected fields in raw transactions:** `pole`, `date_trans_start`, `date_trans_end`, `trans_start` (datetime), `trans_end` (datetime), `pay_method`, `amount`

**Expected fields in aggregated-by-month:** `pole`, `year`, `month`, `total_trans`, `total_amount` (verify actual column names by downloading the dictionary CSV and a small sample)

**Expected fields in aggregated-by-day:** `pole`, `date`, `total_trans`, `total_amount` (verify actual column names)

### 2. Parking Meter Locations

**Portal page:** https://data.sandiego.gov/datasets/parking-meters-locations/

- **Active meters:** `https://seshat.datasd.org/parking_meters/meters_locations_datasd.csv`
- **Historic meters:** `https://seshat.datasd.org/parking_meters/meters_locations_historic_datasd.csv`
- **Data dictionary:** `https://seshat.datasd.org/parking_meters/meters_locations_dictionary_datasd.csv`

**Fields:** `zone`, `area`, `sub_area`, `pole`, `config_code`, `config_name`, `longitude`, `latitude`

- `pole` is the unique meter/pole ID and the join key to transactions
- `zone` is the parking district (e.g., "Downtown", "Pacific Beach", "Mid-City", "Uptown")
- `area` is the neighborhood within the zone
- `sub_area` is the block-level address
- `config_name` contains the meter configuration string (rate, hours, restrictions in a freeform text field)
- `longitude` / `latitude` are the meter coordinates (noted as potentially inaccurate)

### 3. Parking Citations

**Portal page:** https://data.sandiego.gov/datasets/parking-citations/

Files are split by half-year:
- `https://seshat.datasd.org/parking_citations/parking_citations_{YYYY}_part1_datasd.csv` (Jan–Jun)
- `https://seshat.datasd.org/parking_citations/parking_citations_{YYYY}_part2_datasd.csv` (Jul–Dec)

**Data dictionary:** `https://seshat.datasd.org/parking_citations/parking_citations_dictionary_datasd.csv`

**Expected fields:** `citation_id`, `date_issued`, `violation_code`, `violation_desc`, `fine_amount`, `location`, `meter_id` (verify field names from dictionary)

---

## Architecture & Tech Stack

### Frontend
- **React + TypeScript + Vite** (or Next.js with static export)
- **Tailwind CSS** for styling
- **Recharts** or **Chart.js** for charts
- **Mapbox GL JS** or **Leaflet** for the meter location map (Mapbox preferred for performance; use a free tier token)
- **Papa Parse** for CSV parsing in the browser

### Data Pipeline (Offline Pre-Processing)
- A **Node.js or Python script** (`scripts/refresh-data.sh` or `scripts/process-data.ts`) that:
  1. Downloads the relevant CSV files from `seshat.datasd.org`
  2. Joins transaction data with location data on `pole`
  3. Filters to the **Downtown zone** primarily (with option to compare other zones)
  4. Aggregates and computes derived metrics (see below)
  5. Outputs compact JSON files into `public/data/` that the frontend reads at runtime
- This script is designed to be re-run monthly to refresh data

### Deployment
- **Cloudflare Pages** connected to a GitHub repo
- Static site — no backend/server required
- Data JSON files are committed to the repo (they should be small once aggregated)

### Project Structure
```
sd-parking-dashboard/
├── public/
│   └── data/                    # Pre-processed JSON files
│       ├── monthly-revenue.json
│       ├── daily-occupancy.json
│       ├── citations-monthly.json
│       ├── meter-locations.json
│       └── metadata.json        # Last refresh date, data range
├── scripts/
│   ├── refresh-data.sh          # Downloads CSVs from seshat.datasd.org
│   └── process-data.ts          # Parses CSVs → computes metrics → writes JSON
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── OccupancyChart.tsx
│   │   ├── CitationsChart.tsx
│   │   ├── MeterMap.tsx
│   │   ├── PolicyTimeline.tsx
│   │   ├── KPICards.tsx
│   │   └── FilterControls.tsx
│   ├── hooks/
│   │   └── useData.ts
│   ├── utils/
│   │   ├── calculations.ts
│   │   └── constants.ts         # Policy dates, zone definitions
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Dashboard Features & Layout

### Header
- Title: **"San Diego Parking Meter Reform Impact Dashboard"**
- Subtitle with last data refresh date
- Filter controls: Zone selector (Downtown default, with Pacific Beach / Mid-City / Uptown / All), date range picker

### 1. KPI Summary Cards (Top Row)
Display before/after comparisons (2024 vs. 2025 YTD, or equivalent available months):
- **Monthly Meter Revenue** — average monthly revenue, with % change
- **Monthly Transactions** — average monthly transaction count, with % change
- **Average Revenue per Transaction** — (total revenue ÷ total transactions)
- **Monthly Citation Count** — average monthly citation count (meter-related), with % change
- **Estimated Monthly Citation Revenue** — based on fine amounts

### 2. Revenue Analysis (Primary Section)
- **Time series line chart:** Monthly total meter revenue, 2023–present, with vertical annotation lines at each policy effective date (Jan 31, Aug 21, Sep 1, Nov 1 2025)
- **Year-over-year comparison bar chart:** Same month 2024 vs 2025 (e.g., Feb 2024 vs Feb 2025)
- **Revenue by payment method** (if available in aggregated data): breakdown of coin vs. card vs. app
- **Revenue split visualization:** Show how the 85/15 City/District split compares to the old 55/45

### 3. Occupancy / Demand Analysis
Occupancy here is a proxy calculated from transaction data — specifically "paid occupancy" (time meters are being paid for as a % of available metered hours).

- **Monthly transaction volume trend:** Line chart showing total transactions per month, 2023–present, with policy date annotations
- **Day-of-week heatmap:** Average transactions by day of week, comparing pre-reform (2024) vs. post-reform (2025)
- **Hour-of-day analysis** (if raw data is used for a subset): Show transaction patterns before/after the hours extension — specifically, are there meaningful transactions between 6–8 PM and 8–10 PM that didn't exist before?
- **Sunday impact:** If distinguishable in data, compare Sunday transaction volumes pre- and post-reform

### 4. Citation Analysis
- **Monthly citation volume trend:** Line chart, 2023–present
- **Citation revenue trend:** Monthly estimated fine revenue
- **Top violation types:** Bar chart of most common violation codes in Downtown, pre vs. post reform
- **Citations by time of day** (if time data available): Are more citations being issued in the new extended hours?

### 5. Meter Map (Interactive)
- Map of Downtown San Diego showing meter locations as dots
- Color-code by some metric: revenue per meter, transaction count, or highlight the Petco Park Special Event Zone boundary
- Tooltip on hover: pole ID, sub_area, zone, and key stats
- Draw approximate Special Event Zone boundary (Harbor Drive, State Street, Broadway, I-5)

### 6. Policy Timeline
- Horizontal timeline showing each reform milestone with dates
- Clicking a milestone scrolls to/highlights the relevant data in charts above

---

## Key Calculations

### Revenue Metrics
```
monthly_revenue = SUM(amount) grouped by year, month, zone
revenue_change_pct = (post_avg_monthly - pre_avg_monthly) / pre_avg_monthly × 100
avg_revenue_per_transaction = total_revenue / total_transactions
```

### Occupancy Proxy (from raw transactions, pre-compute in pipeline)
```
paid_minutes = SUM(date_trans_end - date_trans_start) for all transactions in period
available_minutes = meter_count × enforced_hours_per_day × days_in_period
paid_occupancy_rate = paid_minutes / available_minutes × 100
```
Note: Enforced hours changed mid-2025, so the denominator must account for the shift.

### Citation Revenue
```
estimated_citation_revenue = SUM(fine_amount) grouped by year, month
```

### Year-over-Year Comparison
For each month, compare same-month in 2024 vs 2025. Normalize for number of business days if needed.

---

## Data Processing Script Details

The `scripts/process-data.ts` script should:

1. **Download** the following files (check for 403 errors and retry):
   - `meters_transactions_month_{2023,2024,2025,2026}_datasd.csv`
   - `meters_transactions_day_{2024,2025,2026}_datasd.csv`
   - `meters_locations_datasd.csv`
   - `parking_citations_{2023,2024,2025,2026}_part{1,2}_datasd.csv`
   - All data dictionaries

2. **First run:** Download dictionaries and sample rows, output the actual column names to console. Hard-code verified column names into the processing logic. *The column names in this prompt are best guesses — verify before building the processing pipeline.*

3. **Join** transactions with locations on `pole` to get zone/area/coordinates for each transaction.

4. **Filter** primarily to `zone == "Downtown"` (or the equivalent value — check the data).

5. **Compute** all the aggregated metrics described above.

6. **Output** JSON files:
   - `monthly-revenue.json` — `[{ year, month, zone, revenue, transactions, avg_per_trans }]`
   - `daily-summary.json` — `[{ date, zone, revenue, transactions, day_of_week }]`
   - `citations-monthly.json` — `[{ year, month, zone, citation_count, fine_total, top_violations: [...] }]`
   - `meter-locations.json` — `[{ pole, zone, area, sub_area, lat, lng, config_name }]`
   - `metadata.json` — `{ last_refresh, data_range: { start, end }, meter_count }`

7. **Size budget:** Keep total JSON under 5 MB for fast page loads. Downsample or omit older years if needed.

---

## Monthly Refresh Workflow

Document in the README:

```bash
# 1. Run the data refresh script
cd scripts/
npm run refresh      # or: npx ts-node process-data.ts

# 2. Commit updated data files
git add public/data/
git commit -m "Data refresh: $(date +%Y-%m)"
git push origin main

# 3. Cloudflare Pages auto-deploys from main branch
```

---

## Design Guidelines

- Clean, professional, data-journalism aesthetic (think ProPublica or The Pudding)
- Dark mode support (optional but nice)
- Mobile responsive — stack charts vertically on small screens
- Use the City of San Diego's blue/gold color palette as accents
- All charts should have clear titles, axis labels, and a source note ("Source: City of San Diego Open Data Portal")
- Policy effective dates should be visually prominent on all time-series charts (vertical dashed lines with labels)

---

## Implementation Priority

Build in this order:

1. **Data pipeline script** — download, verify schemas, process, output JSON
2. **Project scaffold** — Vite + React + Tailwind + routing
3. **KPI cards + Revenue chart** — the most impactful view
4. **Occupancy / transaction volume charts**
5. **Citation analysis section**
6. **Meter map**
7. **Policy timeline component**
8. **Cloudflare Pages deployment config**
9. **README with refresh instructions**

---

## Notes

- The `config_name` field in meter locations is a freeform string like `"MSPM 2 Hour Max $1.25 HR 8am-6pm Mon-Sat"`. Parsing this reliably is difficult. For v1, use it only for display in tooltips — don't try to derive enforced-hour calculations from it.
- Port of San Diego waterfront meters operate under a separate rate structure and should be excluded from the analysis (or clearly flagged). These are not in the City's dataset.
- If any seshat.datasd.org URLs return 403, try downloading from the portal page directly or check if the file naming convention changed. The City periodically restructures URLs.
- For the Petco Park Special Event Zone, the approximate boundary is: Harbor Drive (south), State Street (west), Broadway (north), Interstate 5 (east). Draw this as a polygon overlay on the map.
