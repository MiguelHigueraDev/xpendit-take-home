import { FormEvent, useState } from "react";
import {
  validateExpense,
  type Estado,
  type ValidationResult,
} from "../api.js";

const DEFAULT_FORM = {
  gastoId: "g_demo",
  monto: "50",
  moneda: "USD",
  fecha: "2026-06-04",
  categoria: "food",
  empleadoId: "e_demo",
  nombre: "Bruno",
  apellido: "Soto",
  costCenter: "sales_team",
  referenceDate: "2026-06-19",
};

function statusClass(status: Estado): string {
  switch (status) {
    case "APROBADO":
      return "status-badge status-approved";
    case "PENDIENTE":
      return "status-badge status-pending";
    case "RECHAZADO":
      return "status-badge status-rejected";
  }
}

export function ValidateForm() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await validateExpense({
        gasto: {
          id: form.gastoId,
          monto: form.monto,
          moneda: form.moneda,
          fecha: form.fecha,
          categoria: form.categoria,
        },
        empleado: {
          id: form.empleadoId,
          nombre: form.nombre,
          apellido: form.apellido,
          cost_center: form.costCenter,
        },
        referenceDate: form.referenceDate || undefined,
      });
      setResult(response);
    } catch (submitError) {
      setResult(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Error al validar el gasto",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="panel">
      <h2>Validar gasto</h2>
      <p className="panel-description">
        Envía un gasto contra la política por defecto usando tasas de respaldo
        offline.
      </p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <fieldset>
          <legend>Gasto</legend>
          <label>
            ID
            <input
              value={form.gastoId}
              onChange={(event) => updateField("gastoId", event.target.value)}
              required
            />
          </label>
          <label>
            Monto
            <input
              value={form.monto}
              onChange={(event) => updateField("monto", event.target.value)}
              required
            />
          </label>
          <label>
            Moneda
            <input
              value={form.moneda}
              onChange={(event) => updateField("moneda", event.target.value)}
              required
            />
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={form.fecha}
              onChange={(event) => updateField("fecha", event.target.value)}
              required
            />
          </label>
          <label>
            Categoría
            <input
              value={form.categoria}
              onChange={(event) => updateField("categoria", event.target.value)}
              required
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Empleado</legend>
          <label>
            ID
            <input
              value={form.empleadoId}
              onChange={(event) => updateField("empleadoId", event.target.value)}
              required
            />
          </label>
          <label>
            Nombre
            <input
              value={form.nombre}
              onChange={(event) => updateField("nombre", event.target.value)}
              required
            />
          </label>
          <label>
            Apellido
            <input
              value={form.apellido}
              onChange={(event) => updateField("apellido", event.target.value)}
              required
            />
          </label>
          <label>
            Centro de costo
            <input
              value={form.costCenter}
              onChange={(event) =>
                updateField("costCenter", event.target.value)
              }
              required
            />
          </label>
          <label>
            Fecha de referencia
            <input
              type="date"
              value={form.referenceDate}
              onChange={(event) =>
                updateField("referenceDate", event.target.value)
              }
            />
          </label>
        </fieldset>

        <button type="submit" disabled={loading}>
          {loading ? "Validando…" : "Validar"}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      {result ? (
        <div className="result-card">
          <div className="result-header">
            <span className={statusClass(result.status)}>{result.status}</span>
            <span className="muted">gasto_id: {result.gasto_id}</span>
          </div>
          {result.alertas.length > 0 ? (
            <ul className="alert-list">
              {result.alertas.map((alerta) => (
                <li key={`${alerta.codigo}-${alerta.mensaje}`}>
                  <strong>{alerta.codigo}</strong> — {alerta.mensaje}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sin alertas.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
