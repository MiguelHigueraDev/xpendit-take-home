/** Exchange rate snapshot returned by the Open Exchange Rates API. */
export interface RateSet {
  /** Base currency of the rate table (typically `"USD"`). */
  base: string;
  /** Map of currency codes to rates relative to the base. */
  rates: Record<string, number>;
  /** Date the rates apply to (`YYYY-MM-DD`), set for historical fetches. */
  date?: string;
}

/** Shape of an error response from the Open Exchange Rates API. */
interface ApiErrorBody {
  error: true;
  status?: number;
  message?: string;
  description?: string;
}

/** Shape of a successful rate response from the Open Exchange Rates API. */
interface RateSetBody {
  base: string;
  rates: Record<string, number>;
}

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

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

/** HTTP client for the Open Exchange Rates API. */
export class OpenExchangeRatesClient {
  private readonly appId: string;
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFn;

  /**
   * @param options - Client configuration.
   */
  constructor(options: OpenExchangeRatesClientOptions) {
    this.appId = options.appId;
    this.baseUrl = options.baseUrl ?? "https://openexchangerates.org/api";
    this.fetchFn = options.fetchFn ?? fetch;
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
   * @throws {Error} When the date format is invalid.
   * @throws {ExchangeRateApiError} On HTTP or API-level failures.
   */
  async fetchHistorical(date: string): Promise<RateSet> {
    if (!ISO_DATE_REGEX.test(date)) {
      throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD.`);
    }

    const rateSet = await this.fetchRateSet(this.buildUrl(`historical/${date}.json`));
    return { ...rateSet, date };
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

      if (!response.ok || isApiErrorBody(body)) {
        const apiError = isApiErrorBody(body) ? body : undefined;
        throw new ExchangeRateApiError(
          apiError?.description ??
            `Exchange rate API request failed with status ${response.status}`,
          response.status,
          apiError?.message,
        );
      }

      if (!isRateSetBody(body)) {
        throw new ExchangeRateApiError(
          "Invalid exchange rate API response format",
        );
      }

      return {
        base: body.base,
        rates: body.rates,
      };
    } catch (error) {
      if (error instanceof ExchangeRateApiError) {
        throw error;
      }

      throw new ExchangeRateApiError(
        error instanceof Error
          ? error.message
          : "Unknown exchange rate API error",
      );
    }
  }
}

/** Type guard for Open Exchange Rates API error responses. */
function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    (body as ApiErrorBody).error === true
  );
}

/** Type guard for Open Exchange Rates API success responses. */
function isRateSetBody(body: unknown): body is RateSetBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "base" in body &&
    "rates" in body &&
    typeof (body as RateSetBody).base === "string" &&
    typeof (body as RateSetBody).rates === "object" &&
    (body as RateSetBody).rates !== null
  );
}
