import type { ZodType } from "zod";
import { ValidationError } from "./errors.js";

/**
 * Parses input with a Zod schema or throws {@link ValidationError}.
 * @param schema - Zod schema to validate against.
 * @param input - Unknown input value.
 */
export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}
