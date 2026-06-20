/**
 * Recursively freezes an object and all nested objects/arrays.
 * @param value - Value to freeze.
 * @returns The same value, now deeply frozen.
 */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);

  for (const key of Reflect.ownKeys(value)) {
    const nested = (value as Record<string | symbol, unknown>)[key];
    if (
      nested !== null &&
      typeof nested === "object" &&
      !Object.isFrozen(nested)
    ) {
      deepFreeze(nested);
    }
  }

  return value;
}

/**
 * Creates a deep copy of a value using structured cloning.
 * @param value - Value to clone.
 */
export function deepClone<T>(value: T): T {
  return structuredClone(value);
}

/** Deeply readonly policy shape enforced at runtime via {@link deepFreeze}. */
export type ImmutablePolitica = Readonly<{
  moneda_base: string;
  limite_antiguedad: Readonly<{
    pendiente_dias: number;
    rechazado_dias: number;
  }>;
  limites_por_categoria: Readonly<
    Record<
      string,
      Readonly<{
        aprobado_hasta: number;
        pendiente_hasta: number;
      }>
    >
  >;
  reglas_centro_costo: readonly Readonly<{
    cost_center: string;
    categoria_prohibida: string;
  }>[];
}>;
