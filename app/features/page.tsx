/**
 * Render the repository-owned New Features document as an editorial route.
 * The page owns the presentation shell while GitHub owns the Markdown content.
 * refs: documents/06-reference/frontend-design-system.md#editorial-or-marketing
 */
import Link from "next/link";
import { ArrowLeft, GitBranch } from "lucide-react";
import { getServerLocalization } from "@/lib/server-localization";
import { getFeatureDocument, getFeatureSourceUrl } from "@/lib/feature-document";
import type { NewFeatureEntry } from "@/lib/feature-feed";

/**
 * Refresh the GitHub-backed document route without making every render a permanent build artifact.
 * refs: documents/06-reference/frontend-async-ui.md#state-selection
 */
export const dynamic = "force-dynamic";
/**
 * The route shell renders per request while the document loader owns its 300-second content cache. · refs: none
 */
export const revalidate = 0;

/**
 * Build metadata from the current repository document, with localized fallback copy when GitHub is unavailable.
 * Returns: `Promise<Metadata>`; no write, auth, or persistence side effect occurs.
 * refs: documents/06-reference/frontend-design-system.md#page-anatomy
 * I/O types: `none -> Promise<{ title: string; description: string; alternates: { canonical: string; }; openGraph: { title: string; description: string; type: "article"; url: string; }; }>`.
 */
export async function generateMetadata() {
  const { t } = await getServerLocalization();
  const document = await getFeatureDocument();
  const title = document?.title || t("home.newFeatures");
  const description = document?.entries[0]?.summary || t("home.newFeaturesIntro");
  return {
    title,
    description,
    alternates: { canonical: "/features" },
    openGraph: { title, description, type: "article" as const, url: "/features" },
  };
}

/**
 * Render the GitHub-backed New Features document.  Returns: `Promise<React.JSX.Element>`. · refs: none
 * I/O types: `none -> Promise<JSX.Element>`.
 */
export default async function FeaturesPage() {
  const { locale, t } = await getServerLocalization();
  const document = await getFeatureDocument();
  const sourceUrl = document?.sourceUrl || getFeatureSourceUrl();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const categoryLabels: Record<NewFeatureEntry["category"], string> = {
    analytics: t("features.category.analytics"), players: t("features.category.players"), champions: t("features.category.champions"),
    stats: t("features.category.stats"), community: t("features.category.community"), experience: t("features.category.experience"),
  };
  const kindLabels: Record<NewFeatureEntry["kind"], string> = {
    new: t("features.kind.new"), improved: t("features.kind.improved"), fixed: t("features.kind.fixed"),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-pc-text-secondary transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("home.backToHome")}
      </Link>

      <section className="rounded-2xl border border-pc-border bg-pc-bg-elevated/95 p-5 shadow-2xl backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-pc-border pb-8">
          <div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-pc-text">{document?.title || t("home.newFeatures")}</h1>
          </div>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-pc-border px-3 py-2 text-sm font-semibold text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            {t("common.github")}
          </a>
        </div>

        <div className="grid gap-4 pt-6 md:grid-cols-2">
          {document?.entries.map((entry) => {
            const content = (
              <>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="text-pc-accent">{kindLabels[entry.kind]}</span>
                  <span className="text-pc-text-muted" aria-hidden="true">·</span>
                  <span className="text-pc-text-secondary">{categoryLabels[entry.category]}</span>
                </div>
                <h2 className="mt-3 text-xl font-bold leading-tight text-pc-text">{entry.title}</h2>
                <p className="mt-2 flex-1 text-base leading-7 text-pc-text-secondary">{entry.summary}</p>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-pc-border pt-3 text-sm text-pc-text-muted">
                  <span>{entry.targetVersion}</span>
                  {entry.status === "upcoming" ? <span>{t("features.upcoming")}</span> : entry.publishedAt ? <time dateTime={entry.publishedAt}>{dateFormatter.format(new Date(entry.publishedAt))}</time> : null}
                </div>
              </>
            );
            const className = "pc-home-feature-card group flex min-h-64 flex-col rounded-xl border border-pc-border bg-pc-bg-secondary/70 p-5 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent";
            if (!entry.href) return <article key={entry.id} className={className}>{content}</article>;
            const external = !entry.href.startsWith("/");
            return external ? (
              <a key={entry.id} href={entry.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
            ) : (
              <Link key={entry.id} href={entry.href} className={className}>{content}</Link>
            );
          })}
        </div>
        {!document?.entries.length ? <p className="pt-6 text-base text-pc-text-secondary">{t("features.empty")}</p> : null}
      </section>
    </div>
  );
}
