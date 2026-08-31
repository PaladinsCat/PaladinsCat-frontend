import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calculator,
  ChevronDown,
  Layers3,
  MapPinned,
  Medal,
  Newspaper,
  Trophy,
  Users,
} from "lucide-react";
import HomePageClient from "./home-page-client";
import { getServerLocalization } from "@/lib/server-localization";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { t } = await getServerLocalization();
  const topics = [
    { href: "/players/leaderboard", icon: Trophy, title: t("menu.rankedLeaderboard"), description: t("seo.home.topic.players.description") },
    { href: "/stats/performance", icon: BarChart3, title: t("menu.performanceOverview"), description: t("seo.home.topic.stats.description") },
    { href: "/stats/activity", icon: Activity, title: t("menu.playerActivity"), description: t("seo.home.topic.activity.description") },
    { href: "/stats/tiers", icon: Medal, title: t("menu.rankedDistribution"), description: t("seo.home.topic.ranks.description") },
    { href: "/community", icon: Users, title: t("nav.community"), description: t("seo.home.topic.community.description") },
    { href: "/game/items", icon: Layers3, title: t("menu.items"), description: t("seo.home.topic.items.description") },
    { href: "/game/maps", icon: MapPinned, title: t("menu.maps"), description: t("seo.home.topic.maps.description") },
    { href: "/community/diminishing-returns", icon: Calculator, title: t("diminishingReturns.navLabel"), description: t("seo.home.topic.diminishingReturns.description") },
    { href: "/blog", icon: Newspaper, title: t("generated.blog.title"), description: t("seo.home.topic.blog.description") },
  ];

  return (
    <HomePageClient>
      <section aria-label={t("seo.home.hub.title")} className="pb-20 sm:pb-0">
        <details className="group mt-12">
          <summary className="pc-glass mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-pc-text shadow-lg transition-colors hover:border-pc-accent-mid hover:text-pc-accent [&::-webkit-details-marker]:hidden">
            {t("seo.home.hub.toggle")}
            <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-5">
            <nav aria-label={t("seo.home.hub.title")} className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {topics.map(({ href, icon: Icon, title, description }, index) => (
                <Link key={href} href={href} data-card-accent={index % 3 === 0 ? "primary" : index % 3 === 1 ? "secondary" : "tertiary"} className="pc-glass pc-home-feature-card relative flex min-h-28 items-center gap-4 rounded-2xl border border-white/5 p-5 pr-11 shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-pc-bg-elevated/95 hover:shadow-pc-card-hover">
                  <span className="pc-home-card-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-pc-text">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-pc-text-muted">{description}</span>
                  </span>
                  <ArrowRight className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted" aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </div>
        </details>
      </section>
    </HomePageClient>
  );
}
