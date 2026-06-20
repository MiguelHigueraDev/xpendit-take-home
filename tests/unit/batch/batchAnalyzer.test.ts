import { describe, expect, it, vi } from "vitest";
import { BatchAnalyzer } from "../../../src/batch/batchAnalyzer.js";
import { FixedClock } from "../../../src/services/clock.js";
import { ExpenseValidator } from "../../../src/services/expenseValidator.js";
import { referenceDate } from "../../fixtures.js";
import { createMockRateResolver } from "../../helpers/mockRateResolver.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sampleCsv = readFileSync(
  join(import.meta.dirname, "../../fixtures/sample-batch.csv"),
  "utf-8",
);

describe("BatchAnalyzer", () => {
  it("produces status breakdown and anomaly results end-to-end", async () => {
    const analyzer = new BatchAnalyzer({
      clock: new FixedClock(referenceDate),
      rateResolver: createMockRateResolver(),
    });

    const report = await analyzer.analyze(sampleCsv);

    expect(report.validRows).toBe(5);
    expect(report.statusBreakdown.APROBADO).toBeGreaterThan(0);
    expect(report.statusBreakdown.RECHAZADO).toBeGreaterThan(0);
    expect(report.duplicateGroups).toHaveLength(1);
    expect(report.negativeAmountIds).toEqual(["g_005"]);

    const rejectedEngineering = report.results.find(
      (result) => result.gasto_id === "g_004",
    );
    expect(rejectedEngineering?.validation.status).toBe("RECHAZADO");

    const duplicateRow = report.results.find(
      (result) => result.gasto_id === "g_002",
    );
    expect(duplicateRow?.anomalies).toHaveLength(1);
  });

  it("reuses one ExpenseValidator per unique date", async () => {
    let constructorCalls = 0;
    const validateSpy = vi.spyOn(ExpenseValidator.prototype, "validate");
    const OriginalExpenseValidator = ExpenseValidator;

    vi.spyOn(
      await import("../../../src/services/expenseValidator.js"),
      "ExpenseValidator",
    ).mockImplementation(function (...args) {
      constructorCalls += 1;
      return new OriginalExpenseValidator(...args);
    });

    const analyzer = new BatchAnalyzer({
      clock: new FixedClock(referenceDate),
      rateResolver: createMockRateResolver(),
    });

    await analyzer.analyze(sampleCsv);

    expect(constructorCalls).toBe(2);
    expect(validateSpy).toHaveBeenCalledTimes(5);

    validateSpy.mockRestore();
    vi.restoreAllMocks();
  });
});
