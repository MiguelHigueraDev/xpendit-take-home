import { FormEvent, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Loader2,
  Settings2,
} from "lucide-react";
import { validateExpense, type ValidationResult } from "../api.js";
import { ValidationResultCard } from "./validation-result.js";
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
  sectionEyebrowClass,
} from "../lib/ui.js";
import { iconMd, iconSm } from "../lib/icons.js";

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

export function ValidateForm({
  categories,
  currencies,
  baseCurrency,
}: {
  categories: string[];
  currencies: string[];
  baseCurrency?: string;
}) {
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
      id="panel-validate"
      role="tabpanel"
      aria-labelledby="tab-validate"
    >
      <p className={sectionEyebrowClass}>Validación individual</p>
      <h2 id="validate-heading" className={panelTitleClass}>
        Validar gasto
      </h2>
      <p className={panelDescriptionClass}>
        Ingresa los datos del gasto. El motor aplica la política activa y devuelve
        el estado con sus alertas.
      </p>

      <div
        className={`grid gap-5 ${result ? "lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start" : ""}`}
      >
        <form onSubmit={handleSubmit}>
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Datos del gasto</legend>
            <div className={formRowClass}>
              <label className={`${labelClass} sm:col-span-2`}>
                Monto
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={form.monto}
                  onChange={(event) => updateField("monto", event.target.value)}
                  required
                />
              </label>
              <label className={labelClass}>
                Moneda
                {currencies.length > 0 ? (
                  <select
                    className={inputClass}
                    value={form.moneda}
                    onChange={(event) =>
                      updateField("moneda", event.target.value)
                    }
                    required
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={inputClass}
                    value={form.moneda}
                    onChange={(event) =>
                      updateField("moneda", event.target.value)
                    }
                    placeholder={baseCurrency ?? "USD"}
                    required
                  />
                )}
              </label>
              <label className={labelClass}>
                Fecha
                <input
                  className={inputClass}
                  type="date"
                  value={form.fecha}
                  onChange={(event) => updateField("fecha", event.target.value)}
                  required
                />
              </label>
            </div>
            <label className={labelClass}>
              Categoría
              {categories.length > 0 ? (
                <select
                  className={inputClass}
                  value={form.categoria}
                  onChange={(event) =>
                    updateField("categoria", event.target.value)
                  }
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  value={form.categoria}
                  onChange={(event) =>
                    updateField("categoria", event.target.value)
                  }
                  required
                />
              )}
            </label>
          </fieldset>

          <details className="group/details mb-4 rounded-2xl border border-border bg-surface-muted px-4 py-3">
            <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-ink-secondary marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <Settings2 className={iconSm} aria-hidden="true" />
                Empleado y opciones avanzadas
              </span>
              <ChevronDown
                className={`${iconSm} text-ink-muted transition-transform duration-150 group-open/details:rotate-180`}
                aria-hidden="true"
              />
            </summary>
            <div className="mt-4 border-t border-border pt-4">
              <div className={formRowClass}>
                <label className={labelClass}>
                  ID gasto
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
                  ID empleado
                  <input
                    className={inputClass}
                    value={form.empleadoId}
                    onChange={(event) =>
                      updateField("empleadoId", event.target.value)
                    }
                    required
                  />
                </label>
              </div>
              <div className={formRowClass}>
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
              </div>
              <label className={labelClass}>
                Fecha de referencia
                <input
                  className={inputClass}
                  type="date"
                  value={form.referenceDate}
                  onChange={(event) =>
                    updateField("referenceDate", event.target.value)
                  }
                />
                <span className={`text-xs font-normal ${mutedClass}`}>
                  Opcional. Usada para calcular antigüedad del gasto.
                </span>
              </label>
            </div>
          </details>

          <button
            type="submit"
            className={`${buttonClass} w-full sm:w-auto`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className={`${iconMd} animate-spin`} aria-hidden="true" />
                Validando…
              </>
            ) : (
              <>
                Validar gasto
                <ArrowRight className={iconMd} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {result ? <ValidationResultCard result={result} /> : null}
      </div>

      {error ? (
        <p className={`${errorClass} flex items-center gap-1.5`} role="alert">
          <CircleAlert className={iconSm} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </section>
  );
}
