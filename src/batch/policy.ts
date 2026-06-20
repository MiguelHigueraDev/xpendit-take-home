import { parsePolitica } from "../domain/schemas.js";
import type { Politica } from "../domain/types.js";

const defaultPoliticaDefinition = {
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
} as const;

/** Default expense policy from the Xpendit challenge specification (deep-frozen). */
export const defaultPolitica: Politica = parsePolitica(defaultPoliticaDefinition);

/** Reference date used for age calculations in batch analysis (reproducible). */
export const defaultReferenceDate = new Date("2026-06-19T00:00:00.000Z");
