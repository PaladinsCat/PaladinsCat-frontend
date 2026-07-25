import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function CardDetailLink({
  href,
  label,
  className = "",
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group/detail inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-pc-border/70 bg-pc-bg/70 px-2.5 py-1.5 text-xs font-semibold text-pc-text-secondary backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pc-accent/50 hover:bg-pc-accent/10 hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent/60 ${className}`}
    >
      <span>{label}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover/detail:translate-x-0.5 group-hover/detail:-translate-y-0.5"
      />
    </Link>
  );
}
