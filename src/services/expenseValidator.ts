import type {
  Empleado,
  Gasto,
  Politica,
  Rule,
  ValidationResult,
} from "../domain/types.js";
import { evaluateAntiguedadRule } from "../rules/antiguedadRule.js";
import { evaluateCentroCostoRule } from "../rules/centroCostoRule.js";
import { evaluateLimiteCategoriaRule } from "../rules/limiteCategoriaRule.js";
import type { Clock } from "./clock.js";
import { SystemClock } from "./clock.js";
import type { RateProvider } from "./rateProvider.js";
import { resolveVerdicts } from "./verdictResolver.js";

export interface ExpenseValidatorOptions {
  clock?: Clock;
  rateProvider: RateProvider;
  rules?: Rule[];
}

export class ExpenseValidator {
  private readonly clock: Clock;
  private readonly rateProvider: RateProvider;
  private readonly rules: Rule[];

  constructor(options: ExpenseValidatorOptions) {
    this.clock = options.clock ?? new SystemClock();
    this.rateProvider = options.rateProvider;
    this.rules = options.rules ?? [
      evaluateAntiguedadRule,
      evaluateLimiteCategoriaRule,
      evaluateCentroCostoRule,
    ];
  }

  validate(
    gasto: Gasto,
    empleado: Empleado,
    politica: Politica,
  ): ValidationResult {
    const referenceDate = this.clock.now();
    const convertToBaseCurrency = (amount: number, fromCurrency: string) =>
      this.rateProvider.convert(amount, fromCurrency, politica.moneda_base);

    const context = {
      gasto,
      empleado,
      politica,
      referenceDate,
      convertToBaseCurrency,
    };

    const verdicts = this.rules
      .map((rule) => rule(context))
      .filter((verdict) => verdict !== null);

    const { status, alertas } = resolveVerdicts(verdicts);

    return {
      gasto_id: gasto.id,
      status,
      alertas,
    };
  }
}
