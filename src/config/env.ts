import { config } from "dotenv";

/** Thrown when `OPEN_EXCHANGE_RATES_APP_ID` is missing from the environment. */
export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "OPEN_EXCHANGE_RATES_APP_ID is not set. Copy .env.example to .env and add your API key.",
    );
    this.name = "MissingApiKeyError";
  }
}

/** Loads environment variables from a `.env` file via dotenv. */
export function loadEnv(): void {
  config();
}

/**
 * Returns the Open Exchange Rates API key from the environment.
 * @returns The app ID string.
 * @throws {MissingApiKeyError} When the variable is not set.
 */
export function getOpenExchangeRatesAppId(): string {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!appId) {
    throw new MissingApiKeyError();
  }
  return appId;
}
