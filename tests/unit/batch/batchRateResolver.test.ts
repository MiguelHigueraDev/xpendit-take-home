import { describe, expect, it, vi } from "vitest";
import { BatchRateResolver } from "../../../src/batch/batchRateResolver.js";
import { InMemoryRateProvider } from "../../../src/services/rateProvider.js";
import type { ExchangeRateService } from "../../../src/services/exchangeRateService.js";

describe("BatchRateResolver", () => {
  const fallbackRates = { CLP: 900, MXN: 20, EUR: 0.92 };

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

  it("falls back to static rates when live service fails", async () => {
    const getProviderForDate = vi
      .fn()
      .mockRejectedValue(new Error("API unavailable"));
    const rateService = { getProviderForDate } as unknown as ExchangeRateService;

    const resolver = new BatchRateResolver({
      rateService,
      fallbackRates,
    });

    const result = await resolver.resolve(["2026-06-04"]);

    expect(result.fallbackDates).toEqual(["2026-06-04"]);
    expect(result.apiCallCount).toBe(0);
    expect(result.providersByDate.get("2026-06-04")?.convert(900, "CLP", "USD")).toBe(1);
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
