import type { Politica } from "../domain/types.js";
import { parsePolitica } from "../domain/schemas.js";
import type { Clock } from "../services/clock.js";
import { FixedClock } from "../services/clock.js";
import { ExpenseValidator } from "../services/expenseValidator.js";
import {
  detectAnomalies,
  getAnomaliesForGasto,
} from "./anomalyDetector.js";
import type { RateResolver } from "./batchRateResolver.js";
import { loadExpensesFromCsv } from "./csvLoader.js";
import { defaultPolitica, defaultReferenceDate } from "./policy.js";
import type {
  BatchAnalysisReport,
  RowAnalysisResult,
} from "./types.js";
import type { Estado } from "../domain/types.js";

/** Options for {@link BatchAnalyzer}. */
export interface BatchAnalyzerOptions {
  politica?: Politica;
  clock?: Clock;
  rateResolver: RateResolver;
}

/** Orchestrates CSV loading, rate resolution, validation, and anomaly detection. */
export class BatchAnalyzer {
  private readonly politica: Politica;
  private readonly clock: Clock;
  private readonly rateResolver: RateResolver;

  constructor(options: BatchAnalyzerOptions) {
    this.politica = options.politica
      ? parsePolitica(options.politica)
      : defaultPolitica;
    this.clock = options.clock ?? new FixedClock(defaultReferenceDate);
    this.rateResolver = options.rateResolver;
  }

  /**
   * Analyzes all expenses in a CSV file.
   * @param csvContent - Raw CSV contents.
   */
  async analyze(csvContent: string): Promise<BatchAnalysisReport> {
    const { rows, errors } = loadExpensesFromCsv(csvContent);
    const anomalyResult = detectAnomalies(rows);
    const dates = rows.map((row) => row.gasto.fecha);
    const rateResolution = await this.rateResolver.resolve(dates);

    const statusBreakdown: Record<Estado, number> = {
      APROBADO: 0,
      PENDIENTE: 0,
      RECHAZADO: 0,
    };

    const validatorsByDate = new Map<string, ExpenseValidator>();
    for (const [fecha, rateProvider] of rateResolution.providersByDate) {
      validatorsByDate.set(
        fecha,
        new ExpenseValidator({
          clock: this.clock,
          rateProvider,
        }),
      );
    }

    const results: RowAnalysisResult[] = [];

    for (const row of rows) {
      const validator = validatorsByDate.get(row.gasto.fecha);
      if (!validator) {
        throw new Error(`No rate provider found for date ${row.gasto.fecha}`);
      }

      const validation = validator.validate(
        row.gasto,
        row.empleado,
        this.politica,
      );
      const anomalies = getAnomaliesForGasto(
        anomalyResult.anomaliesByGastoId,
        row.gasto.id,
      );

      statusBreakdown[validation.status] += 1;
      results.push({
        gasto_id: row.gasto.id,
        validation,
        anomalies,
      });
    }

    return {
      referenceDate: this.clock.now().toISOString().slice(0, 10),
      totalCsvRows: rows.length + errors.length,
      validRows: rows.length,
      malformedRows: errors,
      statusBreakdown,
      results,
      duplicateGroups: anomalyResult.duplicateGroups,
      negativeAmountIds: anomalyResult.negativeAmountIds,
      rateResolution,
    };
  }
}
