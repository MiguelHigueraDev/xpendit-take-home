/**
 * Xpendit expense rules engine — public API.
 *
 * Re-exports domain types, validation rules, the expense validator,
 * exchange rate services, and environment configuration.
 */
export * from "./domain/types.js";
export * from "./domain/codes.js";
export * from "./config/env.js";
export * from "./services/clock.js";
export * from "./services/rateProvider.js";
export * from "./services/openExchangeRatesClient.js";
export * from "./services/exchangeRateService.js";
export * from "./services/verdictResolver.js";
export * from "./services/expenseValidator.js";
export * from "./rules/antiguedadRule.js";
export * from "./rules/limiteCategoriaRule.js";
export * from "./rules/centroCostoRule.js";
