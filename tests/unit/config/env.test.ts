import { afterEach, describe, expect, it } from "vitest";
import {
  getOpenExchangeRatesAppId,
  MissingApiKeyError,
} from "../../../src/config/env.js";

describe("getOpenExchangeRatesAppId", () => {
  const originalAppId = process.env.OPEN_EXCHANGE_RATES_APP_ID;

  afterEach(() => {
    if (originalAppId === undefined) {
      delete process.env.OPEN_EXCHANGE_RATES_APP_ID;
    } else {
      process.env.OPEN_EXCHANGE_RATES_APP_ID = originalAppId;
    }
  });

  it("returns the API key when set", () => {
    process.env.OPEN_EXCHANGE_RATES_APP_ID = "test-app-id";
    expect(getOpenExchangeRatesAppId()).toBe("test-app-id");
  });

  it("throws MissingApiKeyError when unset", () => {
    delete process.env.OPEN_EXCHANGE_RATES_APP_ID;
    expect(() => getOpenExchangeRatesAppId()).toThrow(MissingApiKeyError);
  });
});
