import { FormEvent, useState } from "react";
import { validateExpense, type ValidationResult } from "../api.js";
import {
  buttonClass,
  cardClass,
  errorClass,
  fieldsetClass,
  formRowClass,
  inputClass,
  labelClass,
  legendClass,
  mutedClass,
  panelDescriptionClass,
  panelTitleClass,
  statusBadgeClass,
} from "../lib/ui.js";

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
    <section
      className={`${cardClass} [animation-delay:0.16s]`}
      aria-labelledby="validate-heading"
    >
      <h2 id="validate-heading" className={panelTitleClass}>
        Validar gasto
      </h2>
      <p className={panelDescriptionClass}>
        Envía un gasto contra la política por defecto usando tasas de respaldo
        offline.
      </p>

      <form onSubmit={handleSubmit}>
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Gasto</legend>
          <div className={formRowClass}>
            <label className={labelClass}>
              ID
              <input
                className={inputClass}
                value={form.gastoId}
                onChange={(event) =>
                  updateField("gastoId", event.target.value)
                }
                required
              />
            </label>
            <label className={labelClass}>
              Monto
              <input
                className={inputClass}
                value={form.monto}
                onChange={(event) => updateField("monto", event.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              Moneda
              <input
                className={inputClass}
                value={form.moneda}
                onChange={(event) =>
                  updateField("moneda", event.target.value)
                }
                required
              />
            </label>
          </div>
          <div className={formRowClass}>
            <label className={labelClass}>
              Fecha
              <input
                className={`${inputClass} font-mono text-[0.8125rem]`}
                type="date"
                value={form.fecha}
                onChange={(event) => updateField("fecha", event.target.value)}
                required
              />
            </label>
            <label className={labelClass}>
              Categoría
              <input
                className={inputClass}
                value={form.categoria}
                onChange={(event) =>
                  updateField("categoria", event.target.value)
                }
                required
              />
            </label>
          </div>
        </fieldset>

        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Empleado</legend>
          <div className={formRowClass}>
            <label className={labelClass}>
              ID
              <input
                className={inputClass}
                value={form.empleadoId}
                onChange={(event) =>
                  updateField("empleadoId", event.target.value)
                }
                required
              />
            </label>
            <label className={labelClass}>
              Nombre
              <input
                className={inputClass}
                value={form.nombre}
                onChange={(event) =>
                  updateField("nombre", event.target.value)
                }
                required
              />
            </label>
            <label className={labelClass}>
              Apellido
              <input
                className={inputClass}
                value={form.apellido}
                onChange={(event) =>
                  updateField("apellido", event.target.value)
                }
                required
              />
            </label>
          </div>
          <div className={formRowClass}>
            <label className={labelClass}>
              Centro de costo
              <input
                className={inputClass}
                value={form.costCenter}
                onChange={(event) =>
                  updateField("costCenter", event.target.value)
                }
                required
              />
            </label>
            <label className={labelClass}>
              Fecha de referencia
              <input
                className={`${inputClass} font-mono text-[0.8125rem]`}
                type="date"
                value={form.referenceDate}
                onChange={(event) =>
                  updateField("referenceDate", event.target.value)
                }
              />
            </label>
          </div>
        </fieldset>

        <button type="submit" className={buttonClass} disabled={loading}>
          {loading ? "Validando…" : "Validar gasto"}
        </button>
      </form>

      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          className="mt-5 animate-fade-up rounded-xl border border-border bg-bg px-4.5 py-4 [animation-duration:0.4s]"
          aria-live="polite"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <span className={statusBadgeClass(result.status)}>
              {result.status}
            </span>
            <span className="font-mono text-xs text-ink-muted">
              {result.gasto_id}
            </span>
          </div>
          {result.alertas.length > 0 ? (
            <ul className="m-0 list-none space-y-1 p-0">
              {result.alertas.map((alerta) => (
                <li
                  key={`${alerta.codigo}-${alerta.mensaje}`}
                  className="border-l-2 border-border-strong py-2 pl-3.5 text-sm"
                >
                  <strong className="font-mono text-xs font-medium text-ink-secondary">
                    {alerta.codigo}
                  </strong>{" "}
                  — {alerta.mensaje}
                </li>
              ))}
            </ul>
          ) : (
            <p className={mutedClass}>Sin alertas.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
