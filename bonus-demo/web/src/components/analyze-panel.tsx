import { ChangeEvent, useState } from "react";
import {
  analyzeCsv,
  type BatchAnalysisResponse,
  type Estado,
} from "../api.js";
import {
  cardClass,
  errorClass,
  mutedClass,
  panelDescriptionClass,
  panelTitleClass,
  statusBadgeClass,
} from "../lib/ui.js";

export function AnalyzePanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<BatchAnalysisResponse | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const csvContent = await file.text();
      const response = await analyzeCsv(csvContent);
      setReport(response);
    } catch (uploadError) {
      setReport(null);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Error al analizar el CSV",
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <section
      className={`${cardClass} [animation-delay:0.24s]`}
      aria-labelledby="analyze-heading"
    >
      <h2 id="analyze-heading" className={panelTitleClass}>
        Analizar lote CSV
      </h2>
      <p className={panelDescriptionClass}>
        Sube un CSV de gastos históricos. La API reutiliza el analizador por
        lotes con tasas de respaldo offline (sin llamadas a la API en vivo).
      </p>

      <label className="group block">
        <span className="flex w-full cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-border-strong bg-bg px-5 py-7 text-sm font-medium text-ink-secondary transition-[border-color,background,color,transform,box-shadow] duration-150 ease-out group-hover:border-accent group-hover:bg-accent-soft group-hover:text-accent group-hover:-translate-y-px group-hover:shadow-[0_4px_12px_rgba(11,100,100,0.22)] group-active:translate-y-0 group-focus-within:shadow-[0_0_0_3px_var(--color-accent-ring)]">
          {loading ? "Analizando…" : "Seleccionar archivo CSV"}
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={loading}
          className="sr-only"
        />
      </label>

      {fileName ? (
        <p className={`mt-2.5 font-mono text-xs ${mutedClass}`}>
          Último archivo: {fileName}
        </p>
      ) : null}
      {error ? (
        <p className={errorClass} role="alert">
          {error}
        </p>
      ) : null}

      {report ? (
        <div className="mt-5 animate-fade-up [animation-duration:0.4s]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
            {[
              {
                label: "Fecha de referencia",
                value: report.referenceDate,
              },
              {
                label: "Filas válidas",
                value: `${report.validRows} / ${report.totalCsvRows}`,
              },
              {
                label: "Fechas únicas",
                value: report.rateResolution.uniqueDates.length,
              },
              {
                label: "Llamadas API",
                value: report.rateResolution.apiCallCount,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-bg px-4.5 py-4"
              >
                <span className="block font-mono text-[0.6875rem] font-medium tracking-wide text-ink-muted uppercase">
                  {stat.label}
                </span>
                <strong className="mt-0.5 block font-mono text-base font-medium">
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mt-6 mb-3 font-display text-base font-medium text-ink">
              Desglose por estado
            </h3>
            <div className="flex flex-wrap gap-3">
              {(
                Object.entries(report.statusBreakdown) as [Estado, number][]
              ).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-3 py-2"
                >
                  <span className={statusBadgeClass(status)}>{status}</span>
                  <strong className="font-mono text-[0.9375rem]">{count}</strong>
                </div>
              ))}
            </div>
          </div>

          {report.duplicateGroups.length > 0 ? (
            <div>
              <h3 className="mt-6 mb-3 font-display text-base font-medium text-ink">
                Grupos duplicados ({report.duplicateGroups.length})
              </h3>
              <ul className="m-0 list-none p-0">
                {report.duplicateGroups.map((group) => (
                  <li
                    key={`${group.monto}-${group.moneda}-${group.fecha}`}
                    className="mb-1.5 rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-[0.8125rem]"
                  >
                    {group.monto} {group.moneda} el {group.fecha}:{" "}
                    {group.gasto_ids.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h3 className="mt-6 mb-3 font-display text-base font-medium text-ink">
              Resultados por fila
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
              <table className="w-full border-collapse text-[0.8125rem]">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="border-b border-border-strong bg-bg px-3.5 py-2.5 text-left align-top font-mono text-[0.6875rem] font-medium tracking-wide text-ink-muted uppercase"
                    >
                      gasto_id
                    </th>
                    <th
                      scope="col"
                      className="border-b border-border-strong bg-bg px-3.5 py-2.5 text-left align-top font-mono text-[0.6875rem] font-medium tracking-wide text-ink-muted uppercase"
                    >
                      estado
                    </th>
                    <th
                      scope="col"
                      className="border-b border-border-strong bg-bg px-3.5 py-2.5 text-left align-top font-mono text-[0.6875rem] font-medium tracking-wide text-ink-muted uppercase"
                    >
                      alertas
                    </th>
                    <th
                      scope="col"
                      className="border-b border-border-strong bg-bg px-3.5 py-2.5 text-left align-top font-mono text-[0.6875rem] font-medium tracking-wide text-ink-muted uppercase"
                    >
                      anomalías
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((row) => (
                    <tr
                      key={row.gasto_id}
                      className="group/row hover:[&_td]:bg-accent-soft"
                    >
                      <td className="border-b border-border px-3.5 py-2.5 align-top font-mono text-xs group-last/row:border-b-0">
                        {row.gasto_id}
                      </td>
                      <td className="border-b border-border px-3.5 py-2.5 align-top group-last/row:border-b-0">
                        <span className={statusBadgeClass(row.validation.status)}>
                          {row.validation.status}
                        </span>
                      </td>
                      <td className="border-b border-border px-3.5 py-2.5 align-top group-last/row:border-b-0">
                        {row.validation.alertas.length > 0
                          ? row.validation.alertas
                              .map((alerta) => alerta.codigo)
                              .join(", ")
                          : "—"}
                      </td>
                      <td className="border-b border-border px-3.5 py-2.5 align-top group-last/row:border-b-0">
                        {row.anomalies.length > 0
                          ? row.anomalies
                              .map((anomaly) => anomaly.tipo)
                              .join(", ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
