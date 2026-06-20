import { describe, expect, it } from "vitest";
import {
  empleadoSchema,
  gastoSchema,
  parseGasto,
  parsePolitica,
  politicaSchema,
} from "../../../src/domain/schemas.js";
import { ValidationError } from "../../../src/validation/errors.js";
import { defaultPolitica, salesEmployee } from "../../fixtures.js";

describe("domain schemas", () => {
  it("accepts valid expense, employee, and policy fixtures", () => {
    expect(gastoSchema.safeParse({ id: "g_1", monto: 50, moneda: "USD", fecha: "2026-06-04", categoria: "food" }).success).toBe(true);
    expect(empleadoSchema.safeParse(salesEmployee).success).toBe(true);
    expect(politicaSchema.safeParse(defaultPolitica).success).toBe(true);
  });

  it("rejects invalid ISO dates", () => {
    expect(() => parseGasto({ id: "g_1", monto: 50, moneda: "USD", fecha: "invalid-date", categoria: "food" })).toThrow(ValidationError);
    expect(() => parseGasto({ id: "g_1", monto: 50, moneda: "USD", fecha: "20-05-2026", categoria: "food" })).toThrow(/Invalid date format/);
  });

  it("rejects policy when pendiente_dias exceeds rechazado_dias", () => {
    expect(() =>
      parsePolitica({
        ...defaultPolitica,
        limite_antiguedad: { pendiente_dias: 61, rechazado_dias: 60 },
      }),
    ).toThrow(ValidationError);
  });

  it("rejects category limits when aprobado_hasta exceeds pendiente_hasta", () => {
    expect(() =>
      parsePolitica({
        ...defaultPolitica,
        limites_por_categoria: {
          food: { aprobado_hasta: 200, pendiente_hasta: 150 },
        },
      }),
    ).toThrow(ValidationError);
  });
});
