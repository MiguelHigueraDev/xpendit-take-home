import { describe, expect, it } from "vitest";
import { defaultPolitica } from "../../../src/batch/policy.js";

describe("defaultPolitica", () => {
  it("is deeply frozen at module load", () => {
    expect(Object.isFrozen(defaultPolitica)).toBe(true);
    expect(Object.isFrozen(defaultPolitica.limite_antiguedad)).toBe(true);
    expect(Object.isFrozen(defaultPolitica.limites_por_categoria)).toBe(true);
    expect(Object.isFrozen(defaultPolitica.reglas_centro_costo)).toBe(true);

    expect(() => {
      (defaultPolitica as { moneda_base: string }).moneda_base = "EUR";
    }).toThrow(TypeError);
  });
});
