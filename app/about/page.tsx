"use client";

import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

export default function AboutPage() {
  const { t } = useLocalization();
  return (
    <div className="space-y-16 max-w-4xl mx-auto text-center">

      {/* ── Hero ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <img src="/images/icons/paladinscat.avif" alt={t("generated.about.paladinscat")} className="w-12 h-12 rounded-xl" />
          <h1 className="text-4xl font-bold text-pc-accent">
            <ScrambleText text={t("generated.about.paladinscat")} speed={30} iterations={15} delayFromCenter={false} />
          </h1>
        </div>
        <p className="text-xl text-pc-text-secondary leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {t("generated.about.theCompetitiveStatsPlatformForPaladinsPlayersWhoWantTo")}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {["Champion Stats", "Ranked Tracking", "Counter Picks", "Meta Analysis", "Player Profiles"].map((tag) => (
            <span key={tag} className="text-xs px-3 py-1 rounded-full bg-pc-accent/10 text-pc-accent border border-pc-accent/20 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── What is it ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-pc-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{t("generated.about.whatIsPaladinscat")}</h2>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6 space-y-4 text-pc-text-secondary leading-relaxed text-left">
          <p>
            {t("generated.about.paladinscatIsACommunityDrivenAnalyticsPlatformBuiltForThe")}</p>
          <p>
            {t("generated.about.thinkOfItAsYourPersonalPaladinsAnalystInsteadOf")}</p>
        </div>
      </section>

      {/* ── Why it exists ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-pc-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{t("generated.about.whyDoesThisExist")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {[
            {
              title: t("generated.about.theDataIsScattered"),
              body: "Win rates live in one place, tier lists in another, and your match history is buried in the game client. PaladinsCat brings it all together.",
            },
            {
              title: t("generated.about.gutFeelingIsnTEnough"),
              body: "Everyone has an opinion on who's S-tier. PaladinsCat replaces guesswork with actual numbers — pick rates, ban rates, counter matchups, and more.",
            },
            {
              title: t("generated.about.rankedIsAGrind"),
              body: "Climbing is hard enough without knowing which champions perform best at your skill level. We break down stats by tier so you see what actually works in Gold, Diamond, or Master.",
            },
            {
              title: t("generated.about.theOldPlatformsAreGone"),
              body: "TheBettermeta and Paladins.guru — two fan-favourite stat platforms — have been discontinued. PaladinsCat picks up where they left off, combining the best of both into one modern, unified experience built to last.",
            },
          ].map((card) => (
            <div key={card.title} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-5 hover:border-pc-accent-mid transition-colors">
              <h3 className="text-pc-text font-semibold text-sm mb-2">{card.title}</h3>
              <p className="text-pc-text-secondary text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What it does ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-pc-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{t("generated.about.whatDoesItDo")}</h2>
        <div className="space-y-3 text-left">
          {[
            {
              icon: "🎯",
              title: t("generated.about.championAnalytics"),
              desc: "Win rates, pick rates, ban rates, and Glicko-2 ratings for all 59 champions. Filter by tier or region to find what's working where you play.",
            },
            {
              icon: "🏆",
              title: t("generated.about.rankedLeaderboards"),
              desc: "See who's on top. Track ranked points, tier progression, and trend movement for the best players in every region.",
            },
            {
              icon: "🔄",
              title: t("generated.about.counterPickData"),
              desc: "Not sure who to pick into Drogoz? The counter-pick engine shows which champions statistically win and lose against any matchup.",
            },
            {
              icon: "📈",
              title: t("generated.about.metaTrends"),
              desc: "Watch the meta shift over time. Weekly win rate trends show which champions are rising, falling, or holding steady across the playerbase.",
            },
            {
              icon: "👤",
              title: t("generated.about.playerProfiles"),
              desc: "Look up any player. See their top champions, match history, win rates, and performance breakdowns across platforms and regions.",
            },
            {
              icon: "🛡",
              title: t("generated.about.antiCheatTracking"),
              desc: "Flagged and confirmed cheaters are tracked publicly. Abnormal accuracy, wall hacks, and stat manipulation are identified and surfaced.",
            },
            {
              icon: "📊",
              title: t("generated.about.performanceBenchmarks"),
              desc: "Compare your damage per minute, healing per minute, and credits per minute against the best players for your champion and class.",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-4 p-4 bg-pc-bg-elevated border border-pc-border rounded-xl hover:border-pc-accent-mid transition-colors">
              <span className="text-2xl shrink-0">{feature.icon}</span>
              <div>
                <h3 className="text-pc-text font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-pc-text-secondary text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who is it for ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-pc-text drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{t("generated.about.whoIsItFor")}</h2>
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-6 space-y-4 text-center">
          <p className="text-pc-text font-semibold text-sm">{t("generated.about.everyone")}</p>
          <p className="text-pc-text-secondary text-sm">
            {t("generated.about.exceptThisPersonAndMaybeTheUpvotersP")}</p>
          <div className="flex justify-center">
            <img
              src="/images/easteregg.avif"
              alt={t("generated.about.paladinscatEasterEgg")}
              className="rounded-xl max-w-md w-full object-cover border border-pc-border"
            />
          </div>
        </div>
      </section>

      {/* ── Attribution ── */}
      <section className="border-t border-pc-border pt-8">
        <p className="text-pc-text-muted text-sm leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          {t("generated.about.paladinscatIsAFanMadeProjectAndIsNotAffiliated")}</p>
      </section>

    </div>
  );
}
