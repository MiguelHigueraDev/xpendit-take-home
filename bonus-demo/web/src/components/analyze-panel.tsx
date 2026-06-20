import { ChangeEvent, useState } from "react";
import {
  analyzeCsv,
  type BatchAnalysisResponse,
  type Estado,
} from "../api.js";

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
    <section className="panel">
      <h2>Analizar lote CSV</h2>
      <p className="panel-description">
        Sube un CSV de gastos históricos. La API reutiliza el analizador por
        lotes con tasas de respaldo offline (sin llamadas a la API en vivo).
      </p>

      <label className="file-input">
        <span>{loading ? "Analizando…" : "Elegir archivo CSV"}</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={loading}
        />
      </label>

      {fileName ? <p className="muted">Último archivo: {fileName}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {report ? (
        <div className="analysis-results">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Fecha de referencia</span>
              <strong>{report.referenceDate}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Filas válidas</span>
              <strong>
                {report.validRows} / {report.totalCsvRows}
              </strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Fechas únicas</span>
              <strong>{report.rateResolution.uniqueDates.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Llamadas API</span>
              <strong>{report.rateResolution.apiCallCount}</strong>
            </div>
          </div>

          <div className="breakdown">
            <h3>Desglose por estado</h3>
            <div className="breakdown-row">
              {(Object.entries(report.statusBreakdown) as [Estado, number][]).map(
                ([status, count]) => (
                  <div key={status} className="breakdown-item">
                    <span className={statusClass(status)}>{status}</span>
                    <strong>{count}</strong>
                  </div>
                ),
              )}
            </div>
          </div>

          {report.duplicateGroups.length > 0 ? (
            <div className="duplicate-groups">
              <h3>Grupos duplicados ({report.duplicateGroups.length})</h3>
              <ul>
                {report.duplicateGroups.map((group) => (
                  <li key={`${group.monto}-${group.moneda}-${group.fecha}`}>
                    {group.monto} {group.moneda} el {group.fecha}:{" "}
                    {group.gasto_ids.join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="table-wrap">
            <h3>Resultados por fila</h3>
            <table>
              <thead>
                <tr>
                  <th>gasto_id</th>
                  <th>estado</th>
                  <th>alertas</th>
                  <th>anomalías</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((row) => (
                  <tr key={row.gasto_id}>
                    <td>{row.gasto_id}</td>
                    <td>
                      <span className={statusClass(row.validation.status)}>
                        {row.validation.status}
                      </span>
                    </td>
                    <td>
                      {row.validation.alertas.length > 0
                        ? row.validation.alertas
                            .map((alerta) => alerta.codigo)
                            .join(", ")
                        : "—"}
                    </td>
                    <td>
                      {row.anomalies.length > 0
                        ? row.anomalies.map((anomaly) => anomaly.tipo).join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
