import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { AnalyzePanel } from "./components/analyze-panel.js";
import { PolicySummary } from "./components/policy-summary.js";
import { SiteHeader } from "./components/site-header.js";
import { SiteFooter } from "./components/site-footer.js";
import { ValidateForm } from "./components/validate-form.js";
import {
  WorkflowSelector,
  type Workflow,
} from "./components/workflow-selector.js";
import { fetchPolicy, type PoliticaResponse } from "./api.js";
import { iconSm } from "./lib/icons.js";

export function App() {
  const [policy, setPolicy] = useState<PoliticaResponse | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<Workflow>("validate");

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
  const currencies = policy?.monedas_disponibles ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="flex-1 bg-bg">
        <div className="mx-auto max-w-[900px] px-6 py-10 pb-16 max-[480px]:px-4 max-[480px]:py-7 max-[480px]:pb-12">
          <PolicySummary policy={policy} policyError={policyError} />

          <div className="mb-5 animate-fade-up [animation-delay:0.12s]">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase">
              <GitBranch className={iconSm} aria-hidden="true" />
              Elige un flujo
            </p>
            <WorkflowSelector active={workflow} onChange={setWorkflow} />
          </div>

          <main>
            {workflow === "validate" ? (
              <ValidateForm
                categories={categories}
                categoryLimits={policy?.limites_por_categoria}
                currencies={currencies}
                baseCurrency={policy?.moneda_base}
              />
            ) : (
              <AnalyzePanel />
            )}
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
