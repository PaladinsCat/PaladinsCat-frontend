/** context-back-link component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `string | null`
 * refs: none
 */
export function safeInternalReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
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
