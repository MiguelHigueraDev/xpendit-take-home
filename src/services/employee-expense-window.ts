import type { Money } from "../domain/money.js";
import { toMoney } from "../domain/money.js";
import type { Gasto } from "../domain/types.js";
import { daysBetween, parseIsoDate } from "./clock.js";

/**
 * Returns expenses from the same employee whose dates fall within the rolling
 * window ending on `windowEnd` (inclusive).
 *
 * @param gastosEmpleado - Prior expenses for the employee (may include `gastoActual`).
 * @param windowEnd - Last day of the rolling window (typically the current expense date).
 * @param ventanaDias - Window length in calendar days.
 * @param gastoActual - Expense currently being validated.
 */
export function filterExpensesInRollingWindow(
  gastosEmpleado: Gasto[],
  windowEnd: Date,
  ventanaDias: number,
  gastoActual: Gasto,
): Gasto[] {
  const inWindow = gastosEmpleado.filter((gasto) => {
    if (gasto.id === gastoActual.id) {
      return false;
    }

    const expenseDate = parseIsoDate(gasto.fecha);
    const daysFromEnd = daysBetween(expenseDate, windowEnd);

    return daysFromEnd >= 0 && daysFromEnd <= ventanaDias;
  });

  return [...inWindow, gastoActual];
}

/**
 * Sums expense amounts converted to the policy base currency.
 *
 * @param gastos - Expenses to aggregate.
 * @param convertToBaseCurrency - FX converter from {@link RuleContext}.
 */
export function sumExpensesInBaseCurrency(
  gastos: Gasto[],
  convertToBaseCurrency: (amount: Money, fromCurrency: string) => Money,
): Money {
  return gastos.reduce((total, gasto) => {
    const montoBase = convertToBaseCurrency(gasto.monto, gasto.moneda);
    return total.plus(montoBase);
  }, toMoney(0));
}
