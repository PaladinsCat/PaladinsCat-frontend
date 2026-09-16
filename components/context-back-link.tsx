/**
 * Render the unified browser-history back control with a safe direct-entry fallback.
 * refs: none
 */
"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Accept a leading-slash internal path and reject missing values and protocol-relative // destinations with null.
 * refs: none
 * I/O types: `value: string | null | undefined -> string | null`.
 */
export function safeInternalReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/**
 * Render the unified browser-history back control. Browser history wins so
 * the control returns to the actual previous page; `returnTo` and
 * `fallbackHref` are used only when the page was opened directly.
 * refs: none
 * I/O types: `{ fallbackHref, label = "Back", className }: { fallbackHref: string; label?: ReactNode; className?: string } -> JSX.Element`.
 */
export default function ContextBackLink({
  fallbackHref,
  label = "Back",
  className,
}: {
  fallbackHref: string;
  label?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeInternalReturnTo(searchParams.get("returnTo"));
  const directEntryFallback = returnTo ?? fallbackHref;
  const labelContent = typeof label === "string" ? label.replace(/^←\s*/, "") : label;
  const classes = [
    "inline-flex items-center gap-1 text-sm text-pc-text-secondary transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pc-bg",
    className,
  ].filter(Boolean).join(" ");

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.replace(directEntryFallback);
  }

  return (
    <button type="button" onClick={goBack} className={classes}>
      <span aria-hidden="true">←</span>
      {labelContent}
    </button>
  );
}
