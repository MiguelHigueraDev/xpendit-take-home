/** Request body for single-expense validation. */
export interface ValidateRequestDto {
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
  /** Optional ISO date (YYYY-MM-DD) used as "today" for age rules. */
  referenceDate?: string;
}
