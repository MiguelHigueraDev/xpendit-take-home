import { describe, expect, it } from "vitest";
import { detectAnomalies } from "../../../src/batch/anomalyDetector.js";
import { loadExpensesFromCsv } from "../../../src/batch/csvLoader.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ALERT_CODES } from "../../../src/domain/codes.js";

const sampleCsv = readFileSync(
  join(import.meta.dirname, "../../fixtures/sample-batch.csv"),
  "utf-8",
);

describe("detectAnomalies", () => {
  it("detects exact duplicate groups by monto, moneda, and fecha", () => {
    const { rows } = loadExpensesFromCsv(sampleCsv);
    const result = detectAnomalies(rows);

    expect(result.duplicateGroups).toHaveLength(1);
    expect(result.duplicateGroups[0]?.gasto_ids).toEqual(["g_002", "g_003"]);
    expect(result.anomaliesByGastoId.get("g_002")).toHaveLength(1);
    expect(result.anomaliesByGastoId.get("g_002")?.[0]?.alerta.codigo).toBe(
      ALERT_CODES.ANOMALIA_DUPLICADO,
    );
  });

  it("detects negative amounts", () => {
    const { rows } = loadExpensesFromCsv(sampleCsv);
    const result = detectAnomalies(rows);

    expect(result.negativeAmountIds).toEqual(["g_005"]);
    expect(result.anomaliesByGastoId.get("g_005")?.[0]?.alerta.codigo).toBe(
      ALERT_CODES.ANOMALIA_MONTO_NEGATIVO,
    );
  });

  it("does not flag unique expenses as duplicates", () => {
    const { rows } = loadExpensesFromCsv(sampleCsv);
    const result = detectAnomalies(rows);

    expect(result.anomaliesByGastoId.get("g_001")).toBeUndefined();
  });
});
