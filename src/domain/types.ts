/** Possible validation outcomes for an expense. */
export type Estado = "APROBADO" | "PENDIENTE" | "RECHAZADO";

/** An expense submitted for validation. */
export interface Gasto {
  /** Unique expense identifier (e.g. `"g_125"`). */
  id: string;
  /** Expense amount in the original currency. */
  monto: number;
  /** ISO currency code (e.g. `"USD"`, `"CLP"`). */
  moneda: string;
  /** Expense date in ISO format (`YYYY-MM-DD`). */
  fecha: string;
  /** Expense category (e.g. `"food"`, `"transport"`). */
  categoria: string;
}

/** Employee who reported the expense. */
export interface Empleado {
  /** Unique employee identifier. */
  id: string;
  /** Employee first name. */
  nombre: string;
  /** Employee last name. */
  apellido: string;
  /** Cost center the employee belongs to (e.g. `"sales_team"`). */
  cost_center: string;
}

/** Age thresholds that map expense age to a validation state. */
export interface LimiteAntiguedad {
  /** Days after which the expense becomes PENDIENTE. */
  pendiente_dias: number;
  /** Days after which the expense becomes RECHAZADO. */
  rechazado_dias: number;
}

/** Spending limits for a single expense category, expressed in base currency. */
export interface LimiteCategoria {
  /** Maximum amount auto-approved (inclusive). */
  aprobado_hasta: number;
  /** Maximum amount allowed pending review (inclusive). */
  pendiente_hasta: number;
}

/** Cross-rule that prohibits a category for a specific cost center. */
export interface ReglaCentroCosto {
  /** Cost center subject to the restriction. */
  cost_center: string;
  /** Category that cannot be reported by this cost center. */
  categoria_prohibida: string;
}

/** Company expense policy defining all validation rules. */
export interface Politica {
  /** Base currency for category limits (e.g. `"USD"`). */
  moneda_base: string;
  /** Age-based validation thresholds. */
  limite_antiguedad: LimiteAntiguedad;
  /** Per-category spending limits keyed by category name. */
  limites_por_categoria: Record<string, LimiteCategoria>;
  /** Cost-center cross-rules prohibiting specific categories. */
  reglas_centro_costo: ReglaCentroCosto[];
}

/** A structured alert attached to a non-approved validation result. */
export interface Alerta {
  /** Machine-readable alert code (e.g. `"LIMITE_ANTIGUEDAD"`). */
  codigo: string;
  /** Human-readable alert message in Spanish. */
  mensaje: string;
}

/** Final validation output returned by the expense validator. */
export interface ValidationResult {
  /** ID of the validated expense. */
  gasto_id: string;
  /** Aggregated validation status. */
  status: Estado;
  /** Alerts collected from all triggered rules. */
  alertas: Alerta[];
}

/** Partial outcome produced by a single validation rule. */
export interface RuleVerdict {
  /** Status determined by this rule. */
  status: Estado;
  /** Optional alert when the rule does not approve the expense. */
  alerta?: Alerta;
}

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
  convertToBaseCurrency: (amount: number, fromCurrency: string) => number;
}

/**
 * A pure validation rule function.
 * Returns `null` when the rule does not apply to the given expense.
 */
export type Rule = (context: RuleContext) => RuleVerdict | null;
