import { describe, expect, it } from "vitest";
import {
  daysBetween,
  FixedClock,
  parseIsoDate,
  SystemClock,
} from "../../src/services/clock.js";
import { toMoney } from "../../src/domain/money.js";
import { toRateTable } from "../fixtures.js";
import {
  InMemoryRateProvider,
  RateNotFoundError,
} from "../../src/services/rateProvider.js";
import { ExpenseValidator } from "../../src/services/expenseValidator.js";
import {
  createGasto,
  defaultPolitica,
  referenceDate,
  salesEmployee,
} from "../fixtures.js";

describe("Clock utilities", () => {
  it("parses ISO date strings as UTC midnight", () => {
    const date = parseIsoDate("2026-06-04");
    expect(date.toISOString()).toBe("2026-06-04T00:00:00.000Z");
  });

  it("throws on invalid ISO date", () => {
    expect(() => parseIsoDate("2026-02-30")).toThrow(
      "Invalid ISO date: 2026-02-30",
    );
  });

  it("throws on malformed date format", () => {
    expect(() => parseIsoDate("invalid-date")).toThrow(/Invalid date format/);
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
  const provider = new InMemoryRateProvider(
    toRateTable({ CLP: 900, EUR: 0.92 }),
  );

  it("returns same amount when currencies match", () => {
    expect(provider.convert(toMoney(100), "USD", "USD").toString()).toBe("100");
  });

  it("converts CLP to USD using injected rates", () => {
    expect(provider.convert(toMoney(900), "CLP", "USD").toString()).toBe("1");
    expect(provider.convert(toMoney(81000), "CLP", "USD").toString()).toBe(
      "90",
    );
  });

  it("converts between non-base currencies via USD base", () => {
    // 0.92 EUR = 1 USD = 900 CLP
    expect(provider.convert(toMoney(0.92), "EUR", "CLP").toString()).toBe(
      "900",
    );
  });

  it("throws RateNotFoundError for unknown currency", () => {
    expect(() => provider.convert(toMoney(100), "JPY", "USD")).toThrow(
      RateNotFoundError,
    );
  });

  it("avoids float drift on FX conversion near limit boundary", () => {
    const converted = provider.convert(toMoney(135000), "CLP", "USD");
    expect(converted.toString()).toBe("150");

    const validator = new ExpenseValidator({
      clock: new FixedClock(referenceDate),
      rateProvider: provider,
    });

    const result = validator.validate(
      createGasto({ monto: 135000, moneda: "CLP", categoria: "food" }),
      salesEmployee,
      defaultPolitica,
    );

    expect(result.status).toBe("PENDIENTE");
  });
});
