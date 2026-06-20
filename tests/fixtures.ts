import type { Empleado, Gasto, Politica } from "../src/domain/types.js";

/** Default expense policy matching the Xpendit challenge specification. */
export const defaultPolitica: Politica = {
  moneda_base: "USD",
  limite_antiguedad: {
    pendiente_dias: 30,
    rechazado_dias: 60,
  },
  limites_por_categoria: {
    food: {
      aprobado_hasta: 100,
      pendiente_hasta: 150,
    },
    transport: {
      aprobado_hasta: 200,
      pendiente_hasta: 200,
    },
  },
  reglas_centro_costo: [
    {
      cost_center: "core_engineering",
      categoria_prohibida: "food",
    },
  ],
};

/** Sample employee from the sales team (allowed to report food). */
export const salesEmployee: Empleado = {
  id: "e_002",
  nombre: "Bruno",
  apellido: "Soto",
  cost_center: "sales_team",
};

/** Sample employee from core engineering (food is prohibited). */
export const engineeringEmployee: Empleado = {
  id: "e_001",
  nombre: "Ana",
  apellido: "Reyes",
  cost_center: "core_engineering",
};

/**
 * Creates a test expense with sensible defaults, overridable per field.
 * @param overrides - Partial fields to merge onto the default expense.
 */
export function createGasto(overrides: Partial<Gasto> = {}): Gasto {
  return {
    id: "g_test",
    monto: 50,
    moneda: "USD",
    fecha: "2026-06-04",
    categoria: "food",
    ...overrides,
  };
}

/** Mock exchange rates (USD-based) used in unit tests. */
export const mockExchangeRates: Record<string, number> = {
  CLP: 900,
  MXN: 20,
  EUR: 0.92,
};

/** Fixed reference date used across tests for deterministic age calculations. */
export const referenceDate = new Date("2026-06-19T12:00:00.000Z");
