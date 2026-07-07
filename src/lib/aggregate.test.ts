import { describe, expect, it } from "vitest";
import { buildRollup, appendToHistory } from "./aggregate.js";
import type { ComplianceSummary } from "./configClient.js";

const summary = (overrides: Partial<ComplianceSummary>): ComplianceSummary => ({
  accountId: "111111111111",
  accountName: "test-account",
  compliantCount: 90,
  nonCompliantCount: 10,
  collectedAt: new Date().toISOString(),
  ...overrides,
});

describe("buildRollup", () => {
  it("computes compliance rate across accounts", () => {
    const rollup = buildRollup([summary({}), summary({ compliantCount: 50, nonCompliantCount: 50 })]);
    expect(rollup.totals.compliant).toBe(140);
    expect(rollup.totals.nonCompliant).toBe(60);
    expect(rollup.totals.complianceRatePct).toBeCloseTo(70.0, 1);
  });

  it("sorts accounts by non-compliant count descending", () => {
    const rollup = buildRollup([
      summary({ accountName: "low", nonCompliantCount: 2 }),
      summary({ accountName: "high", nonCompliantCount: 20 }),
    ]);
    expect(rollup.accounts[0].accountName).toBe("high");
  });
});

describe("appendToHistory", () => {
  it("caps history at maxEntries", () => {
    const rollup = buildRollup([summary({})]);
    const history = Array.from({ length: 5 }, () => rollup);
    const updated = appendToHistory(history, rollup, 3);
    expect(updated).toHaveLength(3);
  });
});
