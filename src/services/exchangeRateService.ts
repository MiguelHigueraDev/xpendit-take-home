import type { RateProvider } from "./rateProvider.js";
import { InMemoryRateProvider } from "./rateProvider.js";
import { OpenExchangeRatesClient } from "./openExchangeRatesClient.js";

/** Cache key used for the latest-rate snapshot. */
const LATEST_CACHE_KEY = "__latest__";

/**
 * Fetches exchange rates from the API and builds cached synchronous
 * {@link RateProvider} snapshots for injection into the validator.
 *
 * One API call is made per unique date, enabling batch pre-warming for Part 3.
 */
export class ExchangeRateService {
  private readonly cache = new Map<string, RateProvider>();

  /**
   * @param client - Open Exchange Rates HTTP client.
   */
  constructor(private readonly client: OpenExchangeRatesClient) {}

  /**
   * Returns a rate provider for a specific expense date.
   * Fetches historical rates on cache miss.
   *
   * @param fecha - Expense date in `YYYY-MM-DD` format.
   * @returns Synchronous rate provider backed by that date's rates.
   */
  async getProviderForDate(fecha: string): Promise<RateProvider> {
    const cached = this.cache.get(fecha);
    if (cached) {
      return cached;
    }

    const rateSet = await this.client.fetchHistorical(fecha);
    const provider = new InMemoryRateProvider(rateSet.rates, rateSet.base);
    this.cache.set(fecha, provider);
    return provider;
  }

  /**
   * Returns a rate provider using the latest available rates.
   * @returns Synchronous rate provider backed by the latest rate snapshot.
   */
  async getLatestProvider(): Promise<RateProvider> {
    const cached = this.cache.get(LATEST_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const rateSet = await this.client.fetchLatest();
    const provider = new InMemoryRateProvider(rateSet.rates, rateSet.base);
    this.cache.set(LATEST_CACHE_KEY, provider);
    return provider;
  }

  /**
   * Pre-fetches and caches rate providers for a set of dates.
   * Duplicate dates are deduplicated before fetching.
   *
   * @param fechas - Array of dates in `YYYY-MM-DD` format.
   */
  async prewarm(fechas: string[]): Promise<void> {
    const uniqueDates = [...new Set(fechas)];
    await Promise.all(uniqueDates.map((fecha) => this.getProviderForDate(fecha)));
  }
}
