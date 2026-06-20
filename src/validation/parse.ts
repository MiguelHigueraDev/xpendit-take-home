import type { ZodTypeAny, output } from "zod";
import { ValidationError } from "./errors.js";

/**
 * Parses input with a Zod schema or throws {@link ValidationError}.
 * @param schema - Zod schema to validate against.
 * @param input - Unknown input value.
 */
export function parseOrThrow<S extends ZodTypeAny>(
  schema: S,
  input: unknown,
): output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw ValidationError.fromZodError(result.error);
  }
  return result.data;
}
