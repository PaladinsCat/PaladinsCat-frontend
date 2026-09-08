/**
 * Render context back link.
 * refs: none
 */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
 * Render context back link.
 * refs: none
 * I/O types: `{ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string } -> JSX.Element`.
 */
export default function ContextBackLink({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const searchParams = useSearchParams();
  const returnTo = safeInternalReturnTo(searchParams.get("returnTo"));
  const href = returnTo ?? fallbackHref;

  return (
    <Link href={href} scroll={returnTo ? false : undefined} className="inline-flex items-center gap-1 text-sm text-pc-text-secondary transition-colors hover:text-pc-accent">
      <span aria-hidden="true">←</span>
      {label.replace(/^←\s*/, "")}
    </Link>
  );
}
