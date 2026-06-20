import { z } from "zod";
import { parseOrThrow } from "../validation/parse.js";
import { currencyCodeSchema, isoDateStringSchema } from "../validation/primitives.js";

/** Validation status enum. */
export const estadoSchema = z.enum(["APROBADO", "PENDIENTE", "RECHAZADO"]);

/** Expense submitted for validation. */
export const gastoSchema = z.object({
  id: z.string().trim().min(1, "Expense id is required"),
  monto: z.number().finite("Expense amount must be a finite number"),
  moneda: currencyCodeSchema,
  fecha: isoDateStringSchema,
  categoria: z.string().trim().min(1, "Category is required"),
});

/** Employee who reported an expense. */
export const empleadoSchema = z.object({
  id: z.string().trim().min(1, "Employee id is required"),
  nombre: z.string().trim().min(1, "Employee first name is required"),
  apellido: z.string().trim().min(1, "Employee last name is required"),
  cost_center: z.string().trim().min(1, "Cost center is required"),
});

/** Age thresholds for expense validation. */
export const limiteAntiguedadSchema = z
  .object({
    pendiente_dias: z.number().int().nonnegative(),
    rechazado_dias: z.number().int().nonnegative(),
  })
  .refine((value) => value.pendiente_dias <= value.rechazado_dias, {
    message: "pendiente_dias must be less than or equal to rechazado_dias",
  });

/** Category spending limits in base currency. */
export const limiteCategoriaSchema = z
  .object({
    aprobado_hasta: z.number().nonnegative(),
    pendiente_hasta: z.number().nonnegative(),
  })
  .refine((value) => value.aprobado_hasta <= value.pendiente_hasta, {
    message: "aprobado_hasta must be less than or equal to pendiente_hasta",
  });

/** Cost-center cross rule prohibiting a category. */
export const reglaCentroCostoSchema = z.object({
  cost_center: z.string().trim().min(1, "Cost center is required"),
  categoria_prohibida: z.string().trim().min(1, "Prohibited category is required"),
});

/** Company expense policy. */
export const politicaSchema = z.object({
  moneda_base: currencyCodeSchema,
  limite_antiguedad: limiteAntiguedadSchema,
  limites_por_categoria: z.record(z.string(), limiteCategoriaSchema),
  reglas_centro_costo: z.array(reglaCentroCostoSchema),
});

/** Structured alert on a validation result. */
export const alertaSchema = z.object({
  codigo: z.string().trim().min(1, "Alert code is required"),
  mensaje: z.string().trim().min(1, "Alert message is required"),
});

/** Final validation output. */
export const validationResultSchema = z.object({
  gasto_id: z.string().trim().min(1, "Expense id is required"),
  status: estadoSchema,
  alertas: z.array(alertaSchema),
});

/** Partial outcome from a single rule. */
export const ruleVerdictSchema = z.object({
  status: estadoSchema,
  alerta: alertaSchema.optional(),
});

export type Estado = z.infer<typeof estadoSchema>;
export type Gasto = z.infer<typeof gastoSchema>;
export type Empleado = z.infer<typeof empleadoSchema>;
export type LimiteAntiguedad = z.infer<typeof limiteAntiguedadSchema>;
export type LimiteCategoria = z.infer<typeof limiteCategoriaSchema>;
export type ReglaCentroCosto = z.infer<typeof reglaCentroCostoSchema>;
export type Politica = z.infer<typeof politicaSchema>;
export type Alerta = z.infer<typeof alertaSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type RuleVerdict = z.infer<typeof ruleVerdictSchema>;

/** Validates and parses an expense. */
export function parseGasto(input: unknown): Gasto {
  return parseOrThrow(gastoSchema, input);
}

/** Validates and parses an employee. */
export function parseEmpleado(input: unknown): Empleado {
  return parseOrThrow(empleadoSchema, input);
}

/** Validates and parses an expense policy. */
export function parsePolitica(input: unknown): Politica {
  return parseOrThrow(politicaSchema, input);
}

/** Validates and parses a validation result. */
export function parseValidationResult(input: unknown): ValidationResult {
  return parseOrThrow(validationResultSchema, input);
}

/** Validates and parses an ISO date string. */
export function parseIsoDateString(input: unknown): string {
  return parseOrThrow(isoDateStringSchema, input);
}
