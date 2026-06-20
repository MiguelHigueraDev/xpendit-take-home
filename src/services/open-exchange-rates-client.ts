import { z } from "zod";
import {
  isOpenExchangeRatesErrorBody,
  parseOpenExchangeRatesRateSetBody,
  type RateSet,
} from "../api/schemas.js";
import { parseIsoDateString } from "../domain/schemas.js";
import { parseOrThrow } from "../validation/parse.js";
import { ValidationError } from "../validation/errors.js";

/** Thrown when an Open Exchange Rates API request fails. */
export class ExchangeRateApiError extends Error {
  /** HTTP status code, when available. */
  readonly status?: number;
  /** Machine-readable API error message (e.g. `"invalid_app_id"`). */
  readonly apiMessage?: string;

  /**
   * @param message - Human-readable error description.
   * @param status - HTTP status code.
   * @param apiMessage - API-level error identifier.
   */
  constructor(message: string, status?: number, apiMessage?: string) {
    super(message);
    this.name = "ExchangeRateApiError";
    this.status = status;
    this.apiMessage = apiMessage;
  }
}

/** Injectable fetch implementation (defaults to global `fetch`). */
export type FetchFn = typeof fetch;

/** Options for constructing an {@link OpenExchangeRatesClient}. */
export interface OpenExchangeRatesClientOptions {
  /** Open Exchange Rates app ID (API key). */
  appId: string;
  /** API base URL override (defaults to the official endpoint). */
  baseUrl?: string;
  /** Custom fetch function for testing. */
  fetchFn?: FetchFn;
}

const clientOptionsSchema = z.object({
  appId: z.string().trim().min(1, "Open Exchange Rates app ID is required"),
  baseUrl: z.string().url().optional(),
  fetchFn: z.custom<FetchFn>().optional(),
});

/** HTTP client for the Open Exchange Rates API. */
export class OpenExchangeRatesClient {
  private readonly appId: string;
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;

  /**
   * @param options - Client configuration.
   * @throws {ValidationError} When options are invalid.
   */
  constructor(options: OpenExchangeRatesClientOptions) {
    const validated = parseOrThrow(clientOptionsSchema, options);
    this.appId = validated.appId;
    this.baseUrl = validated.baseUrl ?? "https://openexchangerates.org/api";
    this.fetchFn = validated.fetchFn ?? fetch;
  }

  /**
   * Fetches the latest available exchange rates.
   * @returns Rate snapshot with base currency and rate table.
   * @throws {ExchangeRateApiError} On HTTP or API-level failures.
   */
  async fetchLatest(): Promise<RateSet> {
    const url = this.buildUrl("latest.json");
    return this.fetchRateSet(url);
  }

  /**
   * Fetches historical exchange rates for a specific date.
   * @param date - Date in `YYYY-MM-DD` format.
   * @returns Rate snapshot including the requested date.
   * @throws {ValidationError} When the date format is invalid.
   * @throws {ExchangeRateApiError} On HTTP or API-level failures.
   */
  async fetchHistorical(date: string): Promise<RateSet> {
    const validatedDate = parseIsoDateString(date);
    const rateSet = await this.fetchRateSet(
      this.buildUrl(`historical/${validatedDate}.json`),
    );
    return { ...rateSet, date: validatedDate };
  }

  /**
   * Builds a fully qualified API URL with the app ID query parameter.
   * @param path - API path (e.g. `"latest.json"`).
   */
  private buildUrl(path: string): string {
    const url = new URL(`${this.baseUrl}/${path}`);
    url.searchParams.set("app_id", this.appId);
    return url.toString();
  }

  /**
   * Performs a fetch and parses the response into a {@link RateSet}.
   * @param url - Fully qualified request URL.
   */
  private async fetchRateSet(url: string): Promise<RateSet> {
    try {
      const response = await this.fetchFn(url);
      const body: unknown = await response.json();

      if (!response.ok || isOpenExchangeRatesErrorBody(body)) {
        const apiError = isOpenExchangeRatesErrorBody(body) ? body : undefined;
        throw new ExchangeRateApiError(
          apiError?.description ??
            `Exchange rate API request failed with status ${response.status}`,
          response.status,
          apiError?.message,
        );
      }

      const parsed = parseOpenExchangeRatesRateSetBody(body);
      return {
        base: parsed.base,
        rates: parsed.rates,
      };
    } catch (error) {
      if (error instanceof ExchangeRateApiError) {
        throw error;
      }

      if (error instanceof ValidationError) {
        throw new ExchangeRateApiError(error.message);
      }

      throw new ExchangeRateApiError(
        error instanceof Error
          ? error.message
          : "Unknown exchange rate API error",
      );
    }
  }
}

export type { RateSet };
