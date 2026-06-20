import { describe, expect, it } from "vitest";
import { ALERT_CODES } from "../../../src/domain/codes.js";
import { evaluateCentroCostoRule } from "../../../src/rules/centroCostoRule.js";
import {
  createGasto,
  defaultPolitica,
  engineeringEmployee,
  noopConvertToBaseCurrency,
  referenceDate,
  salesEmployee,
} from "../../fixtures.js";

describe("evaluateCentroCostoRule", () => {
  const baseContext = {
    politica: defaultPolitica,
    referenceDate,
    convertToBaseCurrency: noopConvertToBaseCurrency,
  };

  it("returns RECHAZADO when cost center prohibits category", () => {
    const verdict = evaluateCentroCostoRule({
      ...baseContext,
      empleado: engineeringEmployee,
      gasto: createGasto({ categoria: "food" }),
    });

    expect(verdict?.status).toBe("RECHAZADO");
    expect(verdict?.alerta?.codigo).toBe(ALERT_CODES.POLITICA_CENTRO_COSTO);
    expect(verdict?.alerta?.mensaje).toBe(
      "El C.C. 'core_engineering' no puede reportar 'food'.",
    );
  });

  it("returns null when cost center is allowed for category", () => {
    const verdict = evaluateCentroCostoRule({
      ...baseContext,
      empleado: salesEmployee,
      gasto: createGasto({ categoria: "food" }),
    });

    expect(verdict).toBeNull();
  });

  it("returns null when engineering reports non-prohibited category", () => {
    const verdict = evaluateCentroCostoRule({
      ...baseContext,
      empleado: engineeringEmployee,
      gasto: createGasto({ categoria: "software" }),
    });

    expect(verdict).toBeNull();
  });
});
