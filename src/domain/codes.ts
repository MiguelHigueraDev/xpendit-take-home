/** Standard alert codes emitted by validation rules. */
export const ALERT_CODES = {
  LIMITE_ANTIGUEDAD: "LIMITE_ANTIGUEDAD",
  LIMITE_CATEGORIA: "LIMITE_CATEGORIA",
  POLITICA_CENTRO_COSTO: "POLITICA_CENTRO_COSTO",
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
  aprobadoHasta: number,
  monedaBase: string,
): string {
  return `Gasto de '${categoria}' excede el límite aprobado de ${aprobadoHasta} ${monedaBase}. Requiere revisión.`;
}

/**
 * Builds the RECHAZADO alert message for the category limit rule.
 * @param categoria - Expense category.
 * @param pendienteHasta - Maximum allowed amount in base currency.
 * @param monedaBase - Policy base currency code.
 */
export function buildLimiteCategoriaRechazadoMessage(
  categoria: string,
  pendienteHasta: number,
  monedaBase: string,
): string {
  return `Gasto de '${categoria}' excede el límite de ${pendienteHasta} ${monedaBase}. Excede límite aprobado.`;
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
