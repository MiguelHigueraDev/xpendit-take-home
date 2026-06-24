import { ChevronDown } from "lucide-react";
import type { PoliticaResponse } from "../api.js";
import {
  categoryLimitTooltip,
  errorClass,
  mutedClass,
  sectionEyebrowClass,
} from "../lib/ui.js";
import { iconMd } from "../lib/icons.js";

export function PolicySummary({
  policy,
  policyError,
}: {
  policy: PoliticaResponse | null;
  policyError: string | null;
}) {
  const categories = policy ? Object.keys(policy.limites_por_categoria) : [];

  return (
    <details className="group mb-5 rounded-[1.5rem] border border-border bg-surface animate-fade-up [animation-delay:0.08s]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:content-none [&::-webkit-details-marker]:hidden">
        <div>
          <p className={sectionEyebrowClass}>Motor de reglas</p>
          <h2 className="font-display text-xl font-medium tracking-tight text-ink-secondary [font-variation-settings:'opsz'_72]">
            Política activa
          </h2>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-ink-muted transition-transform duration-150 group-open:rotate-180">
          <ChevronDown className={iconMd} aria-hidden="true" />
        </span>
      </summary>

      <div className="border-t border-border px-5 pt-2 pb-5">
        {policyError ? (
          <p className={errorClass} role="alert">
            {policyError}
          </p>
        ) : policy ? (
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
              <dt className={sectionEyebrowClass}>Moneda base</dt>
              <dd className="text-[0.9375rem] font-medium text-ink-secondary">
                {policy.moneda_base}
              </dd>
            </div>
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
              <dt className={sectionEyebrowClass}>Antigüedad</dt>
              <dd className="text-[0.9375rem] leading-relaxed text-ink-secondary">
                PENDIENTE a los {policy.limite_antiguedad.pendiente_dias} días ·
                RECHAZADO a los {policy.limite_antiguedad.rechazado_dias} días
              </dd>
            </div>
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5 sm:col-span-2">
              <dt className={sectionEyebrowClass}>Categorías</dt>
              <dd>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {categories.map((category) => (
                    <span
                      key={category}
                      title={categoryLimitTooltip(
                        policy.limites_por_categoria[category],
                        policy.moneda_base,
                      )}
                      className="inline-block cursor-help rounded-full bg-lime-soft px-2.5 py-0.5 text-xs font-semibold text-teal-deep"
                    >
                      {category}
                    </span>
                  ))}
                </span>
              </dd>
            </div>
            <div className="rounded-2xl border border-border bg-surface-muted px-4 py-3.5">
              <dt className={sectionEyebrowClass}>Desconocida</dt>
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
      </div>
    </details>
  );
}
