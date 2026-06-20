import { Sparkles } from "lucide-react";
import xpenditLogo from "../../assets/xpendit-logo.svg";
import { iconSm } from "../lib/icons.js";

export function SiteHeader() {
  return (
    <header className="hero-bg text-white">
      <nav className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-5 max-[480px]:px-4">
        <img src={xpenditLogo} alt="Xpendit" className="h-4 w-auto" />
        <span className="rounded-full bg-lime px-3.5 py-1.5 text-xs font-semibold tracking-wide text-ink">
          Demo Bonus
        </span>
      </nav>

      <div className="mx-auto max-w-[1080px] px-6 pb-16 pt-4 text-center max-[480px]:px-4 max-[480px]:pb-12">
        <h1 className="font-display mx-auto max-w-[16ch] text-[clamp(2.25rem,5.5vw,3.75rem)] leading-[1.05] font-medium tracking-tight [font-variation-settings:'opsz'_72]">
          Cada gasto,{" "}
          <em className="italic text-white/90">validado por política</em>
        </h1>
        <p className="mx-auto mt-5 max-w-[48ch] text-[1.0625rem] leading-relaxed text-white/70">
          Elige un flujo, valida un gasto o analiza un lote CSV con el motor
          central de reglas.
        </p>
      </div>
    </header>
  );
}
