/**
 * Define the features landing-page responsibility boundary.
 * Coordinates localized feature discovery and public destination links.
 * refs: documents/06-reference/frontend-design-system.md#page-anatomy
 */
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  ChartNoAxesCombined,
  Layers3,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import { createLocalizedMetadata, getServerLocalization } from "@/lib/server-localization";

export async function generateMetadata() {
  return createLocalizedMetadata("home.newFeatures", {
    descriptionKey: "home.newFeaturesIntro",
    metadata: { alternates: { canonical: "/features" } },
  });
}

/** Render the localized New Features landing page.  Returns: `Promise<React.JSX.Element>`. · refs: none */
export default async function FeaturesPage() {
  const { t } = await getServerLocalization();
  const features = [
    {
      href: "/champions",
      icon: BarChart3,
      title: t("generated.about.championAnalytics"),
      description: t("generated.about.championAnalyticsDesc"),
    },
    {
      href: "/players",
      icon: UsersRound,
      title: t("generated.about.playerProfiles"),
      description: t("generated.about.playerProfilesDesc"),
    },
    {
      href: "/players/leaderboard",
      icon: Trophy,
      title: t("generated.about.rankedLeaderboards"),
      description: t("generated.about.leaderboardsDesc"),
    },
    {
      href: "/stats/performance",
      icon: ChartNoAxesCombined,
      title: t("generated.about.performanceBenchmarks"),
      description: t("generated.about.statsCompareBody"),
    },
    {
      href: "/builds",
      icon: Layers3,
      title: t("generated.about.metaTrends"),
      description: t("generated.about.metaTrendsDesc"),
    },
    {
      href: "/operations/paladinscat-bot",
      icon: Bot,
      title: t("generated.about.discordCompanion"),
      description: t("generated.about.discordCompanionBody"),
    },
  ];
  const spotlight = [
    { icon: BarChart3, label: t("generated.about.championStats") },
    { icon: Trophy, label: t("generated.about.rankedTracking") },
    { icon: Layers3, label: t("generated.about.metaAnalysis") },
  ];

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-elevated/95">
      <section className="relative overflow-hidden border-b border-pc-border px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full bg-pc-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-pc-accent-alt/15 blur-3xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-pc-text-secondary transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t("home.backToHome")}
            </Link>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-pc-accent">{t("home.newFeaturesEyebrow")}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-pc-text sm:text-5xl lg:text-6xl">{t("home.newFeatures")}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-pc-text-secondary">{t("home.newFeaturesIntro")}</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-pc-accent/20 to-pc-accent-alt/15 blur-2xl" />
            <div className="relative rounded-3xl border border-pc-accent/25 bg-pc-bg/65 p-6 shadow-lg sm:p-8">
              <div className="flex items-center gap-4 border-b border-pc-border pb-6">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pc-accent/30 bg-pc-accent/10 text-pc-accent">
                  <Sparkles className="h-7 w-7" aria-hidden="true" />
                </span>
                <div>
                  <div className="text-xl font-bold text-pc-text">{t("home.newFeatures")}</div>
                  <div className="mt-1 text-sm text-pc-accent">{t("home.exploreNewFeatures")}</div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {spotlight.map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-xl border border-pc-border bg-pc-bg-elevated/70 p-4 text-center">
                    <Icon className="mx-auto h-5 w-5 text-pc-accent" aria-hidden="true" />
                    <div className="mt-3 text-xs font-semibold text-pc-text-secondary">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent-alt">{t("home.featureHighlights")}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("home.featureHighlightsTitle")}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-pc-border bg-pc-bg-elevated/70 p-6 transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-pc-accent-mid hover:shadow-pc-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-pc-accent/20 bg-pc-accent/10 text-pc-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-pc-text">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-pc-text-secondary">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-pc-accent">
                {t("home.exploreFeature")}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
