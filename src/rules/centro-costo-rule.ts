import {
  ALERT_CODES,
  buildPoliticaCentroCostoMessage,
} from "../domain/codes.js";
import type { Rule, RuleContext } from "../domain/types.js";

/**
 * Cost-center cross rule: rejects expenses where a category is prohibited
 * for the employee's cost center.
 *
 * Returns `null` when no matching prohibition exists in the policy.
 */
export const evaluateCentroCostoRule: Rule = (context: RuleContext) => {
  const { gasto, empleado, politica } = context;

  const matchingRule = politica.reglas_centro_costo.find(
    (rule) =>
      rule.cost_center === empleado.cost_center &&
      rule.categoria_prohibida === gasto.categoria,
  );

  if (!matchingRule) {
    return null;
  }

  return {
    status: "RECHAZADO",
    alerta: {
      codigo: ALERT_CODES.POLITICA_CENTRO_COSTO,
      mensaje: buildPoliticaCentroCostoMessage(
        empleado.cost_center,
        gasto.categoria,
      ),
    },
  };
};
