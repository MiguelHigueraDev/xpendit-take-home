import type { Money } from "../domain/money.js";
import {
  parseEmpleado,
  parseGasto,
  parsePolitica,
  parseValidationResult,
} from "../domain/schemas.js";
import type {
  Empleado,
  Gasto,
  Politica,
  Rule,
  ValidationResult,
} from "../domain/types.js";
import { evaluateAntiguedadRule } from "../rules/antiguedad-rule.js";
import { evaluateCentroCostoRule } from "../rules/centro-costo-rule.js";
import { evaluateLimiteCategoriaRule } from "../rules/limite-categoria-rule.js";
import { evaluateLimiteMensualRule } from "../rules/limite-mensual-rule.js";
import type { Clock } from "./clock.js";
import { SystemClock } from "./clock.js";
import type { RateProvider } from "./rate-provider.js";
import { resolveVerdicts } from "./verdict-resolver.js";

/** Configuration options for {@link ExpenseValidator}. */
export interface ExpenseValidatorOptions {
  /** Clock for determining expense age (defaults to {@link SystemClock}). */
  clock?: Clock;
  /** Rate provider for currency conversion (required). */
  rateProvider: RateProvider;
  /** Validation rules to apply (defaults to all built-in rules). */
  rules?: Rule[];
  /**
   * Flat list of prior expenses for rolling-window limit checks.
   * Prefer {@link historicalExpensesByEmployee} in batch contexts.
   */
  historicalExpenses?: Gasto[];
  /** Employee-scoped prior expenses for rolling-window limit checks. */
  historicalExpensesByEmployee?: Map<string, Gasto[]>;
}

/**
 * Core expense validation engine.
 *
 * Runs all configured rules against an expense, resolves the final status
 * by priority, and returns a structured {@link ValidationResult}.
 */
export class ExpenseValidator {
  private readonly clock: Clock;
  private readonly rateProvider: RateProvider;
  private readonly rules: Rule[];
  private readonly historicalExpenses: Gasto[];
  private readonly historicalExpensesByEmployee: Map<string, Gasto[]>;

  /**
   * @param options - Validator configuration.
   */
  constructor(options: ExpenseValidatorOptions) {
    this.clock = options.clock ?? new SystemClock();
    this.rateProvider = options.rateProvider;
    this.historicalExpenses = options.historicalExpenses ?? [];
    this.historicalExpensesByEmployee =
      options.historicalExpensesByEmployee ?? new Map();
    this.rules = options.rules ?? [
      evaluateAntiguedadRule,
      evaluateLimiteCategoriaRule,
      evaluateLimiteMensualRule,
      evaluateCentroCostoRule,
    ];
  }

  /**
   * Validates an expense against a policy.
   *
   * @param gasto - Expense to validate.
   * @param empleado - Employee who reported the expense.
   * @param politica - Company expense policy.
   * @returns Structured validation result with status and alerts.
   * @throws {ValidationError} When inputs fail schema validation.
   */
  validate(
    gasto: Gasto,
    empleado: Empleado,
    politica: Politica,
  ): ValidationResult {
    const validatedGasto = parseGasto(gasto);
    const validatedEmpleado = parseEmpleado(empleado);
    const validatedPolitica = parsePolitica(politica);

    const referenceDate = this.clock.now();
    const convertToBaseCurrency = (amount: Money, fromCurrency: string) =>
      this.rateProvider.convert(
        amount,
        fromCurrency,
        validatedPolitica.moneda_base,
      );

    const gastosEmpleado =
      this.historicalExpensesByEmployee.get(validatedEmpleado.id) ??
      this.historicalExpenses;

    const context = {
      gasto: validatedGasto,
      empleado: validatedEmpleado,
      politica: validatedPolitica,
      referenceDate,
      convertToBaseCurrency,
      gastosEmpleado: gastosEmpleado.filter(
        (gasto) => gasto.id !== validatedGasto.id,
      ),
    };

    const verdicts = this.rules
      .map((rule) => rule(context))
      .filter((verdict) => verdict !== null);

    const { status, alertas } = resolveVerdicts(verdicts);

    return parseValidationResult({
      gasto_id: validatedGasto.id,
      status,
      alertas,
    });
  }
}
