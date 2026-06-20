export const ALERT_CODES = {
  LIMITE_ANTIGUEDAD: "LIMITE_ANTIGUEDAD",
  LIMITE_CATEGORIA: "LIMITE_CATEGORIA",
  POLITICA_CENTRO_COSTO: "POLITICA_CENTRO_COSTO",
} as const;

export type AlertCode = (typeof ALERT_CODES)[keyof typeof ALERT_CODES];

export function buildLimiteAntiguedadMessage(pendienteDias: number): string {
  return `Gasto excede los ${pendienteDias} días. Requiere revisión.`;
}

export function buildLimiteAntiguedadRechazadoMessage(
  rechazadoDias: number,
): string {
  return `Gasto excede los ${rechazadoDias} días. Rechazado por antigüedad.`;
}

export function buildLimiteCategoriaPendienteMessage(
  categoria: string,
  aprobadoHasta: number,
  monedaBase: string,
): string {
  return `Gasto de '${categoria}' excede el límite aprobado de ${aprobadoHasta} ${monedaBase}. Requiere revisión.`;
}

export function buildLimiteCategoriaRechazadoMessage(
  categoria: string,
  pendienteHasta: number,
  monedaBase: string,
): string {
  return `Gasto de '${categoria}' excede el límite de ${pendienteHasta} ${monedaBase}. Excede límite aprobado.`;
}

export function buildPoliticaCentroCostoMessage(
  costCenter: string,
  categoria: string,
): string {
  return `El C.C. '${costCenter}' no puede reportar '${categoria}'.`;
}
