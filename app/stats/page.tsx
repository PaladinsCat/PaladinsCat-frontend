/** Stats directory: server-rendered destinations, localized copy, and matching structured data.
 * refs: none
 */
import type { Metadata } from "next";
import PageHeader from "@/components/ui/page-header";
import StatsPortalDashboard from "@/components/stats-portal-dashboard";
import { getServerLocalization } from "@/lib/server-localization";
import { absoluteUrl, serializeJsonLd, SITE_NAME } from "@/lib/seo";

const destinations = [
  ["/stats/performance", "generated.stats.performanceMetrics"],
  ["/stats/champions", "stats.matchups.title"],
  ["/stats/loadouts", "stats.loadouts.title"],
  ["/stats/skins", "menu.skinStats"],
  ["/stats/items", "menu.items"],
  ["/stats/maps", "menu.maps"],
  ["/stats/compositions", "menu.teamCompositions"],
  ["/stats/ecpm", "menu.effectiveCredits"],
  ["/stats/tiers", "stats.tiers.title"],
  ["/stats/activity", "menu.playerActivity"],
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
      itemListElement: destinations.map(([href, titleKey], index) => ({
        "@type": "ListItem", position: index + 1,
        name: t(titleKey), url: absoluteUrl(href),
      })),
    },
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("stats.portal.title")} description={t("stats.portal.description")} />
      <StatsPortalDashboard />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />
    </div>
  );
}
