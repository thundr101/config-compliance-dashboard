# Config Rule Compliance Rollup Dashboard

Aggregates AWS Config compliance data across multiple accounts into a single
dashboard, showing non-compliant resource trends over time per rule/account.

## Why

`GetComplianceSummaryByConfigRule` is a per-account, per-call API. For an
AWS Organizations estate with dozens of accounts, there's no native
"single pane of glass" view. This tool pulls the summary from each account
(via a cross-account role) and rolls it into one static HTML dashboard.

## Features

- Pulls compliance summaries per account via AWS Config API
  (`getComplianceSummaryByConfigRule`, AWS SDK v3)
- Rolls up into a single JSON snapshot, checked into `data/` for trend history
- Renders a static HTML dashboard (Chart.js) — no backend required, can be
  hosted on GitHub Pages or S3 static hosting
- CLI (`npm run collect`) to refresh the snapshot on a schedule

## Quickstart

```bash
npm install
npm run collect      # pulls fresh compliance data, writes data/snapshot.json
npm run build        # generates dist/index.html dashboard
```

## Architecture

```
src/
├── lib/
│   ├── configClient.ts   # AWS Config SDK v3 wrapper, cross-account assume-role
│   └── aggregate.ts       # merges per-account summaries into rollup shape
├── components/
│   └── Dashboard.tsx      # Chart.js dashboard render (compiled to static HTML)
└── index.ts               # CLI entrypoint (collect / build)
```

## Roadmap

- [ ] GitHub Pages deploy workflow (publish `dist/` on push to `main`)
- [ ] Per-OU rollup, not just per-account
- [ ] Alert threshold config (fail CI if non-compliant resource count spikes)

## License

MIT — see [LICENSE](LICENSE).
