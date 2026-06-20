import type { ZodError, ZodIssue } from "zod";

/** Thrown when input fails Zod schema validation. */
export class ValidationError extends Error {
  /** Individual validation issues from Zod. */
  readonly issues: ZodIssue[];

  /**
   * @param message - Human-readable summary of validation failures.
   * @param issues - Underlying Zod issues.
   */
  constructor(message: string, issues: ZodIssue[]) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }

  /** Creates a {@link ValidationError} from a Zod error. */
  static fromZodError(error: ZodError): ValidationError {
    return new ValidationError(formatZodError(error), error.issues);
  }
}

/**
 * Formats a Zod error into a single human-readable string.
 * @param error - Zod validation error.
 */
export function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}
