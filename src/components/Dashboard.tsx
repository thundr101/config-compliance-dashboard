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
  // Convert snapshots to serialized strings to pass data directly to client-side JS
  const serializedLatest = JSON.stringify(latest);
  const serializedHistory = JSON.stringify(history);

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Config Rule Compliance Dashboard</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- Chart.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
  
  <style>
    /* Premium Modern CSS Design System */
    :root[data-theme="light"] {
      --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
      --card-bg: rgba(255, 255, 255, 0.85);
      --card-border: rgba(255, 255, 255, 0.5);
      --text-main: #1e293b;
      --text-muted: #64748b;
      --primary: #f97316;
      --primary-hover: #ea580c;
      --primary-rgb: 249, 115, 22;
      --shadow-color: rgba(0, 0, 0, 0.05);
      --glass-glow: rgba(255, 255, 255, 0.4);
      --table-row-hover: rgba(241, 245, 249, 0.8);
      --table-hdr-bg: #1e293b;
      --table-hdr-text: #ffffff;
      --border-color: #e2e8f0;
      
      --healthy: #10b981;
      --warning: #f59e0b;
      --critical: #ef4444;
    }

    :root[data-theme="dark"] {
      --bg-gradient: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.05);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #f97316;
      --primary-hover: #fb923c;
      --primary-rgb: 249, 115, 22;
      --shadow-color: rgba(0, 0, 0, 0.3);
      --glass-glow: rgba(249, 115, 22, 0.03);
      --table-row-hover: rgba(51, 65, 85, 0.5);
      --table-hdr-bg: #0f172a;
      --table-hdr-text: #f8fafc;
      --border-color: #334155;
      
      --healthy: #34d399;
      --warning: #fbbf24;
      --critical: #f87171;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Outfit', sans-serif;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    body {
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Header Styling */
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .title-area h1 {
      font-size: 2.25rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.25rem;
    }

    .title-area p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    /* Dark Mode Toggle Switch */
    .theme-toggle-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 50%;
      width: 44px;
      height: 44px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 6px -1px var(--shadow-color);
      transition: transform 0.2s ease, background-color 0.3s ease;
    }

    .theme-toggle-btn:hover {
      transform: scale(1.05);
      border-color: var(--primary);
    }

    /* Glassmorphism Cards */
    .glass-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px var(--shadow-color), 0 4px 6px -4px var(--shadow-color);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--glass-glow);
      pointer-events: none;
      z-index: 0;
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .scorecard {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 1;
    }

    .scorecard .label {
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .scorecard .value-container {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .scorecard .value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .scorecard .trend {
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* Charts Section */
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 300px;
    }

    /* Table, Filters, and Interactive Elements */
    .table-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .search-input-wrapper {
      position: relative;
      flex: 1;
      max-width: 350px;
      min-width: 200px;
    }

    .search-input {
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.625rem 1rem 0.625rem 2.25rem;
      color: var(--text-main);
      font-size: 0.875rem;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      background: var(--card-bg);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .btn:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
      transform: translateY(-1px);
    }

    .btn-primary {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }

    /* Responsive Table */
    .table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.925rem;
    }

    th {
      background: var(--table-hdr-bg);
      color: var(--table-hdr-text);
      font-weight: 600;
      padding: 1rem 1.25rem;
      user-select: none;
      cursor: pointer;
    }

    th.sort-active {
      color: var(--primary);
    }

    th span.sort-direction {
      margin-left: 0.25rem;
      display: inline-block;
    }

    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr {
      transition: background-color 0.15s ease;
    }

    tbody tr:hover {
      background: var(--table-row-hover);
    }

    .account-name-cell {
      font-weight: 600;
    }

    .account-id-cell {
      color: var(--text-muted);
      font-family: monospace;
      font-size: 0.85rem;
    }

    /* Badges & Scores */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-badge.healthy {
      background: rgba(16, 185, 129, 0.15);
      color: var(--healthy);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .status-badge.warning {
      background: rgba(245, 158, 11, 0.15);
      color: var(--warning);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .status-badge.critical {
      background: rgba(239, 68, 68, 0.15);
      color: var(--critical);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .rate-bar-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 120px;
    }

    .rate-bar {
      flex: 1;
      height: 6px;
      background: var(--border-color);
      border-radius: 9999px;
      overflow: hidden;
    }

    .rate-bar-fill {
      height: 100%;
      border-radius: 9999px;
    }

    /* Footer */
    footer {
      margin-top: auto;
      padding: 3rem 0 1.5rem 0;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
      width: 100%;
      max-width: 1200px;
      border-top: 1px solid var(--border-color);
    }
  </style>
</head>
<body>

<div class="container">
  
  <header>
    <div class="title-area">
      <h1>Config Compliance Rollup</h1>
      <p id="updated-time">Last updated: ${latest.generatedAt}</p>
    </div>
    <div class="controls">
      <button class="theme-toggle-btn" id="theme-toggle" title="Toggle Theme" aria-label="Toggle Light/Dark Theme">
        🌙
      </button>
    </div>
  </header>

  <!-- Summary Cards Grid -->
  <section class="summary-grid">
    <div class="glass-card scorecard">
      <span class="label">Compliance Rate</span>
      <div class="value-container">
        <span class="value" id="stat-compliance-rate">${latest.totals.complianceRatePct}%</span>
      </div>
      <div class="rate-bar" style="width: 100%">
        <div class="rate-bar-fill" id="stat-rate-fill" style="width: ${latest.totals.complianceRatePct}%; background-color: var(--primary);"></div>
      </div>
    </div>

    <div class="glass-card scorecard">
      <span class="label">Non-Compliant Resources</span>
      <div class="value-container">
        <span class="value" style="color: var(--critical);" id="stat-non-compliant">${latest.totals.nonCompliant}</span>
      </div>
      <p style="font-size: 0.825rem; color: var(--text-muted);">Across all accounts</p>
    </div>

    <div class="glass-card scorecard">
      <span class="label">Compliant Resources</span>
      <div class="value-container">
        <span class="value" style="color: var(--healthy);" id="stat-compliant">${latest.totals.compliant}</span>
      </div>
      <p style="font-size: 0.825rem; color: var(--text-muted);">Meeting rule requirements</p>
    </div>

    <div class="glass-card scorecard">
      <span class="label">Accounts Tracked</span>
      <div class="value-container">
        <span class="value" id="stat-accounts-count">${latest.accounts.length}</span>
      </div>
      <p style="font-size: 0.825rem; color: var(--text-muted);">Active Cloud targets</p>
    </div>
  </section>

  <!-- Charts Layout -->
  <section class="charts-grid">
    <div class="glass-card">
      <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Compliance Trend (90 Days)</h2>
      <div class="chart-container">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <div class="glass-card">
      <h2 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Resource Breakdown</h2>
      <div class="chart-container">
        <canvas id="doughnutChart"></canvas>
      </div>
    </div>
  </section>

  <!-- AWS Accounts Table Section -->
  <section class="glass-card">
    <div class="table-section-header">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="table-search" class="search-input" placeholder="Search accounts by name or ID...">
      </div>
      <div class="action-buttons">
        <button class="btn" id="btn-export-csv" title="Export Current View to CSV">
          📥 CSV
        </button>
        <button class="btn" id="btn-export-json" title="Export Snapshot to JSON">
          📦 JSON
        </button>
      </div>
    </div>

    <div class="table-container">
      <table id="accounts-table">
        <thead>
          <tr>
            <th data-sort="name">Account <span class="sort-direction"></span></th>
            <th data-sort="id">Account ID <span class="sort-direction"></span></th>
            <th data-sort="compliant" style="text-align: right;">Compliant <span class="sort-direction"></span></th>
            <th data-sort="noncompliant" style="text-align: right;">Non-Compliant <span class="sort-direction"></span></th>
            <th data-sort="rate" style="text-align: right;">Compliance Rate <span class="sort-direction"></span></th>
            <th data-sort="status" style="text-align: center;">Status <span class="sort-direction"></span></th>
          </tr>
        </thead>
        <tbody id="table-body">
          <!-- Rows injected by JavaScript -->
        </tbody>
      </table>
    </div>
  </section>

  <footer>
    <p>AWS Config Compliance Rollup Dashboard • Generated via AWS SDK v3 & Chart.js</p>
  </footer>

</div>

<script>
  // Injected raw data from static compilation
  const latestSnapshot = ${serializedLatest};
  const historicalSnapshots = ${serializedHistory};

  // State Management
  let filteredAccounts = [...latestSnapshot.accounts];
  let currentSortField = 'noncompliant';
  let currentSortAsc = false; // default desc for non-compliant count

  // Initialize Theme
  const themeToggle = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeToggleIcon(storedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
    updateChartsThemes(newTheme);
  });

  function updateThemeToggleIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Formatting Utilities
  function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }

  function getStatusInfo(rate) {
    if (rate >= 90) return { class: 'healthy', text: 'Healthy' };
    if (rate >= 70) return { class: 'warning', text: 'Warning' };
    return { class: 'critical', text: 'Critical' };
  }

  // Render Table
  const tableBody = document.getElementById('table-body');
  const searchInput = document.getElementById('table-search');

  function renderTable() {
    tableBody.innerHTML = '';
    
    if (filteredAccounts.length === 0) {
      tableBody.innerHTML = \`
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No accounts found matching your search.
          </td>
        </tr>\`;
      return;
    }

    filteredAccounts.forEach(acc => {
      const total = acc.compliantCount + acc.nonCompliantCount;
      const rate = total === 0 ? 100 : Math.round((acc.compliantCount / total) * 1000) / 10;
      const status = getStatusInfo(rate);

      let rateColor = 'var(--healthy)';
      if (rate < 90) rateColor = 'var(--warning)';
      if (rate < 70) rateColor = 'var(--critical)';

      const row = document.createElement('tr');
      row.innerHTML = \`
        <td class="account-name-cell">\${escapeHtml(acc.accountName)}</td>
        <td class="account-id-cell">\${escapeHtml(acc.accountId)}</td>
        <td style="text-align: right;">\${formatNumber(acc.compliantCount)}</td>
        <td style="text-align: right; font-weight: 600; color: \${acc.nonCompliantCount > 0 ? 'var(--critical)' : 'inherit'}">\${formatNumber(acc.nonCompliantCount)}</td>
        <td style="text-align: right;">
          <div class="rate-bar-container" style="justify-content: flex-end;">
            <span>\${rate}%</span>
            <div class="rate-bar" style="max-width: 60px; display: inline-block;">
              <div class="rate-bar-fill" style="width: \${rate}%; background-color: \${rateColor};"></div>
            </div>
          </div>
        </td>
        <td style="text-align: center;">
          <span class="status-badge \${status.class}">\${status.text}</span>
        </td>
      \`;
      tableBody.appendChild(row);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // Search filter
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filteredAccounts = latestSnapshot.accounts.filter(acc => 
      acc.accountName.toLowerCase().includes(query) || 
      acc.accountId.includes(query)
    );
    sortAccounts(); // Maintain sorting state
    renderTable();
  });

  // Table Sort logic
  const headers = document.querySelectorAll('#accounts-table th');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort');
      if (!field) return;

      if (currentSortField === field) {
        currentSortAsc = !currentSortAsc;
      } else {
        currentSortField = field;
        currentSortAsc = true; // default asc on new column
      }
      
      updateSortIndicators();
      sortAccounts();
      renderTable();
    });
  });

  function updateSortIndicators() {
    headers.forEach(header => {
      const field = header.getAttribute('data-sort');
      const span = header.querySelector('.sort-direction');
      if (!span) return;
      
      header.classList.remove('sort-active');
      span.textContent = '';
      
      if (field === currentSortField) {
        header.classList.add('sort-active');
        span.textContent = currentSortAsc ? '▲' : '▼';
      }
    });
  }

  function sortAccounts() {
    filteredAccounts.sort((a, b) => {
      let valA, valB;
      const totalA = a.compliantCount + a.nonCompliantCount;
      const rateA = totalA === 0 ? 100 : (a.compliantCount / totalA);
      
      const totalB = b.compliantCount + b.nonCompliantCount;
      const rateB = totalB === 0 ? 100 : (b.compliantCount / totalB);

      switch (currentSortField) {
        case 'name':
          valA = a.accountName.toLowerCase();
          valB = b.accountName.toLowerCase();
          break;
        case 'id':
          valA = a.accountId;
          valB = b.accountId;
          break;
        case 'compliant':
          valA = a.compliantCount;
          valB = b.compliantCount;
          break;
        case 'noncompliant':
          valA = a.nonCompliantCount;
          valB = b.nonCompliantCount;
          break;
        case 'rate':
          valA = rateA;
          valB = rateB;
          break;
        case 'status':
          valA = rateA;
          valB = rateB;
          break;
        default:
          return 0;
      }

      if (valA < valB) return currentSortAsc ? -1 : 1;
      if (valA > valB) return currentSortAsc ? 1 : -1;
      return 0;
    });
  }

  // Export Data Functions
  document.getElementById('btn-export-csv').addEventListener('click', () => {
    let csv = 'Account Name,Account ID,Compliant,Non-Compliant,Compliance Rate%\\n';
    filteredAccounts.forEach(acc => {
      const total = acc.compliantCount + acc.nonCompliantCount;
      const rate = total === 0 ? 100 : Math.round((acc.compliantCount / total) * 1000) / 10;
      csv += \`"\${acc.accountName.replace(/"/g, '""')}",\${acc.accountId},\${acc.compliantCount},\${acc.nonCompliantCount},\${rate}\\n\`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', \`compliance_rollup_\${new Date().toISOString().slice(0, 10)}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(latestSnapshot, null, 2));
    const link = document.createElement('a');
    link.setAttribute("href", dataStr);
    link.setAttribute("download", \`compliance_snapshot_\${new Date().toISOString().slice(0, 10)}.json\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Chart setup helper
  function getChartColors(theme) {
    const isDark = theme === 'dark';
    return {
      text: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.6)',
      tooltipBg: isDark ? '#1e293b' : '#ffffff',
      tooltipBorder: isDark ? '#334155' : '#e2e8f0',
      tooltipText: isDark ? '#f8fafc' : '#1e293b'
    };
  }

  let trendChart, doughnutChart;

  function initCharts() {
    const theme = document.documentElement.getAttribute('data-theme');
    const colors = getChartColors(theme);

    // Trend line chart setup
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    const labels = historicalSnapshots.map(h => h.generatedAt.slice(0, 10));
    const trendData = historicalSnapshots.map(h => h.totals.complianceRatePct);

    trendChart = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Compliance Rate %',
          data: trendData,
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgb(249, 115, 22)',
          pointBorderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return \`Compliance: \${context.parsed.y}%\`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: colors.grid },
            ticks: { color: colors.text }
          },
          y: {
            grid: { color: colors.grid },
            ticks: { color: colors.text },
            min: Math.max(0, Math.min(...trendData) - 10),
            max: 100
          }
        }
      }
    });

    // Doughnut chart setup
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(doughnutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Compliant', 'Non-Compliant'],
        datasets: [{
          data: [latestSnapshot.totals.compliant, latestSnapshot.totals.nonCompliant],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.text,
              font: { family: 'Outfit', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1
          }
        },
        cutout: '70%'
      }
    });
  }

  function updateChartsThemes(theme) {
    const colors = getChartColors(theme);
    
    if (trendChart) {
      trendChart.options.scales.x.grid.color = colors.grid;
      trendChart.options.scales.x.ticks.color = colors.text;
      trendChart.options.scales.y.grid.color = colors.grid;
      trendChart.options.scales.y.ticks.color = colors.text;
      trendChart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
      trendChart.options.plugins.tooltip.titleColor = colors.tooltipText;
      trendChart.options.plugins.tooltip.bodyColor = colors.tooltipText;
      trendChart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
      trendChart.update();
    }

    if (doughnutChart) {
      doughnutChart.options.plugins.legend.labels.color = colors.text;
      doughnutChart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
      doughnutChart.options.plugins.tooltip.titleColor = colors.tooltipText;
      doughnutChart.options.plugins.tooltip.bodyColor = colors.tooltipText;
      doughnutChart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
      doughnutChart.update();
    }
  }

  // Run Initialization
  updateSortIndicators();
  sortAccounts();
  renderTable();
  initCharts();
</script>

</body>
</html>`;
}
