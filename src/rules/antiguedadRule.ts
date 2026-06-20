import {
  ALERT_CODES,
  buildLimiteAntiguedadMessage,
  buildLimiteAntiguedadRechazadoMessage,
} from "../domain/codes.js";
import type { Rule, RuleContext } from "../domain/types.js";
import { daysBetween, parseIsoDate } from "../services/clock.js";

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
