export type Estado = "APROBADO" | "PENDIENTE" | "RECHAZADO";

export interface Alerta {
  codigo: string;
  mensaje: string;
}

export interface ValidationResult {
  gasto_id: string;
  status: Estado;
  alertas: Alerta[];
}

export interface ValidateRequest {
  gasto: {
    id: string;
    monto: number | string;
    moneda: string;
    fecha: string;
    categoria: string;
  };
  empleado: {
    id: string;
    nombre: string;
    apellido: string;
    cost_center: string;
  };
  referenceDate?: string;
}

export interface PoliticaResponse {
  moneda_base: string;
  monedas_disponibles: string[];
  limite_antiguedad: {
    pendiente_dias: number;
    rechazado_dias: number;
  };
  limites_por_categoria: Record<
    string,
    { aprobado_hasta: string; pendiente_hasta: string }
  >;
  reglas_centro_costo: Array<{
    cost_center: string;
    categoria_prohibida: string;
  }>;
  categoria_desconocida: Estado;
}

export interface BatchAnalysisResponse {
  referenceDate: string;
  totalCsvRows: number;
  validRows: number;
  malformedRows: Array<{
    rowNumber: number;
    gasto_id?: string;
    message: string;
  }>;
  statusBreakdown: Record<Estado, number>;
  duplicateGroups: Array<{
    monto: string;
    moneda: string;
    fecha: string;
    gasto_ids: string[];
  }>;
  negativeAmountIds: string[];
  rateResolution: {
    uniqueDates: string[];
    liveDates: string[];
    fallbackDates: string[];
    apiCallCount: number;
  };
  results: Array<{
    gasto_id: string;
    validation: ValidationResult;
    anomalies: Array<{
      gasto_id: string;
      tipo: "DUPLICADO_EXACTO" | "MONTO_NEGATIVO";
      alerta: Alerta;
    }>;
  }>;
}

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchPolicy(): Promise<PoliticaResponse> {
  const response = await fetch("/api/policy");
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response));
  }
  return response.json() as Promise<PoliticaResponse>;
}

export async function validateExpense(
  body: ValidateRequest,
): Promise<ValidationResult> {
  const response = await fetch("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response));
  }
  return response.json() as Promise<ValidationResult>;
}

export async function analyzeCsv(csvContent: string): Promise<BatchAnalysisResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    body: csvContent,
  });
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response));
  }
  return response.json() as Promise<BatchAnalysisResponse>;
}

export { ApiError };
