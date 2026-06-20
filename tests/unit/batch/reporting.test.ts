import { describe, expect, it } from "vitest";
import { toMoney } from "../../../src/domain/money.js";
import {
  renderAnalysisMarkdown,
  renderConsoleSummary,
} from "../../../src/batch/reporting.js";
import type { BatchAnalysisReport } from "../../../src/batch/types.js";

const sampleReport: BatchAnalysisReport = {
  referenceDate: "2026-06-19",
  totalCsvRows: 50,
  validRows: 49,
  malformedRows: [],
  statusBreakdown: {
    APROBADO: 20,
    PENDIENTE: 15,
    RECHAZADO: 14,
  },
  results: [],
  duplicateGroups: [
    {
      monto: toMoney(90),
      moneda: "USD",
      fecha: "2026-06-09",
      gasto_ids: ["g_042", "g_043", "g_044"],
    },
  ],
  negativeAmountIds: [],
  rateResolution: {
    providersByDate: new Map(),
    uniqueDates: ["2026-06-04", "2026-06-09"],
    liveDates: ["2026-06-04", "2026-06-09"],
    fallbackDates: [],
    apiCallCount: 28,
  },
};

describe("reporting", () => {
  it("renders console summary with status breakdown", () => {
    const summary = renderConsoleSummary(sampleReport);

    expect(summary).toContain("APROBADO:  20");
    expect(summary).toContain("PENDIENTE: 15");
    expect(summary).toContain("RECHAZADO: 14");
    expect(summary).toContain("Llamadas API (live): 28");
  });

  it("renders ANALISIS.md with required sections", () => {
    const markdown = renderAnalysisMarkdown(sampleReport);

    expect(markdown).toContain("# Análisis de Gastos Históricos");
    expect(markdown).toContain("## Desglose por estado");
    expect(markdown).toContain("## Anomalías detectadas");
    expect(markdown).toContain("g_042, g_043, g_044");
    expect(markdown).toContain("## Optimización de llamadas a Open Exchange Rates");
    expect(markdown).toContain("21 llamadas evitadas");
  });
});
