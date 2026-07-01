import { describe, expect, it } from "vitest";
import {
  empleadoSchema,
  gastoSchema,
  parseGasto,
  parsePolitica,
  politicaSchema,
} from "../../../src/domain/schemas.js";
import { toMoney } from "../../../src/domain/money.js";
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

  it("returns a deeply frozen policy that cannot be mutated", () => {
    const politica = parsePolitica(defaultPolitica);

    expect(Object.isFrozen(politica)).toBe(true);
    expect(Object.isFrozen(politica.limite_antiguedad)).toBe(true);
    expect(Object.isFrozen(politica.limite_mensual)).toBe(true);
    expect(Object.isFrozen(politica.limites_por_categoria)).toBe(true);
    expect(Object.isFrozen(politica.limites_por_categoria.food)).toBe(true);
    expect(Object.isFrozen(politica.reglas_centro_costo)).toBe(true);
    expect(Object.isFrozen(politica.reglas_centro_costo[0])).toBe(true);

    expect(() => {
      (politica as { moneda_base: string }).moneda_base = "EUR";
    }).toThrow(TypeError);

    expect(() => {
      (politica.limites_por_categoria as Record<string, unknown>).food = {
        aprobado_hasta: 999,
        pendiente_hasta: 999,
      };
    }).toThrow(TypeError);
  });

  it("returns a clone independent from the input object", () => {
    const input = {
      moneda_base: "USD",
      limite_antiguedad: { pendiente_dias: 30, rechazado_dias: 60 },
      limite_mensual: { limite_total: 2000, ventana_dias: 30 },
      limites_por_categoria: {
        food: { aprobado_hasta: 100, pendiente_hasta: 150 },
      },
      reglas_centro_costo: [
        { cost_center: "core_engineering", categoria_prohibida: "food" },
      ],
    };

    const politica = parsePolitica(input);
    input.limites_por_categoria.food.aprobado_hasta = 999;

    expect(politica.limites_por_categoria.food?.aprobado_hasta.equals(toMoney(100))).toBe(true);
  });
});
