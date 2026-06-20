import { describe, expect, it } from "vitest";
import { ALERT_CODES } from "../../../src/domain/codes.js";
import { evaluateLimiteCategoriaRule } from "../../../src/rules/limite-categoria-rule.js";
import {
  createGasto,
  defaultPolitica,
  mockConvertToBaseCurrency,
  referenceDate,
  salesEmployee,
} from "../../fixtures.js";

describe("evaluateLimiteCategoriaRule", () => {
  const baseContext = {
    empleado: salesEmployee,
    politica: defaultPolitica,
    referenceDate,
    convertToBaseCurrency: mockConvertToBaseCurrency,
  };

  it("returns PENDIENTE with NO_POLICY when category has no configured limit", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({ categoria: "software" }),
    });

    expect(verdict).toEqual({
      status: "PENDIENTE",
      alerta: {
        codigo: ALERT_CODES.NO_POLICY,
        mensaje:
          "La categoría 'software' no tiene política definida. Requiere revisión manual.",
      },
    });
  });

  it("returns APROBADO when amount is at aprobado_hasta boundary", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({ monto: 100, categoria: "food" }),
    });

    expect(verdict).toEqual({ status: "APROBADO" });
  });

  it("returns PENDIENTE when amount is just above aprobado_hasta", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({ monto: 101, categoria: "food" }),
    });

    expect(verdict?.status).toBe("PENDIENTE");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.LIMITE_CATEGORIA);
    expect(verdict?.alerta?.mensaje).toContain("food");
  });

  it("returns PENDIENTE when amount is at pendiente_hasta boundary", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({ monto: 150, categoria: "food" }),
    });

    expect(verdict?.status).toBe("PENDIENTE");
  });

  it("returns RECHAZADO when amount exceeds pendiente_hasta", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({ monto: 151, categoria: "food" }),
    });

    expect(verdict?.status).toBe("RECHAZADO");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.LIMITE_CATEGORIA);
    expect(verdict?.alerta?.mensaje).toContain("Excede límite aprobado");
  });

  it("converts foreign currency before applying food limits", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({
        monto: 81000,
        moneda: "CLP",
        categoria: "food",
      }),
    });

    expect(verdict).toEqual({ status: "APROBADO" });
  });

  it("returns PENDIENTE for CLP amount above aprobado_hasta in USD", () => {
    const verdict = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({
        monto: 99000,
        moneda: "CLP",
        categoria: "food",
      }),
    });

    expect(verdict?.status).toBe("PENDIENTE");
  });

  it("applies transport limits independently", () => {
    const approved = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({
        monto: 200,
        categoria: "transport",
      }),
    });
    const rejected = evaluateLimiteCategoriaRule({
      ...baseContext,
      gasto: createGasto({
        monto: 201,
        categoria: "transport",
      }),
    });

    expect(approved).toEqual({ status: "APROBADO" });
    expect(rejected?.status).toBe("RECHAZADO");
  });
});
