import {
  ALERT_CODES,
  buildLimiteMensualExcedidoMessage,
} from "../domain/codes.js";
import type { Rule, RuleContext } from "../domain/types.js";
import { parseIsoDate } from "../services/clock.js";
import {
  filterExpensesInRollingWindow,
  sumExpensesInBaseCurrency,
} from "../services/employee-expense-window.js";

/**
 * Monthly rolling limit rule: rejects when an employee's expenses in a rolling
 * window exceed the configured total.
 *
 * - total ≤ `limite_total` → APROBADO
 * - total > `limite_total` → RECHAZADO with {@link ALERT_CODES.LIMITE_MENSUAL_EXCEDIDO}
 *
 * Requires {@link RuleContext.gastosEmpleado} for prior expenses from the same
 * employee. When omitted, only the current expense is counted.
 */
export const evaluateLimiteMensualRule: Rule = (context: RuleContext) => {
  const {
    gasto,
    politica,
    convertToBaseCurrency,
    gastosEmpleado = [],
  } = context;
  const { limite_total, ventana_dias } = politica.limite_mensual;
  const windowEnd = parseIsoDate(gasto.fecha);

  const gastosEnVentana = filterExpensesInRollingWindow(
    gastosEmpleado,
    windowEnd,
    ventana_dias,
    gasto,
  );

  const totalBase = sumExpensesInBaseCurrency(
    gastosEnVentana,
    convertToBaseCurrency,
  );

  if (totalBase.lte(limite_total)) {
    return { status: "APROBADO" };
  }

  return {
    status: "RECHAZADO",
    alerta: {
      codigo: ALERT_CODES.LIMITE_MENSUAL_EXCEDIDO,
      mensaje: buildLimiteMensualExcedidoMessage(
        limite_total,
        ventana_dias,
        politica.moneda_base,
      ),
    },
  };
};
