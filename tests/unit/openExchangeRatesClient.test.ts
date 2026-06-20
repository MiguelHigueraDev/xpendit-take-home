import { describe, expect, it, vi } from "vitest";
import { Decimal } from "decimal.js";
import {
  ExchangeRateApiError,
  OpenExchangeRatesClient,
} from "../../src/services/openExchangeRatesClient.js";

function createMockFetch(response: {
  ok: boolean;
  status: number;
  body: unknown;
}) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  });
}

describe("OpenExchangeRatesClient", () => {
  const appId = "test-app-id";

  it("parses a successful latest.json response into RateSet", async () => {
    const fetchFn = createMockFetch({
      ok: true,
      status: 200,
      body: {
        base: "USD",
        timestamp: 1700000000,
        rates: { CLP: 900.1, MXN: 17.2, EUR: 0.92 },
      },
    });

    const client = new OpenExchangeRatesClient({ appId, fetchFn });
    const rateSet = await client.fetchLatest();

    expect(rateSet.base).toBe("USD");
    expect(rateSet.rates.CLP?.equals(new Decimal("900.1"))).toBe(true);
    expect(rateSet.rates.MXN?.equals(new Decimal("17.2"))).toBe(true);
    expect(rateSet.rates.EUR?.equals(new Decimal("0.92"))).toBe(true);
    expect(fetchFn).toHaveBeenCalledOnce();

    const calledUrl = new URL(fetchFn.mock.calls[0]![0] as string);
    expect(calledUrl.pathname).toBe("/api/latest.json");
    expect(calledUrl.searchParams.get("app_id")).toBe(appId);
  });

  it("builds the correct historical URL with app_id and date", async () => {
    const fetchFn = createMockFetch({
      ok: true,
      status: 200,
      body: {
        base: "USD",
        rates: { CLP: 900 },
      },
    });

    const client = new OpenExchangeRatesClient({ appId, fetchFn });
    const rateSet = await client.fetchHistorical("2026-05-20");

    expect(rateSet.base).toBe("USD");
    expect(rateSet.rates.CLP?.equals(new Decimal("900"))).toBe(true);
    expect(rateSet.date).toBe("2026-05-20");

    const calledUrl = new URL(fetchFn.mock.calls[0]![0] as string);
    expect(calledUrl.pathname).toBe("/api/historical/2026-05-20.json");
    expect(calledUrl.searchParams.get("app_id")).toBe(appId);
  });

  it("rejects malformed historical dates", async () => {
    const fetchFn = createMockFetch({
      ok: true,
      status: 200,
      body: { base: "USD", rates: {} },
    });

    const client = new OpenExchangeRatesClient({ appId, fetchFn });

    await expect(client.fetchHistorical("20-05-2026")).rejects.toThrow(
      "Invalid date format",
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("maps HTTP 401 with error body to ExchangeRateApiError", async () => {
    const fetchFn = createMockFetch({
      ok: false,
      status: 401,
      body: {
        error: true,
        status: 401,
        message: "invalid_app_id",
        description: "Invalid App ID",
      },
    });

    const client = new OpenExchangeRatesClient({ appId, fetchFn });

    await expect(client.fetchLatest()).rejects.toMatchObject({
      name: "ExchangeRateApiError",
      status: 401,
      apiMessage: "invalid_app_id",
      message: "Invalid App ID",
    });
  });

  it("does not leak the app_id in error messages", async () => {
    const fetchFn = createMockFetch({
      ok: false,
      status: 403,
      body: {
        error: true,
        message: "not_allowed",
        description: "Access denied",
      },
    });

    const client = new OpenExchangeRatesClient({
      appId: "super-secret-key",
      fetchFn,
    });

    try {
      await client.fetchLatest();
      expect.fail("Expected ExchangeRateApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ExchangeRateApiError);
      const message = (error as Error).message;
      expect(message).not.toContain("super-secret-key");
    }
  });

  it("wraps network failures in ExchangeRateApiError", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Network down"));
    const client = new OpenExchangeRatesClient({ appId, fetchFn });

    await expect(client.fetchLatest()).rejects.toMatchObject({
      name: "ExchangeRateApiError",
      message: "Network down",
    });
  });

  it("wraps invalid JSON responses in ExchangeRateApiError", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("Unexpected token");
      },
    });

    const client = new OpenExchangeRatesClient({ appId, fetchFn });

    await expect(client.fetchLatest()).rejects.toMatchObject({
      name: "ExchangeRateApiError",
      message: "Unexpected token",
    });
  });
});
