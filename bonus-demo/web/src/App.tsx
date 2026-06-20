import { useEffect, useState } from "react";
import { AnalyzePanel } from "./components/analyze-panel.js";
import { ValidateForm } from "./components/validate-form.js";
import { fetchPolicy, type PoliticaResponse } from "./api.js";

export function App() {
  const [policy, setPolicy] = useState<PoliticaResponse | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicy()
      .then(setPolicy)
      .catch((error: unknown) => {
        if (error instanceof Error) {
          setPolicyError(error.message);
        } else {
          setPolicyError("Error al cargar la política");
        }
      });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Motor de Reglas Xpendit</h1>
        <p className="subtitle">
          Valida gastos individuales o analiza un lote CSV usando el motor
          central vía HTTP.
        </p>
      </header>

      <section className="policy-card">
        <h2>Política activa</h2>
        {policyError ? (
          <p className="error">{policyError}</p>
        ) : policy ? (
          <dl className="policy-grid">
            <div>
              <dt>Moneda base</dt>
              <dd>{policy.moneda_base}</dd>
            </div>
            <div>
              <dt>Umbrales de antigüedad</dt>
              <dd>
                PENDIENTE después de {policy.limite_antiguedad.pendiente_dias}{" "}
                días, RECHAZADO después de{" "}
                {policy.limite_antiguedad.rechazado_dias} días
              </dd>
            </div>
            <div>
              <dt>Categorías</dt>
              <dd>{Object.keys(policy.limites_por_categoria).join(", ")}</dd>
            </div>
            <div>
              <dt>Categoría desconocida</dt>
              <dd>{policy.categoria_desconocida}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">Cargando política…</p>
        )}
      </section>

      <main className="panels">
        <ValidateForm />
        <AnalyzePanel />
      </main>
    </div>
  );
}
