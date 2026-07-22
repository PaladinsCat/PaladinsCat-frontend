import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export type PublicPolicySection = {
  id: string;
  title: string;
  body: string;
  icon: LucideIcon;
  link?: { href: string; label: string };
};

export default function PublicPolicyPage({
  eyebrow,
  title,
  intro,
  updatedLabel,
  updatedDate,
  badges,
  sections,
  notice,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedLabel: string;
  updatedDate: string;
  badges: string[];
  sections: PublicPolicySection[];
  notice: string;
}) {
  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-secondary/90 shadow-2xl backdrop-blur-sm">
      <header className="relative overflow-hidden border-b border-pc-border px-5 py-12 sm:px-10 sm:py-16 lg:px-16">
        <div className="pointer-events-none absolute -right-24 -top-36 h-80 w-80 rounded-full bg-pc-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-pc-accent-alt/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pc-accent">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-pc-text sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-pc-text-secondary sm:text-lg sm:leading-8">{intro}</p>
          </div>
          <div className="rounded-2xl border border-pc-border bg-pc-bg-elevated/75 px-5 py-4 shadow-xl backdrop-blur-sm">
            <div className="text-xs uppercase tracking-wider text-pc-text-muted">{updatedLabel}</div>
            <div className="mt-1 font-semibold text-pc-text">{updatedDate}</div>
          </div>
        </div>
        <div className="relative mt-8 flex flex-wrap gap-2">
          {badges.map((badge) => <span key={badge} className="rounded-full border border-pc-accent/20 bg-pc-accent/10 px-3 py-1.5 text-xs font-medium text-pc-accent-light">{badge}</span>)}
        </div>
      </header>

      <div className="grid gap-10 px-5 py-12 sm:px-10 sm:py-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-16">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 border-l border-pc-border pl-4">
            {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="block rounded-r-lg px-3 py-2 text-xs leading-5 text-pc-text-muted transition-colors hover:bg-pc-accent/10 hover:text-pc-accent">{section.title}</a>)}
          </nav>
        </aside>

        <div className="min-w-0 space-y-4">
          {sections.map(({ id, title: sectionTitle, body, icon: Icon, link }, index) => (
            <article id={id} key={id} className="group scroll-mt-24 rounded-2xl border border-pc-border bg-pc-bg-elevated/75 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-pc-accent-mid sm:p-6">
              <div className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pc-accent/20 bg-pc-accent/10 text-pc-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-mono text-xs text-pc-text-muted">{String(index + 1).padStart(2, "0")}</span>
                    <h2 className="text-lg font-bold text-pc-text sm:text-xl">{sectionTitle.replace(/^\d+\.\s*/, "")}</h2>
                  </div>
                  <p className="text-sm leading-7 text-pc-text-secondary sm:text-[0.95rem]">
                    {body}
                    {link && <>{" "}<a href={link.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-pc-accent hover:text-pc-accent-light">{link.label}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>.</>}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <footer className="border-t border-pc-border bg-pc-bg/55 px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-start gap-4 rounded-2xl border border-pc-accent/20 bg-gradient-to-r from-pc-accent/10 to-pc-accent-alt/[0.08] p-5 sm:p-6">
          <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-pc-accent" aria-hidden="true" />
          <p className="text-sm leading-6 text-pc-text-secondary">{notice}</p>
        </div>
      </footer>
    </div>
  );
}
