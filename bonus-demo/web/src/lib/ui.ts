import type { Estado } from "../api.js";

export const cardClass =
  "bg-surface border border-border rounded-2xl shadow-sm p-6 max-[480px]:p-5 mb-5 animate-fade-up";

export const panelTitleClass =
  "font-display text-xl font-medium tracking-tight mb-1.5";

export const panelDescriptionClass =
  "mb-5 text-ink-muted text-[0.9375rem] leading-normal";

export const inputClass =
  "rounded-md border border-border-strong bg-surface-raised px-2.5 py-2 text-ink transition-[border-color,box-shadow] duration-150 hover:border-ink-muted focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_var(--color-accent-ring)]";

export const labelClass =
  "mb-3 flex flex-col gap-1 text-[0.8125rem] font-medium text-ink-secondary";

export const fieldsetClass =
  "mb-4 rounded-xl border border-border bg-bg px-4.5 pt-4 pb-2";

export const legendClass =
  "px-1.5 font-mono text-[0.6875rem] font-medium tracking-wider uppercase text-ink-muted";

export const formRowClass =
  "grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-3";

export const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4.5 py-2.5 text-sm font-semibold tracking-wide text-btn-text transition-[background,transform,box-shadow] duration-150 ease-out hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(11,100,100,0.22)] active:translate-y-0 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--color-accent-ring)] disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none disabled:shadow-none";

export const mutedClass = "text-ink-muted";

export const errorClass = "mt-3 text-sm text-error";

const statusBadgeBase =
  "inline-flex items-center rounded-full font-mono text-[0.6875rem] font-medium tracking-wide uppercase px-2.5 py-0.5";

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
