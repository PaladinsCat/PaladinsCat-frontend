"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function safeInternalReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function ContextBackLink({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const searchParams = useSearchParams();
  const href = safeInternalReturnTo(searchParams.get("returnTo")) ?? fallbackHref;

  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-pc-text-secondary transition-colors hover:text-pc-accent">
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
