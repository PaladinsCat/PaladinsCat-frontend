/** Stats directory: server-rendered destinations, localized copy, and matching structured data.
 * refs: none
 */
import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, BarChart3, Coins, Trophy } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import { getServerLocalization } from "@/lib/server-localization";
import { absoluteUrl, serializeJsonLd, SITE_NAME } from "@/lib/seo";

const sections = [
  {
    id: "metrics", titleKey: "stats.portal.gameMetrics",
    cards: [
      { href: "/stats/performance", titleKey: "generated.stats.performanceMetrics", descriptionKey: "stats.portal.performanceDescription", icon: BarChart3, accent: "cyan" },
      { href: "/stats/champions", titleKey: "stats.matchups.title", descriptionKey: "stats.matchups.description", icon: Trophy, accent: "violet" },
      { href: "/stats/ecpm", titleKey: "menu.effectiveCredits", descriptionKey: "stats.portal.ecpmDescription", icon: Coins, accent: "amber" },
    ],
  },
  {
    id: "activity", titleKey: "stats.portal.activity",
    cards: [
      { href: "/stats/tiers", titleKey: "stats.tiers.title", descriptionKey: "stats.portal.tiersDescription", icon: Trophy, accent: "amber" },
      { href: "/stats/activity", titleKey: "menu.playerActivity", descriptionKey: "stats.portal.activityDescription", icon: Activity, accent: "cyan" },
    ],
  },
] as const;

/**
 * Build localized metadata for /stats, including the title and any canonical, description, and crawler directives configured for this route.
 * I/O types: `none -> Promise<Metadata>`.
 * refs: none
 */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerLocalization();
  const title = t("seo.stats.portal.title");
  const description = t("seo.stats.portal.description");
  return {
    title, description,
    alternates: { canonical: "/stats" },
    openGraph: {
      type: "website", url: absoluteUrl("/stats"), siteName: SITE_NAME,
      title, description,
      images: [{ url: "/images/icons/paladinscat.avif", width: 120, height: 120, alt: SITE_NAME }],
    },
    twitter: { card: "summary", title, description, images: ["/images/icons/paladinscat.avif"] },
  };
}

/**
 * Render the /stats route with `PageHeader`.
 * I/O types: `none -> Promise<JSX.Element>`.
 * refs: none
 */
export default async function StatsPage() {
  const { t } = await getServerLocalization();
  const cards = sections.flatMap((section) => [...section.cards]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absoluteUrl("/stats#directory"),
    url: absoluteUrl("/stats"),
    name: t("stats.portal.title"),
    description: t("stats.portal.description"),
    about: { "@type": "VideoGame", name: "Paladins: Champions of the Realm" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cards.map((card, index) => ({
        "@type": "ListItem", position: index + 1,
        name: t(card.titleKey), url: absoluteUrl(card.href),
      })),
    },
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("stats.portal.title")} description={t("stats.portal.description")} />
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`stats-${section.id}`} className="space-y-4">
          <h2 id={`stats-${section.id}`} className="pc-heading text-xl">{t(section.titleKey)}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.cards.map(({ href, titleKey, descriptionKey, icon: Icon, accent }) => (
              <Link key={href} href={href} prefetch={false} data-card-accent={accent}
                className="pc-card pc-home-feature-card group flex min-w-0 flex-col gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pc-accent">
                <div className="flex items-center justify-between gap-4">
                  <Icon aria-hidden="true" className="pc-card-icon h-8 w-8 shrink-0" strokeWidth={1.5} />
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-pc-text-muted transition-colors group-hover:text-pc-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-base font-semibold text-pc-text">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pc-text-secondary">{t(descriptionKey)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
    </div>
  );
}
