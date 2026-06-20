import type { Estado } from "../api.js";

export const sectionEyebrowClass =
  "mb-3 text-xs font-medium tracking-[0.14em] text-ink-muted uppercase";

export const cardClass =
  "rounded-[1.5rem] border border-border bg-surface p-6 max-[480px]:p-5 animate-fade-up";

export const panelTitleClass =
  "font-display text-2xl font-medium tracking-tight text-ink-secondary mb-1.5 [font-variation-settings:'opsz'_72]";

export const panelDescriptionClass =
  "mb-5 text-[0.9375rem] leading-relaxed text-ink-muted";

export const inputClass =
  "rounded-xl border border-border-strong bg-bg-warm px-3 py-2.5 text-ink transition-[border-color,box-shadow] duration-150 hover:border-ink-muted focus:border-teal-mid focus:outline-none focus:shadow-[0_0_0_3px_rgb(16_30_33_/_0.12)]";

export const labelClass =
  "mb-3 flex flex-col gap-1.5 text-[0.8125rem] font-medium text-ink-secondary";

export const fieldsetClass =
  "mb-4 rounded-2xl border border-border bg-surface-muted px-4 pt-4 pb-2";

export const legendClass =
  "px-1.5 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-muted uppercase";

export const formRowClass =
  "grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-3";

export const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 text-sm font-semibold text-ink transition-[background,transform,box-shadow] duration-150 ease-out hover:bg-lime-hover hover:-translate-y-px hover:shadow-[0_6px_20px_rgb(176_243_31_/_0.35)] active:translate-y-0 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgb(176_243_31_/_0.45)] disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none disabled:shadow-none";

export const mutedClass = "text-ink-muted";

export const errorClass = "mt-3 text-sm text-error";

const statusBadgeBase =
  "inline-flex items-center rounded-full text-[0.6875rem] font-semibold tracking-wide uppercase px-2.5 py-0.5";

export function statusBadgeClass(status: Estado): string {
  switch (status) {
    case "APROBADO":
      return `${statusBadgeBase} bg-approved-bg text-approved-text`;
    case "PENDIENTE":
      return `${statusBadgeBase} bg-pending-bg text-pending-text`;
    case "RECHAZADO":
      return `${statusBadgeBase} bg-rejected-bg text-rejected-text`;
  }
}
