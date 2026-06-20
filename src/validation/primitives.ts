import { z } from "zod";

/** ISO date string in `YYYY-MM-DD` format that represents a valid calendar date. */
export const isoDateStringSchema = z.string().superRefine((value, ctx) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid date format: ${value}. Expected YYYY-MM-DD.`,
    });
    return;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid ISO date: ${value}`,
    });
    return;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    ctx.addIssue({
      code: "custom",
      message: `Invalid ISO date: ${value}`,
    });
  }
});

/** Non-empty ISO currency code (e.g. `"USD"`, `"CLP"`). */
export const currencyCodeSchema = z
  .string()
  .trim()
  .min(1, "Currency code is required");

/** Positive finite number used for exchange rates. */
export const exchangeRateSchema = z.number().positive().finite();
