import { ChangeEvent, useState } from "react";
import {
  ChevronDown,
  CircleAlert,
  Copy,
  FileSpreadsheet,
  Info,
  Loader2,
  Table2,
  Upload,
} from "lucide-react";
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
  sectionEyebrowClass,
  statusBadgeClass,
} from "../lib/ui.js";
import { iconLg, iconSm } from "../lib/icons.js";

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
      className={`${cardClass} [animation-delay:0.16s]`}
      id="panel-analyze"
      role="tabpanel"
      aria-labelledby="tab-analyze"
    >
      <p className={sectionEyebrowClass}>Análisis por lotes</p>
      <h2 id="analyze-heading" className={panelTitleClass}>
        Analizar lote CSV
      </h2>
      <p className={panelDescriptionClass}>
        Sube un archivo CSV de gastos históricos. El motor procesa el lote completo
        y resume estados, duplicados y anomalías.
      </p>

      <label className="group block">
        <span className="flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] border-[1.5px] border-dashed border-border-strong bg-surface-muted px-6 py-8 text-center transition-[border-color,background,color,transform,box-shadow] duration-150 ease-out group-hover:border-teal-mid group-hover:bg-lime-soft group-hover:text-teal-deep group-hover:-translate-y-px group-hover:shadow-[0_6px_20px_rgb(176_243_31_/_0.2)] group-active:translate-y-0 group-focus-within:shadow-[0_0_0_3px_rgb(176_243_31_/_0.35)]">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-warm text-teal-deep"
          >
            {loading ? (
              <Loader2 className={`${iconLg} animate-spin`} />
            ) : (
              <FileSpreadsheet className={iconLg} />
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-secondary group-hover:text-teal-deep">
            {loading ? (
              "Analizando archivo…"
            ) : (
              <>
                <Upload className={iconSm} />
                Seleccionar archivo CSV
              </>
            )}
          </span>
          <span className="max-w-xs text-xs leading-relaxed text-ink-muted group-hover:text-teal-deep/80">
            {fileName
              ? `Último archivo: ${fileName}`
              : "Arrastra un CSV o haz clic para elegir un archivo"}
          </span>
        </span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={loading}
          className="sr-only"
        />
      </label>

      {error ? (
        <p className={`${errorClass} flex items-center gap-1.5`} role="alert">
          <CircleAlert className={iconSm} aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {!report && !loading && !error ? (
        <p className={`mt-4 flex items-start gap-2 text-sm ${mutedClass}`}>
          <Info className={`${iconSm} mt-0.5 shrink-0`} aria-hidden="true" />
          El análisis usa tasas de respaldo offline y no requiere llamadas en vivo
          a la API de cambio.
        </p>
      ) : null}

      {report ? (
        <div className="mt-6 animate-fade-up [animation-duration:0.4s]">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Filas válidas",
                value: `${report.validRows}/${report.totalCsvRows}`,
              },
              {
                label: "Referencia",
                value: report.referenceDate,
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
                className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5"
              >
                <span className="block text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                  {stat.label}
                </span>
                <strong className="mt-1 block font-display text-2xl font-medium text-ink-secondary [font-variation-settings:'opsz'_72]">
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.entries(report.statusBreakdown) as [Estado, number][]).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-full border border-border bg-bg-warm px-3 py-1.5"
                >
                  <span className={statusBadgeClass(status)}>{status}</span>
                  <strong className="text-sm font-semibold text-ink-secondary">
                    {count}
                  </strong>
                </div>
              ),
            )}
          </div>

          {report.duplicateGroups.length > 0 ? (
            <details className="group/details mt-5 rounded-2xl border border-border bg-surface-muted px-4 py-3">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-ink-secondary marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <Copy className={iconSm} aria-hidden="true" />
                  Grupos duplicados ({report.duplicateGroups.length})
                </span>
                <ChevronDown
                  className={`${iconSm} text-ink-muted transition-transform duration-150 group-open/details:rotate-180`}
                  aria-hidden="true"
                />
              </summary>
              <ul className="mt-3 list-none space-y-2 p-0">
                {report.duplicateGroups.map((group) => (
                  <li
                    key={`${group.monto}-${group.moneda}-${group.fecha}`}
                    className="rounded-xl border border-border bg-bg-warm px-3 py-2 text-[0.8125rem] text-ink-secondary"
                  >
                    {group.monto} {group.moneda} el {group.fecha}:{" "}
                    {group.gasto_ids.join(", ")}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <details
            className="group/details mt-3 rounded-2xl border border-border bg-surface-muted px-4 py-3"
            open
          >
            <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-ink-secondary marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <Table2 className={iconSm} aria-hidden="true" />
                Resultados por fila ({report.results.length})
              </span>
              <ChevronDown
                className={`${iconSm} text-ink-muted transition-transform duration-150 group-open/details:rotate-180`}
                aria-hidden="true"
              />
            </summary>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-bg-warm">
              <table className="w-full border-collapse text-[0.8125rem]">
                <thead>
                  <tr>
                    {["gasto_id", "estado", "alertas", "anomalías"].map(
                      (column) => (
                        <th
                          key={column}
                          scope="col"
                          className="border-b border-border-strong bg-surface-muted px-3.5 py-2.5 text-left align-top text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase"
                        >
                          {column}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((row) => (
                    <tr
                      key={row.gasto_id}
                      className="group/row hover:[&_td]:bg-lime-soft"
                    >
                      <td className="border-b border-border px-3.5 py-2.5 align-top text-xs text-ink-muted group-last/row:border-b-0">
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
          </details>
        </div>
      ) : null}
    </section>
  );
}
