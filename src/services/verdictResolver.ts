import type { Alerta, Estado, RuleVerdict } from "../domain/types.js";

const STATUS_PRIORITY: Record<Estado, number> = {
  RECHAZADO: 3,
  PENDIENTE: 2,
  APROBADO: 1,
};

/**
 * Aggregates partial rule verdicts into a final status and alert list.
 *
 * Priority: RECHAZADO > PENDIENTE > APROBADO.
 * When no rules apply, defaults to PENDIENTE with no alerts.
 *
 * @param verdicts - Partial outcomes from all triggered rules.
 * @returns Final status and all alerts from triggered rules.
 */
export function resolveVerdicts(verdicts: RuleVerdict[]): {
  status: Estado;
  alertas: Alerta[];
} {
  if (verdicts.length === 0) {
    return { status: "PENDIENTE", alertas: [] };
  }

  const alertas = verdicts
    .map((verdict) => verdict.alerta)
    .filter((alerta): alerta is Alerta => alerta !== undefined);

  const highestPriorityVerdict = verdicts.reduce((current, next) =>
    STATUS_PRIORITY[next.status] > STATUS_PRIORITY[current.status]
      ? next
      : current,
  );

  return {
    status: highestPriorityVerdict.status,
    alertas,
  };
}
