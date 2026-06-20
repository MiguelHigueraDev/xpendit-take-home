import { z } from "zod";
import { currencyCodeSchema } from "../validation/primitives.js";
import { parseOrThrow } from "../validation/parse.js";

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

const convertArgsSchema = z.tuple([
  z.number().finite(),
  currencyCodeSchema,
  currencyCodeSchema,
]);

const inMemoryRatesSchema = z.record(z.string(), z.number().positive().finite());

/**
 * Synchronous rate provider backed by a pre-loaded rate table.
 * Rates are expressed as units of each currency per 1 unit of the base currency
 * (Open Exchange Rates convention).
 */
export class InMemoryRateProvider implements RateProvider {
  private readonly rates: Record<string, number>;
  private readonly baseCurrency: string;

  /**
   * @param rates - Map of currency codes to their rate relative to the base.
   * @param baseCurrency - Base currency code (defaults to `"USD"`).
   * @throws {ValidationError} When rates or base currency are invalid.
   */
  constructor(rates: Record<string, number>, baseCurrency = "USD") {
    this.rates = parseOrThrow(inMemoryRatesSchema, rates);
    this.baseCurrency = parseOrThrow(currencyCodeSchema, baseCurrency);
  }

  /** @inheritdoc */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const [validatedAmount, validatedFrom, validatedTo] = parseOrThrow(
      convertArgsSchema,
      [amount, fromCurrency, toCurrency],
    );

    if (validatedFrom === validatedTo) {
      return validatedAmount;
    }

    const fromRate = this.getRate(validatedFrom);
    const toRate = this.getRate(validatedTo);

    const amountInBase = validatedAmount / fromRate;
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
