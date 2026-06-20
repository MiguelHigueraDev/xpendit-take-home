import { z } from "zod";
import { parseIsoDateString } from "../domain/schemas.js";
import type { ExchangeRateService } from "../services/exchangeRateService.js";
import {
  InMemoryRateProvider,
  type RateProvider,
} from "../services/rateProvider.js";
import { exchangeRateSchema } from "../validation/primitives.js";
import { parseOrThrow } from "../validation/parse.js";
import type { BatchRateResolution } from "./types.js";

const fallbackRatesFileSchema = z.object({
  base: z.string().trim().min(1),
  rates: z.record(z.string(), exchangeRateSchema),
});

/** Resolves rate providers for a batch of dates with live API + fallback. */
export interface RateResolver {
  resolve(dates: string[]): Promise<BatchRateResolution>;
}

/** Options for {@link BatchRateResolver}. */
export interface BatchRateResolverOptions {
  rateService?: ExchangeRateService | null;
  fallbackRates: Record<string, number>;
  baseCurrency?: string;
}

/**
 * Fetches one rate provider per unique date via the live API,
 * falling back to static rates when the API is unavailable.
 */
export class BatchRateResolver implements RateResolver {
  private readonly rateService: ExchangeRateService | null;
  private readonly fallbackRates: Record<string, number>;
  private readonly baseCurrency: string;

  constructor(options: BatchRateResolverOptions) {
    this.rateService = options.rateService ?? null;
    this.fallbackRates = options.fallbackRates;
    this.baseCurrency = options.baseCurrency ?? "USD";
  }

  /** @inheritdoc */
  async resolve(dates: string[]): Promise<BatchRateResolution> {
    const uniqueDates = [...new Set(dates.map((date) => parseIsoDateString(date)))];
    const providersByDate = new Map<string, RateProvider>();
    const liveDates: string[] = [];
    const fallbackDates: string[] = [];
    let apiCallCount = 0;

    for (const date of uniqueDates) {
      if (this.rateService) {
        try {
          const provider = await this.rateService.getProviderForDate(date);
          providersByDate.set(date, provider);
          liveDates.push(date);
          apiCallCount += 1;
          continue;
        } catch {
          // Fall through to fallback for this date.
        }
      }

      providersByDate.set(
        date,
        new InMemoryRateProvider(this.fallbackRates, this.baseCurrency),
      );
      fallbackDates.push(date);
    }

    return {
      providersByDate,
      uniqueDates,
      liveDates,
      fallbackDates,
      apiCallCount,
    };
  }
}

/**
 * Loads fallback exchange rates from a JSON file.
 * @param jsonContent - Raw JSON file contents.
 */
export function parseFallbackRatesFile(jsonContent: string): {
  base: string;
  rates: Record<string, number>;
} {
  const parsed = parseOrThrow(fallbackRatesFileSchema, JSON.parse(jsonContent));
  return parsed;
}
