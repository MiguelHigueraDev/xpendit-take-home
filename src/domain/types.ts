export type Estado = "APROBADO" | "PENDIENTE" | "RECHAZADO";

export interface Gasto {
  id: string;
  monto: number;
  moneda: string;
  fecha: string;
  categoria: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cost_center: string;
}

export interface LimiteAntiguedad {
  pendiente_dias: number;
  rechazado_dias: number;
}

export interface LimiteCategoria {
  aprobado_hasta: number;
  pendiente_hasta: number;
}

export interface ReglaCentroCosto {
  cost_center: string;
  categoria_prohibida: string;
}

export interface Politica {
  moneda_base: string;
  limite_antiguedad: LimiteAntiguedad;
  limites_por_categoria: Record<string, LimiteCategoria>;
  reglas_centro_costo: ReglaCentroCosto[];
}

export interface Alerta {
  codigo: string;
  mensaje: string;
}

export interface ValidationResult {
  gasto_id: string;
  status: Estado;
  alertas: Alerta[];
}

export interface RuleVerdict {
  status: Estado;
  alerta?: Alerta;
}

export interface RuleContext {
  gasto: Gasto;
  empleado: Empleado;
  politica: Politica;
  referenceDate: Date;
  convertToBaseCurrency: (amount: number, fromCurrency: string) => number;
}

export type Rule = (context: RuleContext) => RuleVerdict | null;
