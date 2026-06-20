import type { RateResolver } from "../../src/batch/batchRateResolver.js";
import { InMemoryRateProvider } from "../../src/services/rateProvider.js";
import { mockExchangeRates } from "../fixtures.js";

/**
 * Rate resolver that serves fixed in-memory rates for every unique date.
 * Avoids network calls in E2E and integration tests.
 */
export function createMockRateResolver(
  rates = mockExchangeRates,
  baseCurrency = "USD",
): RateResolver {
  return {
    async resolve(dates) {
      const uniqueDates = [...new Set(dates)];

      return {
        providersByDate: new Map(
          uniqueDates.map((date) => [
            date,
            new InMemoryRateProvider(rates, baseCurrency),
          ]),
        ),
        uniqueDates,
        liveDates: [],
        fallbackDates: uniqueDates,
        apiCallCount: 0,
      };
    },
  };
}
