import { describe, expect, it, vi } from "vitest";
import { toMoney } from "../../../src/domain/money.js";
import { BatchRateResolver } from "../../../src/batch/batch-rate-resolver.js";
import { InMemoryRateProvider } from "../../../src/services/rate-provider.js";
import type { ExchangeRateService } from "../../../src/services/exchange-rate-service.js";
import { mockExchangeRates } from "../../fixtures.js";

describe("BatchRateResolver", () => {
  const fallbackRates = mockExchangeRates;

  it("fetches one provider per unique date via live service", async () => {
    const getProviderForDate = vi.fn().mockResolvedValue(
      new InMemoryRateProvider(fallbackRates, "USD"),
    );

    const rateService = { getProviderForDate } as unknown as ExchangeRateService;
    const resolver = new BatchRateResolver({
      rateService,
      fallbackRates,
    });

    const result = await resolver.resolve([
      "2026-06-04",
      "2026-06-04",
      "2026-06-09",
    ]);

    expect(result.uniqueDates).toEqual(["2026-06-04", "2026-06-09"]);
    expect(result.liveDates).toEqual(["2026-06-04", "2026-06-09"]);
    expect(result.apiCallCount).toBe(2);
    expect(getProviderForDate).toHaveBeenCalledTimes(2);
  });

  it("propagates API errors instead of falling back to static rates", async () => {
    const getProviderForDate = vi
      .fn()
      .mockRejectedValue(new Error("API unavailable"));
    const rateService = { getProviderForDate } as unknown as ExchangeRateService;

    const resolver = new BatchRateResolver({
      rateService,
      fallbackRates,
    });

    await expect(resolver.resolve(["2026-06-04"])).rejects.toThrow(
      "API unavailable",
    );
  });

  it("uses fallback for all dates when no rate service is configured", async () => {
    const resolver = new BatchRateResolver({
      rateService: null,
      fallbackRates,
    });

    const result = await resolver.resolve(["2026-05-20", "2026-05-21"]);

    expect(result.liveDates).toEqual([]);
    expect(result.fallbackDates).toEqual(["2026-05-20", "2026-05-21"]);
    expect(result.apiCallCount).toBe(0);
  });
});
