import { useEffect, useState } from "react";
import { AnalyzePanel } from "./components/analyze-panel.js";
import { SiteHeader } from "./components/site-header.js";
import { ValidateForm } from "./components/validate-form.js";
import { fetchPolicy, type PoliticaResponse } from "./api.js";
import {
  cardClass,
  errorClass,
  mutedClass,
  sectionEyebrowClass,
} from "./lib/ui.js";

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

  const categories = policy
    ? Object.keys(policy.limites_por_categoria)
    : [];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="bg-bg">
        <div className="mx-auto max-w-[1080px] px-6 py-10 pb-16 max-[480px]:px-4 max-[480px]:py-7 max-[480px]:pb-12">
          <section
            className={`${cardClass} mb-5 [animation-delay:0.08s]`}
            aria-labelledby="policy-heading"
          >
            <p className={sectionEyebrowClass}>Motor de reglas</p>
            <h2
              id="policy-heading"
              className="font-display text-2xl font-medium tracking-tight text-ink-secondary [font-variation-settings:'opsz'_72]"
            >
              Política activa
            </h2>
            {policyError ? (
              <p className={errorClass} role="alert">
                {policyError}
              </p>
            ) : policy ? (
              <dl className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
                  <dt className={sectionEyebrowClass}>Moneda base</dt>
                  <dd className="text-[0.9375rem] font-medium text-ink-secondary">
                    {policy.moneda_base}
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
                  <dt className={sectionEyebrowClass}>Umbrales de antigüedad</dt>
                  <dd className="text-[0.9375rem] leading-relaxed text-ink-secondary">
                    PENDIENTE después de {policy.limite_antiguedad.pendiente_dias}{" "}
                    días, RECHAZADO después de{" "}
                    {policy.limite_antiguedad.rechazado_dias} días
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
                  <dt className={sectionEyebrowClass}>Categorías</dt>
                  <dd>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {categories.map((category) => (
                        <span
                          key={category}
                          className="inline-block rounded-full bg-lime-soft px-2.5 py-0.5 text-xs font-semibold text-teal-deep"
                        >
                          {category}
                        </span>
                      ))}
                    </span>
                  </dd>
                </div>
                <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
                  <dt className={sectionEyebrowClass}>Categoría desconocida</dt>
                  <dd className="text-[0.9375rem] font-medium text-ink-secondary">
                    {policy.categoria_desconocida}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className={mutedClass} aria-live="polite">
                Cargando política…
              </p>
            )}
          </section>

          <main className="grid gap-5 min-[900px]:grid-cols-2 min-[900px]:items-start">
            <ValidateForm />
            <AnalyzePanel />
          </main>
        </div>
      </div>
    </div>
  );
}
