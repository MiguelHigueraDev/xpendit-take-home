import type { Money } from "./money.js";
import { formatMoney } from "./money.js";

/** Standard alert codes emitted by validation rules. */
export const ALERT_CODES = {
  LIMITE_ANTIGUEDAD: "LIMITE_ANTIGUEDAD",
  LIMITE_CATEGORIA: "LIMITE_CATEGORIA",
  POLITICA_CENTRO_COSTO: "POLITICA_CENTRO_COSTO",
  ANOMALIA_DUPLICADO: "ANOMALIA_DUPLICADO",
  ANOMALIA_MONTO_NEGATIVO: "ANOMALIA_MONTO_NEGATIVO",
} as const;

/** Union of all known alert code values. */
export type AlertCode = (typeof ALERT_CODES)[keyof typeof ALERT_CODES];

/**
 * Builds the PENDIENTE alert message for the age rule.
 * @param pendienteDias - Number of days before an expense requires review.
 */
export function buildLimiteAntiguedadMessage(pendienteDias: number): string {
  return `Gasto excede los ${pendienteDias} días. Requiere revisión.`;
}

/**
 * Builds the RECHAZADO alert message for the age rule.
 * @param rechazadoDias - Number of days after which an expense is rejected.
 */
export function buildLimiteAntiguedadRechazadoMessage(
  rechazadoDias: number,
): string {
  return `Gasto excede los ${rechazadoDias} días. Rechazado por antigüedad.`;
}

/**
 * Builds the PENDIENTE alert message for the category limit rule.
 * @param categoria - Expense category.
 * @param aprobadoHasta - Auto-approval limit in base currency.
 * @param monedaBase - Policy base currency code.
 */
export function buildLimiteCategoriaPendienteMessage(
  categoria: string,
  aprobadoHasta: Money,
  monedaBase: string,
): string {
  return `Gasto de '${categoria}' excede el límite aprobado de ${formatMoney(aprobadoHasta)} ${monedaBase}. Requiere revisión.`;
}

/**
 * Builds the RECHAZADO alert message for the category limit rule.
 * @param categoria - Expense category.
 * @param pendienteHasta - Maximum allowed amount in base currency.
 * @param monedaBase - Policy base currency code.
 */
export function buildLimiteCategoriaRechazadoMessage(
  categoria: string,
  pendienteHasta: Money,
  monedaBase: string,
): string {
  return `Gasto de '${categoria}' excede el límite de ${formatMoney(pendienteHasta)} ${monedaBase}. Excede límite aprobado.`;
}

/**
 * Builds the RECHAZADO alert message for the cost-center cross rule.
 * @param costCenter - Employee cost center.
 * @param categoria - Prohibited expense category.
 */
export function buildPoliticaCentroCostoMessage(
  costCenter: string,
  categoria: string,
): string {
  return `El C.C. '${costCenter}' no puede reportar '${categoria}'.`;
}

/**
 * Builds an alert message for an exact duplicate expense.
 * @param gastoIds - IDs of all expenses in the duplicate group.
 */
export function buildAnomaliaDuplicadoMessage(gastoIds: string[]): string {
  return `Gasto duplicado exacto detectado. IDs relacionados: ${gastoIds.join(", ")}.`;
}

/**
 * Builds an alert message for a negative expense amount.
 * @param monto - The invalid negative amount.
 */
export function buildAnomaliaMontoNegativoMessage(monto: Money): string {
  return `Monto negativo detectado: ${formatMoney(monto)}.`;
}
