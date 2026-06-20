export class RateNotFoundError extends Error {
  constructor(from: string, to: string) {
    super(`No exchange rate found for ${from} -> ${to}`);
    this.name = "RateNotFoundError";
  }
}

export interface RateProvider {
  convert(amount: number, fromCurrency: string, toCurrency: string): number;
}

export class InMemoryRateProvider implements RateProvider {
  constructor(
    private readonly rates: Record<string, number>,
    private readonly baseCurrency = "USD",
  ) {}

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const fromRate = this.getRate(fromCurrency);
    const toRate = this.getRate(toCurrency);

    const amountInBase = amount / fromRate;
    return amountInBase * toRate;
  }

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
