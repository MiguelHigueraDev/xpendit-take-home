import { z } from "zod";
import { parseOrThrow } from "../validation/parse.js";
import { exchangeRateSchema, isoDateStringSchema } from "../validation/primitives.js";

/** Open Exchange Rates API error response body. */
export const openExchangeRatesErrorSchema = z.object({
  error: z.literal(true),
  status: z.number().optional(),
  message: z.string().optional(),
  description: z.string().optional(),
});

/** Successful Open Exchange Rates API rate response body. */
export const openExchangeRatesRateSetSchema = z.object({
  base: z.string().trim().min(1),
  rates: z.record(z.string(), exchangeRateSchema),
  timestamp: z.number().optional(),
});

/** Exchange rate snapshot used by the application. */
export const rateSetSchema = z.object({
  base: z.string().trim().min(1),
  rates: z.record(z.string(), exchangeRateSchema),
  date: isoDateStringSchema.optional(),
});

export type OpenExchangeRatesErrorBody = z.infer<
  typeof openExchangeRatesErrorSchema
>;
export type OpenExchangeRatesRateSetBody = z.infer<
  typeof openExchangeRatesRateSetSchema
>;
export type RateSet = z.infer<typeof rateSetSchema>;

/** Returns true when the body matches an Open Exchange Rates error response. */
export function isOpenExchangeRatesErrorBody(
  body: unknown,
): body is OpenExchangeRatesErrorBody {
  return openExchangeRatesErrorSchema.safeParse(body).success;
}

/** Validates and parses a successful Open Exchange Rates API response. */
export function parseOpenExchangeRatesRateSetBody(
  input: unknown,
): OpenExchangeRatesRateSetBody {
  return parseOrThrow(openExchangeRatesRateSetSchema, input);
}

/** Validates and parses an application rate snapshot. */
export function parseRateSet(input: unknown): RateSet {
  return parseOrThrow(rateSetSchema, input);
}
