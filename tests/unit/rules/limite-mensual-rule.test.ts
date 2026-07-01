import { describe, expect, it } from "vitest";
import { ALERT_CODES } from "../../../src/domain/codes.js";
import { evaluateLimiteMensualRule } from "../../../src/rules/limite-mensual-rule.js";
import {
  createGasto,
  defaultPolitica,
  mockConvertToBaseCurrency,
  salesEmployee,
} from "../../fixtures.js";

describe("evaluateLimiteMensualRule", () => {
  const baseContext = {
    empleado: salesEmployee,
    politica: defaultPolitica,
    referenceDate: new Date("2026-06-19T12:00:00.000Z"),
    convertToBaseCurrency: mockConvertToBaseCurrency,
  };

  it("returns APROBADO when the employee total in the window is within limit", () => {
    const verdict = evaluateLimiteMensualRule({
      ...baseContext,
      gasto: createGasto({ id: "g_new", monto: 150, fecha: "2026-06-04" }),
      gastosEmpleado: [
        createGasto({ id: "g_prior_1", monto: 900, fecha: "2026-05-20" }),
        createGasto({ id: "g_prior_2", monto: 900, fecha: "2026-05-25" }),
      ],
    });

    expect(verdict).toEqual({ status: "APROBADO" });
  });

  it("returns RECHAZADO with LIMITE_MENSUAL_EXCEDIDO when the window total exceeds limit", () => {
    const verdict = evaluateLimiteMensualRule({
      ...baseContext,
      gasto: createGasto({ id: "g_new", monto: 150, fecha: "2026-06-04" }),
      gastosEmpleado: [
        createGasto({ id: "g_prior_1", monto: 1000, fecha: "2026-05-20" }),
        createGasto({ id: "g_prior_2", monto: 900, fecha: "2026-05-25" }),
      ],
    });

    expect(verdict?.status).toBe("RECHAZADO");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.LIMITE_MENSUAL_EXCEDIDO);
    expect(verdict?.alerta?.mensaje).toContain("2000");
    expect(verdict?.alerta?.mensaje).toContain("30");
  });

  it("ignores prior expenses outside the rolling window", () => {
    const verdict = evaluateLimiteMensualRule({
      ...baseContext,
      gasto: createGasto({ id: "g_new", monto: 150, fecha: "2026-06-04" }),
      gastosEmpleado: [
        createGasto({ id: "g_old", monto: 5000, fecha: "2026-04-01" }),
      ],
    });

    expect(verdict).toEqual({ status: "APROBADO" });
  });

  it.todo("converts foreign currency before summing the rolling window total");
});
