import { z } from "zod";
import { positiveRateSchema } from "../domain/money.js";
import type { Money } from "../domain/money.js";
import { parseIsoDateString } from "../domain/schemas.js";
import type { ExchangeRateService } from "../services/exchange-rate-service.js";
import {
  InMemoryRateProvider,
  type RateProvider,
} from "../services/rate-provider.js";
import { parseOrThrow } from "../validation/parse.js";
import type { BatchRateResolution } from "./types.js";

const fallbackRatesFileSchema = z.object({
  base: z.string().trim().min(1),
  rates: z.record(z.string(), positiveRateSchema),
});

/** Resolves rate providers for a batch of dates via live API or mock rates. */
export interface RateResolver {
  resolve(dates: string[]): Promise<BatchRateResolution>;
}

/** Options for {@link BatchRateResolver}. */
export interface BatchRateResolverOptions {
  rateService?: ExchangeRateService | null;
  /** Required when `rateService` is null (mock/offline mode). */
  fallbackRates?: Record<string, Money>;
  baseCurrency?: string;
}

/**
 * Fetches one rate provider per unique date via the live API.
 * When `rateService` is null, uses static fallback rates (mock/offline mode only).
 */
export class BatchRateResolver implements RateResolver {
  private readonly rateService: ExchangeRateService | null;
  private readonly fallbackRates: Record<string, Money>;
  private readonly baseCurrency: string;

  constructor(options: BatchRateResolverOptions) {
    this.rateService = options.rateService ?? null;
    this.fallbackRates = options.fallbackRates ?? {};
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
        const provider = await this.rateService.getProviderForDate(date);
        providersByDate.set(date, provider);
        liveDates.push(date);
        apiCallCount += 1;
        continue;
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
  rates: Record<string, Money>;
} {
  const parsed = parseOrThrow(fallbackRatesFileSchema, JSON.parse(jsonContent));
  return parsed;
}
