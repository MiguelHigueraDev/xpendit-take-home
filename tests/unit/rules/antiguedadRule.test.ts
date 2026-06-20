import { describe, expect, it } from "vitest";
import { ALERT_CODES } from "../../../src/domain/codes.js";
import { evaluateAntiguedadRule } from "../../../src/rules/antiguedadRule.js";
import {
  createGasto,
  defaultPolitica,
  engineeringEmployee,
  referenceDate,
  salesEmployee,
} from "../../fixtures.js";

describe("evaluateAntiguedadRule", () => {
  const baseContext = {
    empleado: salesEmployee,
    politica: defaultPolitica,
    referenceDate,
    convertToBaseCurrency: (amount: number) => amount,
  };

  it("returns APROBADO when expense is 0 days old", () => {
    const verdict = evaluateAntiguedadRule({
      ...baseContext,
      gasto: createGasto({ fecha: "2026-06-19" }),
    });

    expect(verdict).toEqual({ status: "APROBADO" });
  });

  it("returns APROBADO at exactly pendiente_dias boundary (30 days)", () => {
    const verdict = evaluateAntiguedadRule({
      ...baseContext,
      gasto: createGasto({ fecha: "2026-05-20" }),
    });

    expect(verdict).toEqual({ status: "APROBADO" });
  });

  it("returns PENDIENTE at pendiente_dias + 1 (31 days)", () => {
    const verdict = evaluateAntiguedadRule({
      ...baseContext,
      gasto: createGasto({ fecha: "2026-05-19" }),
    });

    expect(verdict?.status).toBe("PENDIENTE");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.LIMITE_ANTIGUEDAD);
    expect(verdict?.alerta?.mensaje).toContain("30 días");
  });

  it("returns PENDIENTE at exactly rechazado_dias boundary (60 days)", () => {
    const verdict = evaluateAntiguedadRule({
      ...baseContext,
      gasto: createGasto({ fecha: "2026-04-20" }),
    });

    expect(verdict?.status).toBe("PENDIENTE");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.LIMITE_ANTIGUEDAD);
  });

  it("returns RECHAZADO at rechazado_dias + 1 (61 days)", () => {
    const verdict = evaluateAntiguedadRule({
      ...baseContext,
      gasto: createGasto({ fecha: "2026-04-19" }),
    });

    expect(verdict?.status).toBe("RECHAZADO");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.LIMITE_ANTIGUEDAD);
    expect(verdict?.alerta?.mensaje).toContain("60 días");
  });

  it("does not depend on employee or category", () => {
    const verdict = evaluateAntiguedadRule({
      ...baseContext,
      empleado: engineeringEmployee,
      gasto: createGasto({
        categoria: "software",
        fecha: "2026-05-19",
      }),
    });

    expect(verdict?.status).toBe("PENDIENTE");
  });
});
