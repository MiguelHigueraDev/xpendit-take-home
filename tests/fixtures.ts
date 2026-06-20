import type { Empleado, Gasto, Politica } from "../src/domain/types.js";

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

export const salesEmployee: Empleado = {
  id: "e_002",
  nombre: "Bruno",
  apellido: "Soto",
  cost_center: "sales_team",
};

export const engineeringEmployee: Empleado = {
  id: "e_001",
  nombre: "Ana",
  apellido: "Reyes",
  cost_center: "core_engineering",
};

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

export const mockExchangeRates: Record<string, number> = {
  CLP: 900,
  MXN: 20,
  EUR: 0.92,
};

export const referenceDate = new Date("2026-06-19T12:00:00.000Z");
