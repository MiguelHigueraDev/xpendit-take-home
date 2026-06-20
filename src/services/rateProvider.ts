/** Thrown when a currency conversion rate is not available. */
export class RateNotFoundError extends Error {
  /**
   * @param from - Source currency code.
   * @param to - Target currency code.
   */
  constructor(from: string, to: string) {
    super(`No exchange rate found for ${from} -> ${to}`);
    this.name = "RateNotFoundError";
  }
}

/**
 * Converts amounts between currencies.
 * Implementations may be in-memory mocks or snapshots built from live API data.
 */
export interface RateProvider {
  /**
   * Converts an amount from one currency to another.
   * @param amount - Amount in the source currency.
   * @param fromCurrency - ISO code of the source currency.
   * @param toCurrency - ISO code of the target currency.
   * @returns Converted amount in the target currency.
   */
  convert(amount: number, fromCurrency: string, toCurrency: string): number;
}

/**
 * Synchronous rate provider backed by a pre-loaded rate table.
 * Rates are expressed as units of each currency per 1 unit of the base currency
 * (Open Exchange Rates convention).
 */
export class InMemoryRateProvider implements RateProvider {
  /**
   * @param rates - Map of currency codes to their rate relative to the base.
   * @param baseCurrency - Base currency code (defaults to `"USD"`).
   */
  constructor(
    private readonly rates: Record<string, number>,
    private readonly baseCurrency = "USD",
  ) {}

  /** @inheritdoc */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = this.getRate(fromCurrency);
    const toRate = this.getRate(toCurrency);

    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }

  /**
   * Looks up the rate for a currency relative to the base.
   * @param currency - ISO currency code.
   * @throws {RateNotFoundError} When the currency is not in the rate table.
   */
  private getRate(currency: string): number {
    if (currency === this.baseCurrency) {
      return 1;
    }

    const rate = this.rates[currency];
    if (rate === undefined) {
      throw new RateNotFoundError(currency, this.baseCurrency);
    }

    return rate;
  }
}
