import { describe, expect, it } from "vitest";
import { toMoney } from "../../../src/domain/money.js";
import { loadExpensesFromCsv } from "../../../src/batch/csv-loader.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sampleCsv = readFileSync(
  join(import.meta.dirname, "../../fixtures/sample-batch.csv"),
  "utf-8",
);

describe("loadExpensesFromCsv", () => {
  it("parses valid rows into gasto and empleado", () => {
    const { rows, errors } = loadExpensesFromCsv(sampleCsv);

    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(5);
    expect(rows[0]?.gasto.id).toBe("g_001");
    expect(rows[0]?.empleado.cost_center).toBe("sales_team");
  });

  it("accepts negative amounts without rejecting the row", () => {
    const { rows } = loadExpensesFromCsv(sampleCsv);
    const negative = rows.find((row) => row.gasto.id === "g_005");

    expect(negative?.gasto.monto.equals(toMoney(-25))).toBe(true);
  });

  it("collects malformed rows as errors", () => {
    const csv = `${sampleCsv}bad,e_002,Bruno,Soto,sales_team,food,not-a-number,USD,2026-06-04\n`;
    const { rows, errors } = loadExpensesFromCsv(csv);

    expect(rows).toHaveLength(5);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.rowNumber).toBe(7);
  });

  it("rejects rows with invalid dates", () => {
    const csv = `gasto_id,empleado_id,empleado_nombre,empleado_apellido,empleado_cost_center,categoria,monto,moneda,fecha
g_bad,e_002,Bruno,Soto,sales_team,food,50,USD,invalid-date\n`;

    const { rows, errors } = loadExpensesFromCsv(csv);

    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});
