/** Shared internal detail-route link.
 * refs: none
 */
import Link from "next/link";

/**
 * Render an accessible detail navigation link with the supplied destination, label, and optional classes.
 * I/O types: `{ href, label, className = "", }: { href: string; label: string; className?: string; } -> JSX.Element`.
 * refs: none
 */
export default function DetailLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return <Link
    href={href}
    className={`group/detail inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-pc-text-secondary transition-colors hover:bg-pc-bg-elevated hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent sm:min-h-8 ${className}`}
  >
    <span>{label}</span><span aria-hidden="true">→</span>
  </Link>;
}
