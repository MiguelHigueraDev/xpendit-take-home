import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import {
  MONEY_DECIMAL_PLACES,
  moneyKey,
  moneySchema,
  positiveRateSchema,
  roundMoney,
  toMoney,
} from "../../../src/domain/money.js";

describe("money", () => {
  it("parses amounts from numbers and strings", () => {
    expect(moneySchema.parse(50).toString()).toBe("50");
    expect(moneySchema.parse("123.45").toString()).toBe("123.45");
    expect(moneySchema.parse(new Decimal("99.9")).toString()).toBe("99.9");
  });

  it("normalizes moneyKey so equivalent values collapse", () => {
    expect(moneyKey(toMoney(50))).toBe("50.0000");
    expect(moneyKey(toMoney("50.0"))).toBe("50.0000");
    expect(moneyKey(toMoney("50.00"))).toBe("50.0000");
  });

  it("rejects non-finite amounts", () => {
    expect(moneySchema.safeParse(Number.NaN).success).toBe(false);
    expect(moneySchema.safeParse(Number.POSITIVE_INFINITY).success).toBe(false);
  });

  it("rejects non-positive exchange rates", () => {
    expect(positiveRateSchema.safeParse(0).success).toBe(false);
    expect(positiveRateSchema.safeParse(-1).success).toBe(false);
    expect(positiveRateSchema.parse("900.1").toString()).toBe("900.1");
  });

  it("rounds converted amounts to four decimal places", () => {
    const rounded = roundMoney(toMoney(1).div(3).mul(3));
    expect(rounded.toFixed(MONEY_DECIMAL_PLACES)).toBe("1.0000");
  });
});
