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

  it("lists every duplicate group without truncation", () => {
    const markdown = renderAnalysisMarkdown({
      ...sampleReport,
      duplicateGroups: [
        {
          monto: toMoney(50),
          moneda: "USD",
          fecha: "2026-06-04",
          gasto_ids: ["g_001", "g_011"],
        },
        {
          monto: toMoney(120),
          moneda: "USD",
          fecha: "2026-05-30",
          gasto_ids: ["g_002", "g_012"],
        },
        {
          monto: toMoney(120),
          moneda: "USD",
          fecha: "2026-03-16",
          gasto_ids: ["g_025", "g_029"],
        },
        {
          monto: toMoney(70),
          moneda: "USD",
          fecha: "2026-06-04",
          gasto_ids: ["g_036", "g_041"],
        },
        {
          monto: toMoney(150),
          moneda: "USD",
          fecha: "2026-03-16",
          gasto_ids: ["g_037", "g_039", "g_047"],
        },
        {
          monto: toMoney(130),
          moneda: "EUR",
          fecha: "2026-04-25",
          gasto_ids: ["g_038", "g_050"],
        },
        {
          monto: toMoney(90),
          moneda: "USD",
          fecha: "2026-06-09",
          gasto_ids: ["g_042", "g_043", "g_044"],
        },
      ],
    });

    expect(markdown).toContain("### Duplicados exactos (7 grupos)");
    expect(markdown).toContain("g_001, g_011");
    expect(markdown).toContain("g_038, g_050");
    expect(markdown).toContain("g_042, g_043, g_044");
  });
});
