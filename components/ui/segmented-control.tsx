/** Canonical unboxed segmented controls for local state and route navigation. */
import type { ReactNode } from "react";
import Link from "next/link";

type Item<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };

function optionClass(active: boolean) {
  return `inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${active ? "border-pc-accent bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:border-pc-accent-mid hover:text-pc-text"}`;
}

export function SegmentedControl<T extends string>({ label, items, value, onChange }: {
  label: string;
  items: Item<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
    {items.map((item) => <button key={item.value} type="button" aria-pressed={item.value === value} onClick={() => onChange(item.value)} className={optionClass(item.value === value)}>
      {item.icon}{item.label}
    </button>)}
  </div>;
}

export function SegmentedRouteLinks<T extends string>({ label, items, value }: {
  label: string;
  items: Array<Item<T> & { href: string }>;
  value: T;
}) {
  return <nav className="flex flex-wrap gap-2" aria-label={label}>
    {items.map((item) => <Link key={item.value} href={item.href} aria-current={item.value === value ? "page" : undefined} className={optionClass(item.value === value)}>
      {item.icon}{item.label}
    </Link>)}
  </nav>;
}
