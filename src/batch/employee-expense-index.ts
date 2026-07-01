import type { Gasto } from "../domain/types.js";
import type { ParsedExpenseRow } from "./types.js";

/**
 * Groups validated CSV rows by employee id for rolling-window limit checks.
 *
 * ponytail: O(n) scan per lookup if callers filter inline; upgrade to Map<employeeId, Gasto[]>.
 */
export function buildEmployeeExpenseIndex(
  rows: ParsedExpenseRow[],
): Map<string, Gasto[]> {
  const index = new Map<string, Gasto[]>();

  for (const row of rows) {
    const existing = index.get(row.empleado.id) ?? [];
    existing.push(row.gasto);
    index.set(row.empleado.id, existing);
  }

  return index;
}

/**
 * Returns all expenses for an employee from a pre-built index.
 */
export function getEmployeeExpenses(
  index: Map<string, Gasto[]>,
  employeeId: string,
): Gasto[] {
  return index.get(employeeId) ?? [];
}
