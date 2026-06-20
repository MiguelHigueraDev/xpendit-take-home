import { parse } from "csv-parse/sync";
import { z } from "zod";
import { empleadoSchema, gastoSchema } from "../domain/schemas.js";
import { moneySchema } from "../domain/money.js";
import { isoDateStringSchema } from "../validation/primitives.js";
import type { CsvRowError, ParsedExpenseRow } from "./types.js";

/** Raw CSV row shape from gastos_historicos.csv. */
export const csvRowSchema = z.object({
  gasto_id: z.string().trim().min(1),
  empleado_id: z.string().trim().min(1),
  empleado_nombre: z.string().trim().min(1),
  empleado_apellido: z.string().trim().min(1),
  empleado_cost_center: z.string().trim().min(1),
  categoria: z.string().trim().min(1),
  monto: moneySchema,
  moneda: z.string().trim().min(1),
  fecha: isoDateStringSchema,
});

export type CsvRow = z.infer<typeof csvRowSchema>;

/** Result of loading and validating a CSV file. */
export interface CsvLoadResult {
  rows: ParsedExpenseRow[];
  errors: CsvRowError[];
}

/**
 * Parses CSV content into validated expense rows.
 * Malformed rows are collected as errors; negative amounts are allowed.
 *
 * @param csvContent - Raw CSV file contents.
 */
export function loadExpensesFromCsv(csvContent: string): CsvLoadResult {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows: ParsedExpenseRow[] = [];
  const errors: CsvRowError[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const parsed = csvRowSchema.safeParse(record);

    if (!parsed.success) {
      errors.push({
        rowNumber,
        gasto_id: record.gasto_id,
        message: parsed.error.issues.map((issue) => issue.message).join("; "),
      });
      return;
    }

    const row = parsed.data;
    const gastoResult = gastoSchema.safeParse({
      id: row.gasto_id,
      monto: row.monto,
      moneda: row.moneda,
      fecha: row.fecha,
      categoria: row.categoria,
    });
    const empleadoResult = empleadoSchema.safeParse({
      id: row.empleado_id,
      nombre: row.empleado_nombre,
      apellido: row.empleado_apellido,
      cost_center: row.empleado_cost_center,
    });

    if (!gastoResult.success || !empleadoResult.success) {
      const messages = [
        ...(gastoResult.success ? [] : gastoResult.error.issues.map((i) => i.message)),
        ...(empleadoResult.success ? [] : empleadoResult.error.issues.map((i) => i.message)),
      ];
      errors.push({
        rowNumber,
        gasto_id: row.gasto_id,
        message: messages.join("; "),
      });
      return;
    }

    rows.push({
      rowNumber,
      gasto: gastoResult.data,
      empleado: empleadoResult.data,
    });
  });

  return { rows, errors };
}
