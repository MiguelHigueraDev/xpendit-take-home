import {
  ALERT_CODES,
  buildLimiteAntiguedadMessage,
  buildLimiteAntiguedadRechazadoMessage,
} from "../domain/codes.js";
import type { Rule, RuleContext } from "../domain/types.js";
import { daysBetween, parseIsoDate } from "../services/clock.js";

/**
 * Age rule: validates how old an expense is relative to the reference date.
 *
 * - 0 to `pendiente_dias` → APROBADO
 * - `pendiente_dias + 1` to `rechazado_dias` → PENDIENTE
 * - beyond `rechazado_dias` → RECHAZADO
 */
export const evaluateAntiguedadRule: Rule = (context: RuleContext) => {
  const { gasto, politica, referenceDate } = context;
  const expenseDate = parseIsoDate(gasto.fecha);
  const days = daysBetween(expenseDate, referenceDate);
  const { pendiente_dias, rechazado_dias } = politica.limite_antiguedad;

  if (days <= pendiente_dias) {
    return { status: "APROBADO" };
  }

  if (days <= rechazado_dias) {
    return {
      status: "PENDIENTE",
      alerta: {
        codigo: ALERT_CODES.LIMITE_ANTIGUEDAD,
        mensaje: buildLimiteAntiguedadMessage(pendiente_dias),
      },
    };
  }

  return {
    status: "RECHAZADO",
    alerta: {
      codigo: ALERT_CODES.LIMITE_ANTIGUEDAD,
      mensaje: buildLimiteAntiguedadRechazadoMessage(rechazado_dias),
    },
  };
};
