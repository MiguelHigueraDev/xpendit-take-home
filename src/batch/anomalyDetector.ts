import {
  ALERT_CODES,
  buildAnomaliaDuplicadoMessage,
  buildAnomaliaMontoNegativoMessage,
} from "../domain/codes.js";
import type { Anomaly, DuplicateGroup, ParsedExpenseRow } from "./types.js";

/** Result of anomaly detection over parsed rows. */
export interface AnomalyDetectionResult {
  anomaliesByGastoId: Map<string, Anomaly[]>;
  duplicateGroups: DuplicateGroup[];
  negativeAmountIds: string[];
}

function duplicateKey(monto: number, moneda: string, fecha: string): string {
  return `${monto}|${moneda}|${fecha}`;
}

/**
 * Detects exact duplicates (same monto, moneda, fecha) and negative amounts.
 * Does not alter policy validation status.
 *
 * @param rows - Parsed expense rows from the CSV loader.
 */
export function detectAnomalies(rows: ParsedExpenseRow[]): AnomalyDetectionResult {
  const anomaliesByGastoId = new Map<string, Anomaly[]>();
  const duplicateGroups: DuplicateGroup[] = [];
  const negativeAmountIds: string[] = [];

  const groups = new Map<string, ParsedExpenseRow[]>();
  for (const row of rows) {
    const key = duplicateKey(row.gasto.monto, row.gasto.moneda, row.gasto.fecha);
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }

  for (const groupRows of groups.values()) {
    if (groupRows.length <= 1) {
      continue;
    }

    const sample = groupRows[0]!.gasto;
    const gastoIds = groupRows.map((row) => row.gasto.id);
    duplicateGroups.push({
      monto: sample.monto,
      moneda: sample.moneda,
      fecha: sample.fecha,
      gasto_ids: gastoIds,
    });

    for (const row of groupRows) {
      const anomaly: Anomaly = {
        gasto_id: row.gasto.id,
        tipo: "DUPLICADO_EXACTO",
        alerta: {
          codigo: ALERT_CODES.ANOMALIA_DUPLICADO,
          mensaje: buildAnomaliaDuplicadoMessage(gastoIds),
        },
      };
      const existing = anomaliesByGastoId.get(row.gasto.id) ?? [];
      existing.push(anomaly);
      anomaliesByGastoId.set(row.gasto.id, existing);
    }
  }

  for (const row of rows) {
    if (row.gasto.monto < 0) {
      negativeAmountIds.push(row.gasto.id);
      const anomaly: Anomaly = {
        gasto_id: row.gasto.id,
        tipo: "MONTO_NEGATIVO",
        alerta: {
          codigo: ALERT_CODES.ANOMALIA_MONTO_NEGATIVO,
          mensaje: buildAnomaliaMontoNegativoMessage(row.gasto.monto),
        },
      };
      const existing = anomaliesByGastoId.get(row.gasto.id) ?? [];
      existing.push(anomaly);
      anomaliesByGastoId.set(row.gasto.id, existing);
    }
  }

  return { anomaliesByGastoId, duplicateGroups, negativeAmountIds };
}

/** Returns all anomalies for a given expense ID. */
export function getAnomaliesForGasto(
  anomaliesByGastoId: Map<string, Anomaly[]>,
  gastoId: string,
): Anomaly[] {
  return anomaliesByGastoId.get(gastoId) ?? [];
}
