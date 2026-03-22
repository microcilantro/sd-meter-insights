# Contributing to SD Meter Insights

Thank you for your interest in contributing! This is a civic data project and all contributions are welcome — from data corrections to new visualizations.

---

## Ways to Contribute

### Report a Data Issue
If you spot incorrect data, a missing policy date, or a chart that looks wrong, please [open an issue](../../issues/new) and describe what you see vs. what you'd expect.

### Suggest a Feature
Have an idea for a new chart, metric, or analysis? Open an issue with the `enhancement` label and describe what you'd like to see.

### Submit a Code Change

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** — see the dev setup in [README.md](README.md)
4. **Test locally:**
   ```bash
   npm run dev   # verify it looks right
   npm run build # verify no build errors
   ```
5. **Open a Pull Request** against `main` with a clear description of what changed and why

---

## Project Structure

```
public/data/        # Pre-processed JSON files (committed, auto-refreshed monthly)
scripts/            # Data pipeline (TypeScript, runs with npx tsx)
src/
  components/       # React components organized by section
    kpi/            # Summary KPI cards
    revenue/        # Revenue charts
    occupancy/      # Transaction/demand charts
    citations/      # Citation enforcement charts
    special-events/ # Padres game-day analysis
    map/            # Interactive meter map
    timeline/       # Policy timeline
    layout/         # Header, footer, filter controls
    shared/         # Reusable chart utilities
  hooks/            # Data fetching and derived state
  utils/            # Constants, formatters, calculations
  types/            # TypeScript interfaces
```

---

## Data Pipeline

If you want to work on the data pipeline or add a new data source:

```bash
# Full pipeline run (uses cached CSVs if present)
npx tsx scripts/process-data.ts

# Skip large raw transaction files (~370MB/year)
npx tsx scripts/process-data.ts --skip-raw
```

CSVs are cached in `scripts/cache/` (gitignored). The pipeline outputs JSON to `public/data/`.

---

## Style Notes

- TypeScript — no `any` types
- Tailwind CSS v4 for all styling
- Dark mode support required for any new components (use `dark:` variants)
- Charts must include policy date `ReferenceLine` annotations
- Keep components focused — one chart per file

---

## Questions?

Open an issue or start a [Discussion](../../discussions). We're happy to help orient you to the codebase.
