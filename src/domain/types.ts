import type {
  Empleado,
  Gasto,
  Politica,
  RuleVerdict,
} from "./schemas.js";
import type { Money } from "./money.js";

export type {
  Alerta,
  Empleado,
  Estado,
  Gasto,
  LimiteAntiguedad,
  LimiteCategoria,
  Politica,
  ReglaCentroCosto,
  RuleVerdict,
  ValidationResult,
} from "./schemas.js";

/** Context passed to each validation rule during evaluation. */
export interface RuleContext {
  /** Expense being validated. */
  gasto: Gasto;
  /** Employee who reported the expense. */
  empleado: Empleado;
  /** Policy to validate against. */
  politica: Politica;
  /** Reference date used for age calculations (typically "today"). */
  referenceDate: Date;
  /**
   * Converts an amount from a source currency to the policy base currency.
   * @param amount - Amount in the source currency.
   * @param fromCurrency - ISO currency code of the source amount.
   */
  convertToBaseCurrency: (amount: Money, fromCurrency: string) => Money;
}

/**
 * A pure validation rule function.
 * Returns `null` when the rule does not apply to the given expense.
 */
export type Rule = (context: RuleContext) => RuleVerdict | null;
