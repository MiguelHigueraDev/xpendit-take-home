import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";
import { BatchAnalyzer } from "../../src/batch/batchAnalyzer.js";
import { ALERT_CODES, type AlertCode } from "../../src/domain/codes.js";
import type { BatchAnalysisReport } from "../../src/batch/types.js";
import type { Estado } from "../../src/domain/types.js";
import { FixedClock } from "../../src/services/clock.js";
import { createMockRateResolver } from "../helpers/mockRateResolver.js";
import { referenceDate } from "../fixtures.js";

const projectRoot = resolve(import.meta.dirname, "../..");
const historicalCsv = readFileSync(
  join(projectRoot, "gastos_historicos.csv"),
  "utf-8",
);

/** Expected status counts for gastos_historicos.csv (ref 2026-06-19, mock FX rates). */
const GOLDEN_STATUS_BREAKDOWN: Record<Estado, number> = {
  APROBADO: 13,
  PENDIENTE: 13,
  RECHAZADO: 24,
};

const GOLDEN_APPROVED_IDS = [
  "g_001",
  "g_004",
  "g_014",
  "g_024",
  "g_031",
  "g_032",
  "g_036",
  "g_041",
  "g_042",
  "g_043",
  "g_044",
  "g_045",
  "g_049",
];

const GOLDEN_PENDING_IDS = [
  "g_002",
  "g_005",
  "g_007",
  "g_008",
  "g_010",
  "g_015",
  "g_030",
  "g_034",
  "g_035",
  "g_038",
  "g_040",
  "g_046",
  "g_050",
];

const GOLDEN_REJECTED_IDS = [
  "g_003",
  "g_006",
  "g_009",
  "g_011",
  "g_012",
  "g_013",
  "g_016",
  "g_017",
  "g_018",
  "g_019",
  "g_020",
  "g_021",
  "g_022",
  "g_023",
  "g_025",
  "g_026",
  "g_027",
  "g_028",
  "g_029",
  "g_033",
  "g_037",
  "g_039",
  "g_047",
  "g_048",
];

const GOLDEN_DUPLICATE_GROUPS = [
  { monto: "50", moneda: "USD", fecha: "2026-06-04", gasto_ids: ["g_001", "g_011"] },
  { monto: "120", moneda: "USD", fecha: "2026-05-30", gasto_ids: ["g_002", "g_012"] },
  { monto: "120", moneda: "USD", fecha: "2026-03-16", gasto_ids: ["g_025", "g_029"] },
  { monto: "70", moneda: "USD", fecha: "2026-06-04", gasto_ids: ["g_036", "g_041"] },
  {
    monto: "150",
    moneda: "USD",
    fecha: "2026-03-16",
    gasto_ids: ["g_037", "g_039", "g_047"],
  },
  { monto: "130", moneda: "EUR", fecha: "2026-04-25", gasto_ids: ["g_038", "g_050"] },
  {
    monto: "90",
    moneda: "USD",
    fecha: "2026-06-09",
    gasto_ids: ["g_042", "g_043", "g_044"],
  },
];

function alertCodesFor(report: BatchAnalysisReport, gastoId: string): AlertCode[] {
  const row = report.results.find((result) => result.gasto_id === gastoId);
  expect(row).toBeDefined();
  return row!.validation.alertas
    .map((alerta) => alerta.codigo)
    .sort() as AlertCode[];
}

function normalizeDuplicateGroups(report: BatchAnalysisReport) {
  return report.duplicateGroups
    .map((group) => ({
      monto: group.monto.toString(),
      moneda: group.moneda,
      fecha: group.fecha,
      gasto_ids: [...group.gasto_ids].sort(),
    }))
    .sort((left, right) => left.gasto_ids[0]!.localeCompare(right.gasto_ids[0]!));
}

describe("E2E: gastos_historicos.csv batch analysis", () => {
  let report: BatchAnalysisReport;

  beforeAll(async () => {
    const analyzer = new BatchAnalyzer({
      clock: new FixedClock(referenceDate),
      rateResolver: createMockRateResolver(),
    });

    report = await analyzer.analyze(historicalCsv);
  });

  it("loads and validates all 50 CSV rows", () => {
    expect(report.referenceDate).toBe("2026-06-19");
    expect(report.totalCsvRows).toBe(50);
    expect(report.validRows).toBe(50);
    expect(report.malformedRows).toEqual([]);
    expect(report.results).toHaveLength(50);
  });

  it("matches the golden status breakdown from ANALISIS.md", () => {
    expect(report.statusBreakdown).toEqual(GOLDEN_STATUS_BREAKDOWN);
  });

  it("assigns each expense to the expected final status", () => {
    const idsByStatus = {
      APROBADO: [] as string[],
      PENDIENTE: [] as string[],
      RECHAZADO: [] as string[],
    };

    for (const result of report.results) {
      idsByStatus[result.validation.status].push(result.gasto_id);
    }

    expect(idsByStatus.APROBADO.sort()).toEqual(GOLDEN_APPROVED_IDS);
    expect(idsByStatus.PENDIENTE.sort()).toEqual(GOLDEN_PENDING_IDS);
    expect(idsByStatus.RECHAZADO.sort()).toEqual(GOLDEN_REJECTED_IDS);
  });

  it("detects seven exact-duplicate groups", () => {
    expect(normalizeDuplicateGroups(report)).toEqual(
      [...GOLDEN_DUPLICATE_GROUPS].sort((left, right) =>
        left.gasto_ids[0]!.localeCompare(right.gasto_ids[0]!),
      ),
    );
    expect(report.negativeAmountIds).toEqual([]);
  });

  it("resolves FX rates once per unique date without API calls", () => {
    expect(report.rateResolution.uniqueDates).toHaveLength(25);
    expect(report.rateResolution.apiCallCount).toBe(0);
    expect(report.rateResolution.liveDates).toEqual([]);
    expect(report.rateResolution.fallbackDates).toHaveLength(25);
  });

  it("flags anomalies without changing rule-based validation status", () => {
    const approvedDuplicate = report.results.find(
      (result) => result.gasto_id === "g_001",
    );
    expect(approvedDuplicate?.validation.status).toBe("APROBADO");
    expect(approvedDuplicate?.anomalies).toHaveLength(1);
    expect(approvedDuplicate?.anomalies[0]?.tipo).toBe("DUPLICADO_EXACTO");

    const rejectedDuplicate = report.results.find(
      (result) => result.gasto_id === "g_011",
    );
    expect(rejectedDuplicate?.validation.status).toBe("RECHAZADO");
    expect(rejectedDuplicate?.anomalies).toHaveLength(1);
    expect(rejectedDuplicate?.anomalies[0]?.alerta.codigo).toBe(
      ALERT_CODES.ANOMALIA_DUPLICADO,
    );
  });

  describe("spot checks from ANALISIS.md", () => {
    it("rejects category-limit violations", () => {
      expect(alertCodesFor(report, "g_003")).toEqual([
        ALERT_CODES.LIMITE_CATEGORIA,
      ]);
    });

    it("rejects combined age and category violations", () => {
      expect(alertCodesFor(report, "g_006")).toEqual([
        ALERT_CODES.LIMITE_ANTIGUEDAD,
        ALERT_CODES.LIMITE_CATEGORIA,
      ]);
      expect(alertCodesFor(report, "g_009")).toEqual([
        ALERT_CODES.LIMITE_ANTIGUEDAD,
        ALERT_CODES.LIMITE_CATEGORIA,
      ]);
    });

    it("rejects cost-center policy violations", () => {
      expect(alertCodesFor(report, "g_011")).toEqual([
        ALERT_CODES.POLITICA_CENTRO_COSTO,
      ]);
      expect(alertCodesFor(report, "g_012")).toEqual([
        ALERT_CODES.LIMITE_CATEGORIA,
        ALERT_CODES.POLITICA_CENTRO_COSTO,
      ]);
    });

    it("marks category over-limit expenses as pending", () => {
      expect(alertCodesFor(report, "g_002")).toEqual([
        ALERT_CODES.LIMITE_CATEGORIA,
      ]);
    });

    it("marks age-based pending expenses", () => {
      expect(alertCodesFor(report, "g_005")).toEqual([
        ALERT_CODES.LIMITE_ANTIGUEDAD,
        ALERT_CODES.LIMITE_CATEGORIA,
      ]);
      expect(alertCodesFor(report, "g_007")).toEqual([
        ALERT_CODES.LIMITE_ANTIGUEDAD,
      ]);
      expect(alertCodesFor(report, "g_008")).toEqual([
        ALERT_CODES.LIMITE_ANTIGUEDAD,
        ALERT_CODES.LIMITE_CATEGORIA,
      ]);
      expect(alertCodesFor(report, "g_010")).toEqual([
        ALERT_CODES.LIMITE_ANTIGUEDAD,
      ]);
    });

    it("approves compliant CLP and USD expenses", () => {
      expect(alertCodesFor(report, "g_001")).toEqual([]);
      expect(alertCodesFor(report, "g_004")).toEqual([]);
    });
  });
});
