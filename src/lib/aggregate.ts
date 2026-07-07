/**
 * Merge per-account compliance summaries into the rollup shape the
 * dashboard renders, and append to trend history for time-series charts.
 */
import type { ComplianceSummary } from "./configClient.js";

export interface RollupSnapshot {
  generatedAt: string;
  accounts: ComplianceSummary[];
  totals: {
    compliant: number;
    nonCompliant: number;
    complianceRatePct: number;
  };
}

export function buildRollup(summaries: ComplianceSummary[]): RollupSnapshot {
  const totals = summaries.reduce(
    (acc, s) => {
      acc.compliant += s.compliantCount;
      acc.nonCompliant += s.nonCompliantCount;
      return acc;
    },
    { compliant: 0, nonCompliant: 0 }
  );

  const total = totals.compliant + totals.nonCompliant;
  const complianceRatePct = total === 0 ? 100 : (totals.compliant / total) * 100;

  return {
    generatedAt: new Date().toISOString(),
    accounts: summaries.sort((a, b) => b.nonCompliantCount - a.nonCompliantCount),
    totals: {
      compliant: totals.compliant,
      nonCompliant: totals.nonCompliant,
      complianceRatePct: Math.round(complianceRatePct * 10) / 10,
    },
  };
}

/**
 * Append a new snapshot to the on-disk trend history array, keeping
 * only the most recent `maxEntries` (default 90 days at daily cadence).
 *
 * TODO: switch to a proper time-series store (e.g. SQLite) once history
 * exceeds a few hundred entries — a flat JSON array is fine for v0.1.
 */
export function appendToHistory(
  history: RollupSnapshot[],
  snapshot: RollupSnapshot,
  maxEntries = 90
): RollupSnapshot[] {
  const updated = [...history, snapshot];
  return updated.slice(-maxEntries);
}
