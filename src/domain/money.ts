import { Decimal } from "decimal.js";
import { z } from "zod";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/** Exact decimal type used for monetary amounts and exchange rates. */
export type Money = Decimal;
export { Decimal as MoneyDecimal };

/** Decimal places used when rounding converted monetary amounts. */
export const MONEY_DECIMAL_PLACES = 4;

const moneyInputSchema = z.union([
  z.number(),
  z.string(),
  z.instanceof(Decimal),
]);

/** Parses and validates a monetary amount (may be negative). */
export const moneySchema = moneyInputSchema
  .transform((value) => {
    try {
      return new Decimal(value);
    } catch {
      return new Decimal(Number.NaN);
    }
  })
  .refine((value) => value.isFinite(), "Amount must be a finite number");

/** Parses and validates a positive exchange rate. */
export const positiveRateSchema = moneyInputSchema
  .transform((value) => {
    try {
      return new Decimal(value);
    } catch {
      return new Decimal(Number.NaN);
    }
  })
  .refine(
    (value) => value.isFinite() && value.gt(0),
    "Exchange rate must be a positive finite number",
  );

/**
 * Coerces an input value into a {@link Money} instance.
 * @param value - Number, string, or existing Decimal.
 */
export function toMoney(value: Decimal.Value): Money {
  return new Decimal(value);
}

/**
 * Rounds a monetary amount to {@link MONEY_DECIMAL_PLACES}.
 * @param amount - Amount to round.
 */
export function roundMoney(amount: Money): Money {
  return amount.toDecimalPlaces(MONEY_DECIMAL_PLACES);
}

/**
 * Canonical string key for duplicate detection and grouping.
 * @param amount - Monetary amount.
 */
export function moneyKey(amount: Money): string {
  return amount.toFixed(MONEY_DECIMAL_PLACES);
}

/**
 * Formats a monetary amount for human-readable messages.
 * @param amount - Monetary amount.
 */
export function formatMoney(amount: Money): string {
  return amount.toString();
}
