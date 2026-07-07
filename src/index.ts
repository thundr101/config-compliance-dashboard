/**
 * CLI entrypoint: `npm run collect` and `npm run build`
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { getComplianceSummary, type AccountTarget } from "./lib/configClient.js";
import { buildRollup, appendToHistory, type RollupSnapshot } from "./lib/aggregate.js";
import { renderDashboardHtml } from "./components/Dashboard.js";

const ACCOUNTS_FILE = "accounts.json"; // copy accounts.example.json and fill in real role ARNs
const HISTORY_FILE = "data/snapshot.json";

async function collect(): Promise<void> {
  const accounts: AccountTarget[] = JSON.parse(readFileSync(ACCOUNTS_FILE, "utf-8"));

  const summaries = await Promise.all(accounts.map(getComplianceSummary));
  const snapshot = buildRollup(summaries);

  const history: RollupSnapshot[] = existsSync(HISTORY_FILE)
    ? JSON.parse(readFileSync(HISTORY_FILE, "utf-8"))
    : [];

  const updated = appendToHistory(history, snapshot);

  mkdirSync("data", { recursive: true });
  writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2));

  console.log(`Collected compliance data for ${accounts.length} accounts.`);
}

function build(): void {
  const history: RollupSnapshot[] = JSON.parse(readFileSync(HISTORY_FILE, "utf-8"));
  const latest = history[history.length - 1];

  const html = renderDashboardHtml(latest, history);

  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/index.html", html);

  console.log("Dashboard written to dist/index.html");
}

const command = process.argv[2];

if (command === "collect") {
  collect().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (command === "build") {
  build();
} else {
  console.error("Usage: tsx src/index.ts <collect|build>");
  process.exit(1);
}
