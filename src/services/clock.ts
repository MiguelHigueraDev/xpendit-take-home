/** Abstraction for obtaining the current date/time (enables deterministic tests). */
export interface Clock {
  /** Returns the current date and time. */
  now(): Date;
}

/** Clock that returns the real system time. */
export class SystemClock implements Clock {
  /** @inheritdoc */
  now(): Date {
    return new Date();
  }
}

/** Clock pinned to a fixed date for deterministic validation in tests. */
export class FixedClock implements Clock {
  /**
   * @param fixedDate - The date returned by every call to {@link now}.
   */
  constructor(private readonly fixedDate: Date) {}

  /** @inheritdoc */
  now(): Date {
    return new Date(this.fixedDate);
  }
}

/**
 * Parses an ISO date string (`YYYY-MM-DD`) into a UTC midnight Date.
 * @param dateString - Date in ISO format.
 * @returns Parsed date at UTC midnight.
 * @throws {Error} When the string is not a valid date.
 */
export function parseIsoDate(dateString: string): Date {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${dateString}`);
  }
  return date;
}

/**
 * Calculates the whole-day difference between two dates (UTC).
 * @param start - Earlier date.
 * @param end - Later date.
 * @returns Number of full calendar days from `start` to `end`.
 */
export function daysBetween(start: Date, end: Date): number {
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );

  return Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}
