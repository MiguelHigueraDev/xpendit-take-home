import { Decimal } from "decimal.js";

/** Compile-time mirror of {@link deepFreeze} — preserves Decimal leaves as-is. */
export type DeepReadonly<T> = T extends Decimal
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;

/**
 * Recursively freezes an object and all nested objects/arrays.
 * @param value - Value to freeze.
 * @returns The same value, now deeply frozen.
 */
export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value === null || typeof value !== "object") {
    return value as DeepReadonly<T>;
  }

  if (value instanceof Decimal) {
    return value as DeepReadonly<T>;
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

  return value as DeepReadonly<T>;
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
