import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BatchAnalyzer } from "../../src/batch/batchAnalyzer.js";
import {
  BatchRateResolver,
  parseFallbackRatesFile,
} from "../../src/batch/batchRateResolver.js";
import { renderAnalysisMarkdown } from "../../src/batch/reporting.js";
import { FixedClock } from "../../src/services/clock.js";
import { referenceDate } from "../fixtures.js";

const projectRoot = resolve(import.meta.dirname, "../..");

describe("E2E: batch analyzer with fallback rates (offline CLI path)", () => {
  it("mirrors analyze.ts offline behavior using data/fallback-rates.json", async () => {
    const csvContent = readFileSync(
      join(projectRoot, "gastos_historicos.csv"),
      "utf-8",
    );
    const fallback = parseFallbackRatesFile(
      readFileSync(join(projectRoot, "data/fallback-rates.json"), "utf-8"),
    );

    const analyzer = new BatchAnalyzer({
      clock: new FixedClock(referenceDate),
      rateResolver: new BatchRateResolver({
        rateService: null,
        fallbackRates: fallback.rates,
        baseCurrency: fallback.base,
      }),
    });

    const report = await analyzer.analyze(csvContent);

    expect(report.statusBreakdown).toEqual({
      APROBADO: 9,
      PENDIENTE: 17,
      RECHAZADO: 24,
    });
    expect(report.rateResolution.apiCallCount).toBe(0);
    expect(report.rateResolution.fallbackDates).toHaveLength(25);
    expect(report.rateResolution.liveDates).toEqual([]);

    const markdown = renderAnalysisMarkdown(report);
    expect(markdown).toContain("# Análisis de Gastos Históricos");
    expect(markdown).toContain("| APROBADO | 9 |");
    expect(markdown).toContain("Duplicados exactos (7 grupos)");
    expect(markdown).toContain("Filas malformadas");
  });
});
