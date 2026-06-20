import { ArrowUpRight, ShieldAlert } from "lucide-react";
import xpenditLogo from "../../assets/xpendit-logo.svg";
import { iconSm } from "../lib/icons.js";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="hero-bg mt-auto text-white">
      <div className="mx-auto max-w-[1080px] px-6 py-12 max-[480px]:px-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
            <ShieldAlert
              className={`${iconSm} mt-0.5 shrink-0 text-lime`}
              aria-hidden="true"
            />
            <span>
              Esta es una{" "}
              <strong className="font-semibold text-white">demo técnica</strong>{" "}
              creada con fines de evaluación. No está aprobada, respaldada ni
              afiliada con Xpendit. El diseño y la marca se usan solo como
              referencia visual.
            </span>
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <img src={xpenditLogo} alt="Xpendit" className="h-7 w-auto" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Motor de reglas — demo bonus para validar gastos y analizar lotes
              CSV vía HTTP.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium tracking-[0.14em] text-white/45 uppercase">
              Demo
            </p>
            <ul className="m-0 list-none space-y-2 p-0 text-sm">
              <li>
                <span className="text-white/70">Validación individual</span>
              </li>
              <li>
                <span className="text-white/70">Análisis por lotes CSV</span>
              </li>
              <li>
                <span className="text-white/70">Política activa en vivo</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium tracking-[0.14em] text-white/45 uppercase">
              Xpendit
            </p>
            <ul className="m-0 list-none space-y-2 p-0 text-sm">
              <li>
                <a
                  href="https://www.xpendit.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white/70 no-underline transition-colors hover:text-white"
                >
                  Sitio oficial
                  <ArrowUpRight className={iconSm} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.xpendit.com/blog"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white/70 no-underline transition-colors hover:text-white"
                >
                  Blog
                  <ArrowUpRight className={iconSm} aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.xpendit.com/careers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white/70 no-underline transition-colors hover:text-white"
                >
                  Carreras
                  <ArrowUpRight className={iconSm} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Demo técnica. Sin afiliación con Xpendit.</p>
          <p>Motor de reglas Xpendit</p>
        </div>
      </div>
    </footer>
  );
}
