/**
 * Define the about page responsibility boundary.
 * Coordinates about page data loading, authorization, and presentation.
 */
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChartNoAxesCombined,
  DatabaseZap,
  Gamepad2,
  GitCompareArrows,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import ScrambleText from "@/components/ScrambleText";
import { getServerLocalization } from "@/lib/server-localization";

/** Render the localized About page and its data-focused project principles. */
export default async function AboutPage() {
  const { t } = await getServerLocalization();
  const principles = [
    { icon: DatabaseZap, title: t("generated.about.theDataIsScattered"), body: t("generated.about.dataScatteredBody") },
    { icon: ChartNoAxesCombined, title: t("generated.about.gutFeelingIsnTEnough"), body: t("generated.about.gutFeelingBody") },
    { icon: Trophy, title: t("generated.about.rankedIsAGrind"), body: t("generated.about.rankedGrindBody") },
    { icon: Sparkles, title: t("generated.about.theOldPlatformsAreGone"), body: t("generated.about.oldPlatformsBody") },
  ];
  const features = [
    { icon: BarChart3, title: t("generated.about.championAnalytics"), body: t("generated.about.championAnalyticsDesc") },
    { icon: Trophy, title: t("generated.about.rankedLeaderboards"), body: t("generated.about.leaderboardsDesc") },
    { icon: GitCompareArrows, title: t("generated.about.counterPickData"), body: t("generated.about.counterPickDesc") },
    { icon: LineChart, title: t("generated.about.metaTrends"), body: t("generated.about.metaTrendsDesc") },
    { icon: Search, title: t("generated.about.playerProfiles"), body: t("generated.about.playerProfilesDesc") },
    { icon: ShieldCheck, title: t("generated.about.antiCheatTracking"), body: t("generated.about.cheaterTrackedBody") },
    { icon: ChartNoAxesCombined, title: t("generated.about.performanceBenchmarks"), body: t("generated.about.statsCompareBody") },
    { icon: Bot, title: t("generated.about.discordCompanion"), body: t("generated.about.discordCompanionBody") },
  ];
  const realmAngles = [
    [t("generated.about.matchResultsAngle"), t("generated.about.matchResultsAngleBody")],
    [t("generated.about.metaAngle"), t("generated.about.metaAngleBody")],
    [t("generated.about.statsAngle"), t("generated.about.statsAngleBody")],
    [t("generated.about.playerBaseAngle"), t("generated.about.playerBaseAngleBody")],
    [t("generated.about.communityAngle"), t("generated.about.communityAngleBody")],
  ];

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-elevated/95">
      <section className="relative overflow-hidden border-b border-pc-border px-5 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="pointer-events-none absolute -right-28 -top-36 h-96 w-96 rounded-full bg-pc-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-1/4 h-80 w-80 rounded-full bg-pc-accent-alt/15 blur-3xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pc-accent">{t("generated.about.eyebrow")}</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-pc-text sm:text-5xl lg:text-6xl">
              <ScrambleText text={t("generated.about.paladinscat")} speed={30} iterations={15} delayFromCenter={false} />
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-pc-text-secondary">{t("generated.about.theCompetitiveStatsPlatformForPaladinsPlayersWhoWantTo")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/champions" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-pc-accent px-6 py-3 text-sm font-bold text-pc-bg shadow-lg shadow-pc-accent/20 transition hover:bg-pc-accent-light">
                <Gamepad2 className="h-5 w-5" aria-hidden="true" />{t("generated.about.exploreData")}<ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/operations/paladinscat-bot" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-pc-accent-alt/40 bg-pc-accent-alt/10 px-6 py-3 text-sm font-bold text-pc-text transition hover:border-pc-accent-alt hover:bg-pc-accent-alt/15">
                <Bot className="h-5 w-5 text-pc-accent-alt" aria-hidden="true" />{t("generated.about.meetDiscordApp")}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {[t("generated.about.championStats"), t("generated.about.rankedTracking"), t("generated.about.metaAnalysis"), t("generated.about.playerProfiles")].map((tag) => <span key={tag} className="rounded-full border border-pc-border bg-pc-bg-elevated/70 px-3 py-1.5 text-xs text-pc-text-secondary">{tag}</span>)}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-2xl bg-gradient-to-br from-pc-accent/20 to-pc-accent-alt/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[var(--pc-bg-secondary)] p-6 shadow-lg sm:p-8">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pc-accent/20 bg-pc-accent/10">
                  <Image src="/images/icons/paladinscat.avif" alt="" width={48} height={48} unoptimized className="h-12 w-12 rounded-xl" />
                </span>
                <div><div className="text-xl font-bold text-white">{t("generated.about.paladinscat")}</div><div className="mt-1 text-sm text-pc-accent">{t("generated.about.platformSummary")}</div></div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {realmAngles.map(([label, value], index) => (
                  <div
                    key={label}
                    className={`rounded-xl border border-white/10 bg-white/[0.04] p-4 ${index === realmAngles.length - 1 ? "col-span-2 flex items-center justify-between gap-4" : ""}`}
                  >
                    <div className="text-xs uppercase tracking-wider text-white/35">{label}</div>
                    <div className={`${index === realmAngles.length - 1 ? "text-right" : "mt-2"} text-sm font-bold text-white/85`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent">{t("generated.about.whatIsPaladinscat")}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("generated.about.aboutTitle")}</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-pc-text-secondary">
            <p>{t("generated.about.paladinscatIsACommunityDrivenAnalyticsPlatformBuiltForThe")}</p>
            <p>{t("generated.about.thinkOfItAsYourPersonalPaladinsAnalystInsteadOf")}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-pc-border bg-pc-bg/55 px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent-alt">{t("generated.about.whyDoesThisExist")}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("generated.about.principlesTitle")}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {principles.map(({ icon: Icon, title, body }) => <article key={title} className="group rounded-2xl border border-pc-border bg-pc-bg-elevated/75 p-6 transition duration-300 hover:-translate-y-0.5 hover:border-pc-accent-mid"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-pc-accent-alt/20 bg-pc-accent-alt/10 text-pc-accent-alt"><Icon className="h-5 w-5" aria-hidden="true" /></span><h3 className="mt-5 text-lg font-bold text-pc-text">{title}</h3><p className="mt-2 text-sm leading-6 text-pc-text-secondary">{body}</p></article>)}
        </div>
      </section>

      <section className="px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent">{t("generated.about.whatDoesItDo")}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-pc-text sm:text-4xl">{t("generated.about.featureTitle")}</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => <article key={title} className="flex gap-4 rounded-2xl border border-pc-border bg-pc-bg-elevated/70 p-5 transition duration-300 hover:border-pc-accent-mid"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pc-accent/10 text-pc-accent"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><h3 className="font-bold text-pc-text">{title}</h3><p className="mt-1.5 text-sm leading-6 text-pc-text-secondary">{body}</p></div></article>)}
        </div>
      </section>

      <section className="border-t border-pc-border px-5 py-14 sm:px-10 sm:py-16 lg:px-16">
        <div className="grid overflow-hidden rounded-2xl border border-pc-accent/20 bg-gradient-to-br from-pc-accent/10 to-pc-accent-alt/[0.08] lg:grid-cols-[0.35fr_1fr]">
          <div className="flex items-center justify-center border-b border-pc-border/70 p-8 lg:border-b-0 lg:border-r"><Users className="h-16 w-16 text-pc-accent" aria-hidden="true" /></div>
          <div className="p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-accent">{t("generated.about.whoIsItFor")}</p><h2 className="mt-3 text-2xl font-bold text-pc-text">{t("generated.about.everyone")}</h2><p className="mt-3 leading-7 text-pc-text-secondary">{t("generated.about.exceptThisPersonAndMaybeTheUpvotersP")}</p></div>
        </div>
        <p className="mx-auto mt-8 max-w-4xl text-center text-xs leading-6 text-pc-text-muted">{t("generated.about.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}</p>
      </section>
    </div>
  );
}
