import type { Alerta, Estado, RuleVerdict } from "../domain/types.js";

const STATUS_PRIORITY: Record<Estado, number> = {
  RECHAZADO: 3,
  PENDIENTE: 2,
  APROBADO: 1,
};

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
