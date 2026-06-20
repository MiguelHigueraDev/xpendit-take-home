import type { ValidationResult } from "../api.js";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  XCircle,
} from "lucide-react";
import { mutedClass, statusBadgeClass } from "../lib/ui.js";
import { iconMd, iconSm } from "../lib/icons.js";

function statusIcon(status: ValidationResult["status"]) {
  switch (status) {
    case "APROBADO":
      return CheckCircle2;
    case "PENDIENTE":
      return Clock3;
    case "RECHAZADO":
      return XCircle;
  }
}

export function ValidationResultCard({ result }: { result: ValidationResult }) {
  const hasAlerts = result.alertas.length > 0;
  const StatusIcon = statusIcon(result.status);

  return (
    <aside
      className="animate-fade-up rounded-[1.5rem] border border-border bg-surface p-5 [animation-duration:0.4s] lg:sticky lg:top-6"
      aria-live="polite"
    >
      <p className="mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
        Resultado
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className={`${statusBadgeClass(result.status)} gap-1`}>
          <StatusIcon className={iconSm} aria-hidden="true" />
          {result.status}
        </span>
        <span className="text-xs text-ink-muted">{result.gasto_id}</span>
      </div>

      {hasAlerts ? (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-secondary">
            <AlertTriangle className={iconSm} aria-hidden="true" />
            {result.alertas.length}{" "}
            {result.alertas.length === 1 ? "alerta" : "alertas"}
          </p>
          <ul className="m-0 list-none space-y-2 p-0">
            {result.alertas.map((alerta) => (
              <li
                key={`${alerta.codigo}-${alerta.mensaje}`}
                className="rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm"
              >
                <strong className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
                  <CircleAlert className={iconSm} aria-hidden="true" />
                  {alerta.codigo}
                </strong>
                <p className="mt-1 leading-relaxed text-ink-muted">
                  {alerta.mensaje}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-approved-bg bg-approved-bg/40 px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-approved-text">
            <CheckCircle2 className={iconMd} aria-hidden="true" />
            Sin alertas de política
          </p>
          <p className={`mt-1 text-sm ${mutedClass}`}>
            El gasto cumple con las reglas configuradas.
          </p>
        </div>
      )}
    </aside>
  );
}
