/**
 * Owns the public About page for PaladinsCat.
 *
 * Keeps the project description limited to current user-facing capabilities,
 * data limitations, and the required Hi-Rez independence notice.
 *
 * refs:
 *   doc: documents/01-foundations/commenting-standard.md
 *   doc: documents/06-reference/design/frontend-design-system.md
 */
import Link from "next/link";
import {
  BarChart3,
  Bot,
  ChartNoAxesCombined,
  Gamepad2,
  Search,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { getServerLocalization } from "@/lib/server-localization";

/**
 * Render the localized About page without promotional or unsupported claims.
 *
 * I/O types: `none -> Promise<React.JSX.Element>`.
 * refs: documents/06-reference/design/frontend-design-system.md
 */
export default async function AboutPage() {
  const { t } = await getServerLocalization();
  const capabilities = [
    {
      icon: Search,
      title: t("generated.about.playerProfiles"),
      body: t("generated.about.playerProfilesDesc"),
    },
    {
      icon: ChartNoAxesCombined,
      title: t("generated.about.performanceBenchmarks"),
      body: t("generated.about.statsCompareBody"),
    },
    {
      icon: BarChart3,
      title: t("generated.about.championAnalytics"),
      body: t("generated.about.championAnalyticsDesc"),
    },
    {
      icon: Trophy,
      title: t("generated.about.rankedLeaderboards"),
      body: t("generated.about.leaderboardsDesc"),
    },
    {
      icon: ShieldCheck,
      title: t("generated.about.antiCheatTracking"),
      body: t("generated.about.cheaterTrackedBody"),
    },
    {
      icon: Bot,
      title: t("generated.about.discordCompanion"),
      body: t("generated.about.discordCompanionBody"),
    },
  ];

  return (
    <div className="pc-glass mx-auto max-w-5xl overflow-hidden rounded-2xl border border-pc-border shadow-lg">
      <header className="border-b border-pc-border px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent">
          {t("generated.about.eyebrow")}
        </p>
        <h1 className="pc-heading pc-heading-lg mt-3">{t("generated.about.paladinscat")}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-pc-text-secondary sm:text-lg">
          {t("generated.about.theCompetitiveStatsPlatformForPaladinsPlayersWhoWantTo")}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/players" className="pc-btn-primary justify-center gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            {t("generated.players.search")}
          </Link>
          <Link href="/champions" className="pc-btn-secondary justify-center gap-2">
            <Gamepad2 className="h-4 w-4" aria-hidden="true" />
            {t("generated.about.exploreData")}
          </Link>
        </div>
      </header>

      <section className="px-5 py-10 sm:px-10 sm:py-14 lg:px-14" aria-labelledby="about-capabilities">
        <h2 id="about-capabilities" className="pc-heading pc-heading-md">
          {t("generated.about.featureTitle")}
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border border-pc-border bg-pc-bg-secondary/70 p-5">
              <div className="flex gap-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-pc-accent" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-pc-text">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-pc-text-secondary">{body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-pc-border bg-pc-bg/45 px-5 py-10 sm:px-10 sm:py-12 lg:px-14" aria-labelledby="about-data">
        <h2 id="about-data" className="pc-heading pc-heading-md">
          {t("generated.about.aboutTitle")}
        </h2>
        <div className="mt-4 max-w-3xl space-y-3 text-sm leading-6 text-pc-text-secondary sm:text-base sm:leading-7">
          <p>{t("generated.about.paladinscatIsACommunityDrivenAnalyticsPlatformBuiltForThe")}</p>
          <p>{t("generated.about.thinkOfItAsYourPersonalPaladinsAnalystInsteadOf")}</p>
          <p>{t("generated.about.exceptThisPersonAndMaybeTheUpvotersP")}</p>
          <p>{t("generated.about.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/terms" className="text-pc-accent hover:underline">
            {t("footer.termsOfUse")}
          </Link>
          <Link href="/privacy" className="text-pc-accent hover:underline">
            {t("footer.privacyPolicy")}
          </Link>
        </div>
      </section>
    </div>
  );
}
