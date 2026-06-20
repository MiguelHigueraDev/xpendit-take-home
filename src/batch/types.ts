import type { Alerta, Empleado, Estado, Gasto, ValidationResult } from "../domain/types.js";
import type { Money } from "../domain/money.js";

/** A successfully parsed CSV row with expense and employee data. */
export interface ParsedExpenseRow {
  /** 1-based row number in the source CSV (excluding header). */
  rowNumber: number;
  gasto: Gasto;
  empleado: Empleado;
}

/** Error encountered while parsing a CSV row. */
export interface CsvRowError {
  rowNumber: number;
  gasto_id?: string;
  message: string;
}

/** Detected anomaly type. */
export type AnomalyType = "DUPLICADO_EXACTO" | "MONTO_NEGATIVO";

/** Anomaly flagged on a specific expense. */
export interface Anomaly {
  gasto_id: string;
  tipo: AnomalyType;
  alerta: Alerta;
}

/** Group of expenses sharing identical monto, moneda, and fecha. */
export interface DuplicateGroup {
  monto: Money;
  moneda: string;
  fecha: string;
  gasto_ids: string[];
}

/** Result of resolving rate providers for a batch of dates. */
export interface BatchRateResolution {
  providersByDate: Map<string, import("../services/rate-provider.js").RateProvider>;
  uniqueDates: string[];
  liveDates: string[];
  fallbackDates: string[];
  apiCallCount: number;
}

/** Analysis result for a single expense row. */
export interface RowAnalysisResult {
  gasto_id: string;
  validation: ValidationResult;
  anomalies: Anomaly[];
}

/** Aggregated batch analysis report. */
export interface BatchAnalysisReport {
  referenceDate: string;
  totalCsvRows: number;
  validRows: number;
  malformedRows: CsvRowError[];
  statusBreakdown: Record<Estado, number>;
  results: RowAnalysisResult[];
  duplicateGroups: DuplicateGroup[];
  negativeAmountIds: string[];
  rateResolution: BatchRateResolution;
}
