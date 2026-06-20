import { describe, expect, it } from "vitest";
import { ALERT_CODES } from "../../src/domain/codes.js";
import { FixedClock } from "../../src/services/clock.js";
import { ExpenseValidator } from "../../src/services/expense-validator.js";
import {
  InMemoryRateProvider,
  RateNotFoundError,
} from "../../src/services/rate-provider.js";
import {
  createGasto,
  defaultPolitica,
  engineeringEmployee,
  mockExchangeRates,
  referenceDate,
  salesEmployee,
} from "../fixtures.js";

describe("ExpenseValidator", () => {
  const validator = new ExpenseValidator({
    clock: new FixedClock(referenceDate),
    rateProvider: new InMemoryRateProvider(mockExchangeRates),
  });

  it("returns APROBADO with empty alertas for compliant expense (PDF g_125 style)", () => {
    const result = validator.validate(
      createGasto({
        id: "g_125",
        monto: 50,
        categoria: "food",
        fecha: "2026-06-04",
      }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result).toEqual({
      gasto_id: "g_125",
      status: "APROBADO",
      alertas: [],
    });
  });

  it("returns PENDIENTE with LIMITE_ANTIGUEDAD alert (PDF g_123 style)", () => {
    const result = validator.validate(
      createGasto({
        id: "g_123",
        monto: 50,
        categoria: "food",
        fecha: "2026-05-19",
      }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result).toEqual({
      gasto_id: "g_123",
      status: "PENDIENTE",
      alertas: [
        {
          codigo: ALERT_CODES.LIMITE_ANTIGUEDAD,
          mensaje: "Gasto excede los 30 días. Requiere revisión.",
        },
      ],
    });
  });

  it("returns RECHAZADO with POLITICA_CENTRO_COSTO alert (PDF g_124 style)", () => {
    const result = validator.validate(
      createGasto({
        id: "g_124",
        monto: 50,
        categoria: "food",
        fecha: "2026-06-04",
      }),
      engineeringEmployee,
      defaultPolitica,
    );

    expect(result).toEqual({
      gasto_id: "g_124",
      status: "RECHAZADO",
      alertas: [
        {
          codigo: ALERT_CODES.POLITICA_CENTRO_COSTO,
          mensaje: "El C.C. 'core_engineering' no puede reportar 'food'.",
        },
      ],
    });
  });

  it("prioritizes RECHAZADO over PENDIENTE when multiple rules trigger", () => {
    const result = validator.validate(
      createGasto({
        id: "g_multi",
        monto: 160,
        categoria: "food",
        fecha: "2026-05-19",
      }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result.status).toBe("RECHAZADO");
    expect(result.alertas.map((alerta) => alerta.codigo)).toEqual([
      ALERT_CODES.LIMITE_ANTIGUEDAD,
      ALERT_CODES.LIMITE_CATEGORIA,
    ]);
  });

  it("returns PENDIENTE with NO_POLICY for unconfigured categories", () => {
    const result = validator.validate(
      createGasto({
        id: "g_software",
        monto: 50,
        categoria: "software",
        fecha: "2026-06-04",
      }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result).toEqual({
      gasto_id: "g_software",
      status: "PENDIENTE",
      alertas: [
        {
          codigo: ALERT_CODES.NO_POLICY,
          mensaje:
            "La categoría 'software' no tiene política definida. Requiere revisión manual.",
        },
      ],
    });
  });

  it("handles CLP conversion for category limits", () => {
    const result = validator.validate(
      createGasto({
        id: "g_clp",
        monto: 81000,
        moneda: "CLP",
        categoria: "food",
        fecha: "2026-06-04",
      }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result.status).toBe("APROBADO");
    expect(result.alertas).toEqual([]);
  });

  it("throws when exchange rate is missing for expense currency", () => {
    expect(() =>
      validator.validate(
        createGasto({
          id: "g_unknown",
          moneda: "JPY",
          categoria: "food",
        }),
        salesEmployee,
        defaultPolitica,
      ),
    ).toThrow(RateNotFoundError);
  });

  it("allows custom rule sets for isolated testing", () => {
    const customValidator = new ExpenseValidator({
      clock: new FixedClock(referenceDate),
      rateProvider: new InMemoryRateProvider(mockExchangeRates),
      rules: [],
    });

    const result = customValidator.validate(
      createGasto({ id: "g_custom" }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result.status).toBe("PENDIENTE");
    expect(result.alertas).toEqual([]);
  });
});
