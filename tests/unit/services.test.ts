import { describe, expect, it } from "vitest";
import {
  daysBetween,
  FixedClock,
  parseIsoDate,
  SystemClock,
} from "../../src/services/clock.js";
import {
  InMemoryRateProvider,
  RateNotFoundError,
} from "../../src/services/rateProvider.js";

describe("Clock utilities", () => {
  it("parses ISO date strings as UTC midnight", () => {
    const date = parseIsoDate("2026-06-04");
    expect(date.toISOString()).toBe("2026-06-04T00:00:00.000Z");
  });

  it("throws on invalid ISO date", () => {
    expect(() => parseIsoDate("invalid-date")).toThrow(
      "Invalid ISO date: invalid-date",
    );
  });

  it("calculates whole-day differences", () => {
    const start = parseIsoDate("2026-05-20");
    const end = parseIsoDate("2026-06-19");
    expect(daysBetween(start, end)).toBe(30);
  });

  it("FixedClock returns the configured date", () => {
    const fixed = new Date("2026-06-19T15:30:00.000Z");
    const clock = new FixedClock(fixed);
    expect(clock.now().toISOString()).toBe(fixed.toISOString());
  });

  it("SystemClock returns a Date instance", () => {
    const clock = new SystemClock();
    expect(clock.now()).toBeInstanceOf(Date);
  });
});

describe("InMemoryRateProvider", () => {
  const provider = new InMemoryRateProvider({
    CLP: 900,
    EUR: 0.92,
  });

  it("returns same amount when currencies match", () => {
    expect(provider.convert(100, "USD", "USD")).toBe(100);
  });

  it("converts CLP to USD using injected rates", () => {
    expect(provider.convert(900, "CLP", "USD")).toBe(1);
    expect(provider.convert(81000, "CLP", "USD")).toBe(90);
  });

  it("converts between non-base currencies via USD base", () => {
    // 0.92 EUR = 1 USD = 900 CLP
    expect(provider.convert(0.92, "EUR", "CLP")).toBeCloseTo(900, 5);
  });

  it("throws RateNotFoundError for unknown currency", () => {
    expect(() => provider.convert(100, "JPY", "USD")).toThrow(
      RateNotFoundError,
    );
  });
});
