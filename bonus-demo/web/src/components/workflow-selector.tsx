import { ArrowRight, FileSpreadsheet, Receipt } from "lucide-react";
import { iconLg, iconMd } from "../lib/icons.js";

export type Workflow = "validate" | "analyze";

export const workflows: Array<{
  id: Workflow;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Receipt;
}> = [
  {
    id: "validate",
    eyebrow: "Validación individual",
    title: "Validar gasto",
    description:
      "Envía un gasto y obtén el estado contra la política activa en segundos.",
    icon: Receipt,
  },
  {
    id: "analyze",
    eyebrow: "Análisis por lotes",
    title: "Analizar lote CSV",
    description:
      "Sube un CSV histórico y revisa el desglose, duplicados y anomalías.",
    icon: FileSpreadsheet,
  },
];

export function WorkflowSelector({
  active,
  onChange,
}: {
  active: Workflow;
  onChange: (workflow: Workflow) => void;
}) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2"
      role="tablist"
      aria-label="Modo de trabajo"
    >
      {workflows.map((workflow) => {
        const selected = active === workflow.id;
        const Icon = workflow.icon;

        return (
          <button
            key={workflow.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel-${workflow.id}`}
            id={`tab-${workflow.id}`}
            onClick={() => onChange(workflow.id)}
            className={`rounded-[1.5rem] border p-5 text-left transition-[border-color,background,box-shadow,transform] duration-150 ease-out ${
              selected
                ? "border-teal-mid bg-surface shadow-[0_8px_28px_rgb(8_8_8_/_0.06)]"
                : "border-border bg-surface-muted hover:border-border-strong hover:bg-surface"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  selected
                    ? "bg-lime-soft text-teal-deep"
                    : "bg-bg-warm text-ink-muted"
                }`}
              >
                <Icon className={iconLg} aria-hidden="true" />
              </span>
              <ArrowRight
                className={`${iconMd} transition-transform duration-150 ${
                  selected
                    ? "translate-x-0 text-teal-deep opacity-100"
                    : "translate-x-0 text-ink-muted opacity-0"
                }`}
                aria-hidden="true"
              />
            </div>
            <p className="mb-2 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
              {workflow.eyebrow}
            </p>
            <h2 className="font-display text-xl font-medium tracking-tight text-ink-secondary [font-variation-settings:'opsz'_72]">
              {workflow.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {workflow.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
