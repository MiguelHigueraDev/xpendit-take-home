import {
  ALERT_CODES,
  buildLimiteCategoriaPendienteMessage,
  buildLimiteCategoriaRechazadoMessage,
} from "../domain/codes.js";
import type { Rule, RuleContext } from "../domain/types.js";

export const evaluateLimiteCategoriaRule: Rule = (context: RuleContext) => {
  const { gasto, politica, convertToBaseCurrency } = context;
  const limite = politica.limites_por_categoria[gasto.categoria];

  if (!limite) {
    return null;
  }

  const montoBase = convertToBaseCurrency(gasto.monto, gasto.moneda);
  const { aprobado_hasta, pendiente_hasta } = limite;

  if (montoBase <= aprobado_hasta) {
    return { status: "APROBADO" };
  }

  if (montoBase <= pendiente_hasta) {
    return {
      status: "PENDIENTE",
      alerta: {
        codigo: ALERT_CODES.LIMITE_CATEGORIA,
        mensaje: buildLimiteCategoriaPendienteMessage(
          gasto.categoria,
          aprobado_hasta,
          politica.moneda_base,
        ),
      },
    };
  }

  return {
    status: "RECHAZADO",
    alerta: {
      codigo: ALERT_CODES.LIMITE_CATEGORIA,
      mensaje: buildLimiteCategoriaRechazadoMessage(
        gasto.categoria,
        pendiente_hasta,
        politica.moneda_base,
      ),
    },
  };
};
