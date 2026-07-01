import { Decimal } from "decimal.js";
import type { Money } from "../domain/money.js";

/**
 * Recursively freezes an object and all nested objects/arrays.
 * @param value - Value to freeze.
 * @returns The same value, now deeply frozen.
 */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Decimal) {
    return value;
  }

  Object.freeze(value);

  for (const key of Reflect.ownKeys(value)) {
    const nested = (value as Record<string | symbol, unknown>)[key];
    if (
      nested !== null &&
      typeof nested === "object" &&
      !(nested instanceof Decimal) &&
      !Object.isFrozen(nested)
    ) {
      deepFreeze(nested);
    }
  }

  return value;
}

/**
 * Creates a deep copy of a value, preserving Decimal instances.
 * @param value - Value to clone.
 */
export function deepClone<T>(value: T): T {
  if (value instanceof Decimal) {
    return new Decimal(value) as T;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }

  const cloned: Record<string | symbol, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    cloned[key] = deepClone((value as Record<string | symbol, unknown>)[key]);
  }

  return cloned as T;
}

/** Deeply readonly policy shape enforced at runtime via {@link deepFreeze}. */
export type ImmutablePolitica = Readonly<{
  moneda_base: string;
  limite_antiguedad: Readonly<{
    pendiente_dias: number;
    rechazado_dias: number;
  }>;
  limite_mensual: Readonly<{
    limite_total: Money;
    ventana_dias: number;
  }>;
  limites_por_categoria: Readonly<
    Record<
      string,
      Readonly<{
        aprobado_hasta: Money;
        pendiente_hasta: Money;
      }>
    >
  >;
  reglas_centro_costo: readonly Readonly<{
    cost_center: string;
    categoria_prohibida: string;
  }>[];
  categoria_desconocida: "APROBADO" | "PENDIENTE" | "RECHAZADO";
}>;
