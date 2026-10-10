/** Assemble localized homepage metadata and discovery links for server rendering. · refs: none */
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import CardIcon, { type CardIconName } from "@/components/card-icon";
import HomePageClient from "./home-page-client";
import { getServerLocalization } from "@/lib/server-localization";
import { getAllPosts, getPostLink } from "@/lib/blog";
import { BLOG_COPY_KEYS } from "@/lib/blog-copy";

/**
 * Keep the homepage canonical URL stable for crawlers.  Returns: `Promise<React.JSX.Element>`. · refs: none
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Render the localized homepage content around the interactive hero. · refs: none
 * I/O types: `none -> Promise<JSX.Element>`.
 */
export default async function HomePage() {
  const [{ t }, posts] = await Promise.all([getServerLocalization(), getAllPosts()]);
  const featuredSlugs = [
    "how-to-read-paladins-statistics",
    "how-paladinscat-counts-active-players",
    "when-match-recovery-stops",
  ];
  const featuredPosts = featuredSlugs.flatMap((slug) => {
    const post = posts.find((candidate) => candidate.slug === slug);
    return post && post.title.trim() && post.excerpt.trim() ? [post] : [];
  });
  const topics = [
    { href: "/players/leaderboard", icon: "trophy" as CardIconName, title: t("menu.rankedLeaderboard"), description: t("seo.home.topic.players.description") },
    { href: "/stats/performance", icon: "chart-histogram" as CardIconName, title: t("menu.performanceOverview"), description: t("seo.home.topic.stats.description") },
    { href: "/stats/activity", icon: "pulse" as CardIconName, title: t("menu.playerActivity"), description: t("seo.home.topic.activity.description") },
    { href: "/stats/tiers", icon: "medal" as CardIconName, title: t("menu.rankedDistribution"), description: t("seo.home.topic.ranks.description") },
    { href: "/operations/paladinscat-bot", icon: "robot" as CardIconName, title: t("menu.paladinsCatBot"), description: t("home.exploreBotTitle") },
    { href: "/game/items", icon: "layers" as CardIconName, title: t("menu.items"), description: t("seo.home.topic.items.description") },
    { href: "/game/maps", icon: "map-marker" as CardIconName, title: t("menu.maps"), description: t("seo.home.topic.maps.description") },
    { href: "/community/diminishing-returns", icon: "calculator" as CardIconName, title: t("diminishingReturns.navLabel"), description: t("seo.home.topic.diminishingReturns.description") },
    { href: "/blog", icon: "newspaper" as CardIconName, title: t("generated.blog.title"), description: t("seo.home.topic.blog.description") },
  ];

  return (
    <HomePageClient>
      <section aria-labelledby="home-articles-heading" className="mt-12 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="home-articles-heading" className="text-2xl font-bold text-pc-text">
            {t(BLOG_COPY_KEYS.title)}
          </h2>
          <Link href="/blog" className="text-sm font-semibold text-pc-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
            {t(BLOG_COPY_KEYS.viewAllPosts)}
          </Link>
        </div>
        {featuredPosts.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <article key={post.slug}>
                <Link href={getPostLink(post.slug)} className="group flex h-full flex-col rounded-2xl border border-pc-border bg-pc-bg-elevated/95 p-5 transition-colors hover:border-pc-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pc-bg">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-pc-text-muted">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-6 text-pc-text group-hover:text-pc-accent">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-pc-text-secondary">{post.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pc-accent">
                    {t(BLOG_COPY_KEYS.readMore)}
                    <CardIcon name="arrow-right" size={16} className="h-4 w-4" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
      <section aria-label={t("seo.home.hub.title")} className="pb-20 sm:pb-0">
        <details className="group mt-12">
          <summary className="pc-glass mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-pc-text shadow-lg transition-colors hover:border-pc-accent-mid hover:text-pc-accent [&::-webkit-details-marker]:hidden">
            {t("seo.home.hub.toggle")}
            <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-5">
            <nav aria-label={t("seo.home.hub.title")} className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {topics.map(({ href, icon, title, description }, index) => (
                <Link key={href} href={href} data-card-accent={index % 4 === 0 ? "primary" : index % 4 === 1 ? "secondary" : index % 4 === 2 ? "tertiary" : "fourth"} className="pc-glass pc-home-feature-card relative flex min-h-28 items-center gap-4 rounded-2xl border border-white/5 p-5 pr-11 shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-pc-bg-elevated/95 hover:shadow-pc-card-hover">
                  <span className="pc-home-card-icon flex h-10 w-10 shrink-0 items-center justify-center">
                    <CardIcon name={icon} className="h-8 w-8" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-pc-text">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-pc-text-muted">{description}</span>
                  </span>
                  <CardIcon name="arrow-right" size={16} className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted" />
                </Link>
              ))}
            </nav>
          </div>
        </details>
      </section>
    </HomePageClient>
  );
}
