import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  defaultPolitica,
  defaultPolicyPath,
} from "../../../src/batch/policy.js";
import { parsePolitica } from "../../../src/domain/schemas.js";

describe("defaultPolitica", () => {
  it("loads from the committed policy.json", () => {
    const fromFile = parsePolitica(
      JSON.parse(readFileSync(defaultPolicyPath, "utf-8")),
    );

    expect(fromFile.moneda_base).toBe(defaultPolitica.moneda_base);
    expect(fromFile.limite_antiguedad).toEqual(defaultPolitica.limite_antiguedad);
    expect(fromFile.limites_por_categoria).toEqual(
      defaultPolitica.limites_por_categoria,
    );
    expect(fromFile.reglas_centro_costo).toEqual(
      defaultPolitica.reglas_centro_costo,
    );
    expect(fromFile.categoria_desconocida).toBe(
      defaultPolitica.categoria_desconocida,
    );
  });

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
