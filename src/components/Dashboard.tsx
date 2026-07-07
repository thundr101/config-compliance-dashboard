/**
 * Renders the compliance rollup as an HTML string (server-side string
 * template, not a client React tree) so `npm run build` can emit a fully
 * static index.html with no bundler/runtime dependency for viewers.
 *
 * Chart.js is loaded from CDN in the emitted HTML; this file only builds
 * the data arrays it needs.
 */
import type { RollupSnapshot } from "../lib/aggregate.js";

export function renderDashboardHtml(
  latest: RollupSnapshot,
  history: RollupSnapshot[]
): string {
  const labels = history.map((h) => h.generatedAt.slice(0, 10));
  const complianceRates = history.map((h) => h.totals.complianceRatePct);

  const accountRows = latest.accounts
    .map(
      (a) => `
      <tr>
        <td>${a.accountName}</td>
        <td>${a.accountId}</td>
        <td>${a.compliantCount}</td>
        <td class="non-compliant">${a.nonCompliantCount}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Config Rule Compliance Dashboard</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
  <style>
    body { font-family: -apple-system, sans-serif; margin: 2rem; background: #fafafa; }
    h1 { color: rgb(35,47,62); }
    .summary { display: flex; gap: 2rem; margin-bottom: 2rem; }
    .card { background: white; border-radius: 8px; padding: 1rem 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card .value { font-size: 2rem; font-weight: bold; color: rgb(255,153,0); }
    table { border-collapse: collapse; width: 100%; background: white; }
    th, td { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
    th { background: rgb(35,47,62); color: white; }
    .non-compliant { color: #c0392b; font-weight: bold; }
    canvas { max-width: 800px; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>Config Rule Compliance Dashboard</h1>
  <p>Last updated: ${latest.generatedAt}</p>

  <div class="summary">
    <div class="card"><div>Compliance Rate</div><div class="value">${latest.totals.complianceRatePct}%</div></div>
    <div class="card"><div>Non-Compliant Resources</div><div class="value">${latest.totals.nonCompliant}</div></div>
    <div class="card"><div>Accounts Tracked</div><div class="value">${latest.accounts.length}</div></div>
  </div>

  <canvas id="trendChart" height="80"></canvas>

  <table>
    <tr><th>Account</th><th>Account ID</th><th>Compliant</th><th>Non-Compliant</th></tr>
    ${accountRows}
  </table>

  <script>
    new Chart(document.getElementById('trendChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: 'Compliance Rate %',
          data: ${JSON.stringify(complianceRates)},
          borderColor: 'rgb(255,153,0)',
          tension: 0.2
        }]
      }
    });
  </script>
</body>
</html>`;
}
