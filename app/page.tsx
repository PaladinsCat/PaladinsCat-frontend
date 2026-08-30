import type { Metadata } from "next";
import Link from "next/link";
import HomePageClient from "./home-page-client";
import { getServerLocalization } from "@/lib/server-localization";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { t } = await getServerLocalization();
  const topics = [
    { href: "/stats/winrate", title: t("seo.home.topic.winRates.title"), description: t("seo.home.topic.winRates.description") },
    { href: "/stats/banrate", title: t("seo.home.topic.banRates.title"), description: t("seo.home.topic.banRates.description") },
    { href: "/players/leaderboard", title: t("seo.home.topic.leaderboard.title"), description: t("seo.home.topic.leaderboard.description") },
    { href: "/matches", title: t("seo.home.topic.matches.title"), description: t("seo.home.topic.matches.description") },
    { href: "/builds", title: t("seo.home.topic.builds.title"), description: t("seo.home.topic.builds.description") },
    { href: "/tierlists", title: t("seo.home.topic.tierLists.title"), description: t("seo.home.topic.tierLists.description") },
    { href: "/game/maps", title: t("seo.home.topic.maps.title"), description: t("seo.home.topic.maps.description") },
    { href: "/stats/activity", title: t("seo.home.topic.activity.title"), description: t("seo.home.topic.activity.description") },
  ];

  return (
    <>
      <HomePageClient />
      <section aria-labelledby="paladins-data-topics" className="mx-auto mt-2 max-w-6xl rounded-2xl border border-pc-border bg-pc-bg-elevated/70 p-5 sm:p-7">
        <div className="max-w-3xl">
          <h2 id="paladins-data-topics" className="text-2xl font-bold text-pc-text sm:text-3xl">{t("seo.home.hub.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-pc-text-secondary sm:text-base">{t("seo.home.hub.description")}</p>
        </div>
        <nav aria-label={t("seo.home.hub.title")} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic) => (
            <Link key={topic.href} href={topic.href} className="rounded-xl border border-pc-border bg-pc-bg/60 p-4 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary">
              <span className="block font-semibold text-pc-accent">{topic.title}</span>
              <span className="mt-1 block text-xs leading-5 text-pc-text-muted">{topic.description}</span>
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
