import { describe, expect, it } from "vitest";
import { ALERT_CODES } from "../../src/domain/codes.js";
import { resolveVerdicts } from "../../src/services/verdictResolver.js";

describe("resolveVerdicts", () => {
  it("returns PENDIENTE with no alerts when no rules apply", () => {
    expect(resolveVerdicts([])).toEqual({
      status: "PENDIENTE",
      alertas: [],
    });
  });

  it("returns APROBADO when all applicable rules approve", () => {
    expect(
      resolveVerdicts([{ status: "APROBADO" }, { status: "APROBADO" }]),
    ).toEqual({
      status: "APROBADO",
      alertas: [],
    });
  });

  it("returns PENDIENTE when highest severity is PENDIENTE", () => {
    const result = resolveVerdicts([
      { status: "APROBADO" },
      {
        status: "PENDIENTE",
        alerta: {
          codigo: ALERT_CODES.LIMITE_ANTIGUEDAD,
          mensaje: "Revisión requerida",
        },
      },
    ]);

    expect(result.status).toBe("PENDIENTE");
    expect(result.alertas).toHaveLength(1);
  });

  it("returns RECHAZADO when any rule rejects (priority 1)", () => {
    const result = resolveVerdicts([
      { status: "APROBADO" },
      {
        status: "PENDIENTE",
        alerta: {
          codigo: ALERT_CODES.LIMITE_ANTIGUEDAD,
          mensaje: "Revisión requerida",
        },
      },
      {
        status: "RECHAZADO",
        alerta: {
          codigo: ALERT_CODES.POLITICA_CENTRO_COSTO,
          mensaje: "Prohibido",
        },
      },
    ]);

    expect(result.status).toBe("RECHAZADO");
    expect(result.alertas).toHaveLength(2);
  });

  it("collects alerts from all triggered rules", () => {
    const result = resolveVerdicts([
      {
        status: "PENDIENTE",
        alerta: {
          codigo: ALERT_CODES.LIMITE_ANTIGUEDAD,
          mensaje: "Antigüedad",
        },
      },
      {
        status: "PENDIENTE",
        alerta: {
          codigo: ALERT_CODES.LIMITE_CATEGORIA,
          mensaje: "Categoría",
        },
      },
    ]);

    expect(result.status).toBe("PENDIENTE");
    expect(result.alertas.map((alerta) => alerta.codigo)).toEqual([
      ALERT_CODES.LIMITE_ANTIGUEDAD,
      ALERT_CODES.LIMITE_CATEGORIA,
    ]);
  });
});
