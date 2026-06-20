import type { BatchAnalysisReport } from "./types.js";

/**
 * Renders a concise console summary of the batch analysis.
 * @param report - Aggregated analysis report.
 */
export function renderConsoleSummary(report: BatchAnalysisReport): string {
  const lines = [
    "=== Análisis de Gastos Históricos ===",
    `Fecha de referencia: ${report.referenceDate}`,
    `Filas válidas: ${report.validRows} / ${report.totalCsvRows}`,
    "",
    "Desglose por estado:",
    `  APROBADO:  ${report.statusBreakdown.APROBADO}`,
    `  PENDIENTE: ${report.statusBreakdown.PENDIENTE}`,
    `  RECHAZADO: ${report.statusBreakdown.RECHAZADO}`,
    "",
    "Anomalías:",
    `  Duplicados exactos: ${report.duplicateGroups.length} grupos`,
    `  Montos negativos:   ${report.negativeAmountIds.length}`,
    "",
    "Optimización de tasas de cambio:",
    `  Fechas únicas: ${report.rateResolution.uniqueDates.length}`,
    `  Llamadas API (live): ${report.rateResolution.apiCallCount}`,
    `  Fechas con fallback: ${report.rateResolution.fallbackDates.length}`,
  ];

  if (report.malformedRows.length > 0) {
    lines.push("", `Filas malformadas: ${report.malformedRows.length}`);
  }

  return lines.join("\n");
}

/**
 * Renders the ANALISIS.md markdown report.
 * @param report - Aggregated analysis report.
 */
export function renderAnalysisMarkdown(report: BatchAnalysisReport): string {
  const duplicateExamples = report.duplicateGroups
    .slice(0, 5)
    .map(
      (group) =>
        `- **${group.monto.toString()} ${group.moneda}** el ${group.fecha}: ${group.gasto_ids.join(", ")}`,
    )
    .join("\n");

  const negativeExamples =
    report.negativeAmountIds.length > 0
      ? report.negativeAmountIds
          .slice(0, 10)
          .map((id) => `- \`${id}\``)
          .join("\n")
      : "_No se encontraron montos negativos en este lote._";

  const malformedSection =
    report.malformedRows.length > 0
      ? report.malformedRows
          .map(
            (error) =>
              `- Fila ${error.rowNumber}${error.gasto_id ? ` (\`${error.gasto_id}\`)` : ""}: ${error.message}`,
          )
          .join("\n")
      : "_No se encontraron filas malformadas._";

  const rejectedExamples = report.results
    .filter((result) => result.validation.status === "RECHAZADO")
    .slice(0, 5)
    .map((result) => {
      const alertas = result.validation.alertas
        .map((alerta) => alerta.codigo)
        .join(", ");
      const anomalyCodes = result.anomalies
        .map((anomaly) => anomaly.alerta.codigo)
        .join(", ");
      const extras = [alertas, anomalyCodes].filter(Boolean).join("; ");
      return `- \`${result.gasto_id}\`${extras ? `: ${extras}` : ""}`;
    })
    .join("\n");

  const pendingExamples = report.results
    .filter((result) => result.validation.status === "PENDIENTE")
    .slice(0, 5)
    .map((result) => {
      const alertas = result.validation.alertas
        .map((alerta) => alerta.codigo)
        .join(", ");
      return `- \`${result.gasto_id}\`${alertas ? `: ${alertas}` : ""}`;
    })
    .join("\n");

  return `# Análisis de Gastos Históricos

## Resumen

- **Fecha de referencia:** ${report.referenceDate}
- **Filas procesadas:** ${report.validRows} válidas de ${report.totalCsvRows} totales
- **Filas malformadas:** ${report.malformedRows.length}

## Desglose por estado

| Estado | Cantidad |
|--------|----------|
| APROBADO | ${report.statusBreakdown.APROBADO} |
| PENDIENTE | ${report.statusBreakdown.PENDIENTE} |
| RECHAZADO | ${report.statusBreakdown.RECHAZADO} |

## Anomalías detectadas

### Duplicados exactos (${report.duplicateGroups.length} grupos)

Gastos con mismo monto, moneda y fecha:

${duplicateExamples || "_No se encontraron duplicados exactos._"}

### Montos negativos (${report.negativeAmountIds.length})

${negativeExamples}

## Ejemplos por estado

### RECHAZADOS (muestra)

${rejectedExamples || "_Ninguno._"}

### PENDIENTES (muestra)

${pendingExamples || "_Ninguno._"}

## Filas malformadas

${malformedSection}

## Optimización de llamadas a Open Exchange Rates (Bonus)

En lugar de hacer una llamada a la API por cada fila del CSV (problema N+1), el analizador:

1. Agrupa los gastos por \`fecha\` única (${report.rateResolution.uniqueDates.length} fechas distintas).
2. Llama a \`ExchangeRateService.getProviderForDate()\` **una vez por fecha** (${report.rateResolution.apiCallCount} llamadas live).
3. Reutiliza el \`RateProvider\` cacheado para todas las filas de esa fecha.

| Métrica | Valor |
|---------|-------|
| Filas válidas | ${report.validRows} |
| Fechas únicas | ${report.rateResolution.uniqueDates.length} |
| Llamadas API (live) | ${report.rateResolution.apiCallCount} |
| Fechas con fallback | ${report.rateResolution.fallbackDates.length} |
| Ahorro vs N+1 | ${report.validRows - report.rateResolution.apiCallCount} llamadas evitadas |

En modo \`--mock\`, se usan tasas locales desde \`data/fallback-rates.json\` en lugar de la API.

## Notas para el video (≤ 1 min)

1. Presentar el desglose: ${report.statusBreakdown.APROBADO} APROBADOS, ${report.statusBreakdown.PENDIENTE} PENDIENTES, ${report.statusBreakdown.RECHAZADO} RECHAZADOS.
2. Mostrar duplicados: p.ej. \`g_042\`, \`g_043\`, \`g_044\` (90 USD, 2026-06-09).
3. Explicar optimización: ${report.validRows} filas → ${report.rateResolution.uniqueDates.length} fechas → ${report.rateResolution.apiCallCount} llamadas API.
`;
}
