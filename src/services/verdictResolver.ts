import { z } from "zod";
import type { Alerta, Estado, RuleVerdict } from "../domain/types.js";
import { alertaSchema, estadoSchema } from "../domain/schemas.js";
import { parseOrThrow } from "../validation/parse.js";

const STATUS_PRIORITY: Record<Estado, number> = {
  RECHAZADO: 3,
  PENDIENTE: 2,
  APROBADO: 1,
};

const resolveVerdictsInputSchema = z.array(
  z.object({
    status: estadoSchema,
    alerta: alertaSchema.optional(),
  }),
);

/**
 * Aggregates partial rule verdicts into a final status and alert list.
 *
 * Priority: RECHAZADO > PENDIENTE > APROBADO.
 * When no rules apply, defaults to PENDIENTE with no alerts.
 *
 * @param verdicts - Partial outcomes from all triggered rules.
 * @returns Final status and all alerts from triggered rules.
 * @throws {ValidationError} When verdicts contain invalid statuses or alerts.
 */
export function resolveVerdicts(verdicts: RuleVerdict[]): {
  status: Estado;
  alertas: Alerta[];
} {
  const validatedVerdicts = parseOrThrow(resolveVerdictsInputSchema, verdicts);

  if (validatedVerdicts.length === 0) {
    return { status: "PENDIENTE", alertas: [] };
  }

  const alertas = validatedVerdicts
    .map((verdict) => verdict.alerta)
    .filter((alerta): alerta is Alerta => alerta !== undefined);

  const highestPriorityVerdict = validatedVerdicts.reduce((current, next) =>
    STATUS_PRIORITY[next.status] > STATUS_PRIORITY[current.status]
      ? next
      : current,
  );

  return {
    status: highestPriorityVerdict.status,
    alertas,
  };
}
