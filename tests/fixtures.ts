import type { Decimal } from "decimal.js";
import type { Money } from "../src/domain/money.js";
import { roundMoney, toMoney } from "../src/domain/money.js";
import type { Empleado, Gasto, RuleContext } from "../src/domain/types.js";
import { defaultPolitica } from "../src/batch/policy.js";

export { defaultPolitica };

/** Sample employee from the sales team (allowed to report food). */
export const salesEmployee: Empleado = {
  id: "e_002",
  nombre: "Bruno",
  apellido: "Soto",
  cost_center: "sales_team",
};

/** Sample employee from core engineering (food is prohibited). */
export const engineeringEmployee: Empleado = {
  id: "e_001",
  nombre: "Ana",
  apellido: "Reyes",
  cost_center: "core_engineering",
};

type GastoOverrides = Partial<Omit<Gasto, "monto">> & { monto?: Decimal.Value };

/**
 * Creates a test expense with sensible defaults, overridable per field.
 * @param overrides - Partial fields to merge onto the default expense.
 */
export function createGasto(overrides: GastoOverrides = {}): Gasto {
  const { monto, ...rest } = overrides;

  return {
    id: "g_test",
    monto: toMoney(monto ?? 50),
    moneda: "USD",
    fecha: "2026-06-04",
    categoria: "food",
    ...rest,
  };
}

/**
 * Builds a rate table from numeric literals for use in tests.
 * @param rates - Currency codes mapped to rates relative to the base currency.
 */
export function toRateTable(
  rates: Record<string, Decimal.Value>,
): Record<string, Money> {
  return Object.fromEntries(
    Object.entries(rates).map(([currency, rate]) => [currency, toMoney(rate)]),
  );
}

/** Mock exchange rates (USD-based) used in unit tests. */
export const mockExchangeRates = toRateTable({
  CLP: 900,
  MXN: 20,
  EUR: 0.92,
});

/** Identity converter for rules that do not use currency conversion. */
export const noopConvertToBaseCurrency: RuleContext["convertToBaseCurrency"] = (
  amount,
) => amount;

/** Simple CLP/USD mock converter used by category-limit rule tests. */
export const mockConvertToBaseCurrency: RuleContext["convertToBaseCurrency"] = (
  amount,
  fromCurrency,
) => {
  if (fromCurrency === "USD") {
    return amount;
  }
  if (fromCurrency === "CLP") {
    return roundMoney(amount.div(900));
  }
  return amount;
};

/** Fixed reference date used across tests for deterministic age calculations. */
export const referenceDate = new Date("2026-06-19T12:00:00.000Z");
