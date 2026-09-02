/** Canonical labelled search field for player directories. · refs: none */
import { Search } from "lucide-react";

export default function PlayerDirectorySearch({ label, value, onChange, className = "sm:max-w-sm" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return <label className={`block w-full space-y-1.5 ${className}`}>
    <span className="block text-xs font-semibold text-pc-text-secondary">{label}</span>
    <span className="relative block">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid" />
    </span>
  </label>;
}
