import { describe, expect, it, vi } from "vitest";
import { toMoney } from "../../src/domain/money.js";
import { ExchangeRateService } from "../../src/services/exchange-rate-service.js";
import {
  ExchangeRateApiError,
  OpenExchangeRatesClient,
} from "../../src/services/open-exchange-rates-client.js";

function createMockClient() {
  return {
    fetchHistorical: vi.fn(),
    fetchLatest: vi.fn(),
  } as unknown as OpenExchangeRatesClient & {
    fetchHistorical: ReturnType<typeof vi.fn>;
    fetchLatest: ReturnType<typeof vi.fn>;
  };
}

describe("ExchangeRateService", () => {
  it("getProviderForDate returns a provider that converts CLP to USD", async () => {
    const client = createMockClient();
    client.fetchHistorical.mockResolvedValue({
      base: "USD",
      rates: { CLP: 900 },
      date: "2026-05-20",
    });

    const service = new ExchangeRateService(client);
    const provider = await service.getProviderForDate("2026-05-20");

    expect(provider.convert(toMoney(81000), "CLP", "USD").toString()).toBe("90");
    expect(client.fetchHistorical).toHaveBeenCalledWith("2026-05-20");
  });

  it("caches providers by date so repeated calls trigger one fetch", async () => {
    const client = createMockClient();
    client.fetchHistorical.mockResolvedValue({
      base: "USD",
      rates: { CLP: 900 },
      date: "2026-05-20",
    });

    const service = new ExchangeRateService(client);

    await service.getProviderForDate("2026-05-20");
    await service.getProviderForDate("2026-05-20");

    expect(client.fetchHistorical).toHaveBeenCalledTimes(1);
  });

  it("fetches separately for different dates", async () => {
    const client = createMockClient();
    client.fetchHistorical
      .mockResolvedValueOnce({
        base: "USD",
        rates: { CLP: 900 },
        date: "2026-05-20",
      })
      .mockResolvedValueOnce({
        base: "USD",
        rates: { CLP: 910 },
        date: "2026-05-21",
      });

    const service = new ExchangeRateService(client);

    const providerA = await service.getProviderForDate("2026-05-20");
    const providerB = await service.getProviderForDate("2026-05-21");

    expect(providerA.convert(toMoney(900), "CLP", "USD").toString()).toBe("1");
    expect(providerB.convert(toMoney(910), "CLP", "USD").toString()).toBe("1");
    expect(client.fetchHistorical).toHaveBeenCalledTimes(2);
  });

  it("prewarm dedupes dates before fetching", async () => {
    const client = createMockClient();
    client.fetchHistorical.mockResolvedValue({
      base: "USD",
      rates: { CLP: 900 },
    });

    const service = new ExchangeRateService(client);

    await service.prewarm([
      "2026-05-20",
      "2026-05-20",
      "2026-05-21",
      "2026-05-21",
    ]);

    expect(client.fetchHistorical).toHaveBeenCalledTimes(2);
    expect(client.fetchHistorical).toHaveBeenCalledWith("2026-05-20");
    expect(client.fetchHistorical).toHaveBeenCalledWith("2026-05-21");
  });

  it("getLatestProvider caches the latest snapshot", async () => {
    const client = createMockClient();
    client.fetchLatest.mockResolvedValue({
      base: "USD",
      rates: { EUR: 0.92 },
    });

    const service = new ExchangeRateService(client);

    const first = await service.getLatestProvider();
    const second = await service.getLatestProvider();

    expect(first.convert(toMoney(0.92), "EUR", "USD").toString()).toBe("1");
    expect(second.convert(toMoney(0.92), "EUR", "USD").toString()).toBe("1");
    expect(client.fetchLatest).toHaveBeenCalledTimes(1);
  });

  it("propagates ExchangeRateApiError from the client", async () => {
    const client = createMockClient();
    client.fetchHistorical.mockRejectedValue(
      new ExchangeRateApiError("Historical rates unavailable", 503),
    );

    const service = new ExchangeRateService(client);

    await expect(service.getProviderForDate("2026-05-20")).rejects.toThrow(
      ExchangeRateApiError,
    );
  });
});
