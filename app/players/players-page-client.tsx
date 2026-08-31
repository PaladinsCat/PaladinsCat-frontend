/**
 * Define the player route surface for players-page-client and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Award,
  BadgeAlert,
  BrickWall,
  CircleSlash2,
  Clock3,
  Crosshair,
  Copy,
  CircleHelp,
  HeartPulse,
  LockKeyhole,
  Shield,
  ShieldAlert,
  Skull,
  Sparkles,
  Swords,
  Trophy,
  UsersRound,
} from "lucide-react";
import { fetchPlayersOverview, type PlayersOverview } from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";
import PlayerName from "@/components/player-name";

type DirectoryCard = {
  href: string;
  titleKey?: TranslationKey;
  title?: string;
  descriptionKey: TranslationKey;
  count: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  iconClass: string;
};

const EMPTY_COUNTS: PlayersOverview["communityCounts"] = {
  cheaters: 0,
  exploiters: 0,
  boosted: 0,
  suspicious: 0,
  weirdos: 0,
  hallOfFame: 0,
  droppers: 0,
  afkWintrade: 0,
  altAccounts: 0,
};

/**
 * Render the PlayersPageClient view for the player players-page-client route.
 * Returns the React tree for the route and its declared inputs.
 */
export default function PlayersPageClient({ initialOverview }: { initialOverview: PlayersOverview | null }) {
  const { t, formatNumber, formatDateTime } = useLocalization();
  const [communityCounts, setCommunityCounts] = useState(initialOverview?.communityCounts ?? EMPTY_COUNTS);
  const [bestDuo, setBestDuo] = useState(initialOverview?.bestDuo ?? null);
  const [directoryCounts, setDirectoryCounts] = useState<PlayersOverview["directoryCounts"]>(initialOverview?.directoryCounts ?? {
    privateAccounts: 0,
    parties: 0,
    wallShooters: 0,
    masterFeeding: 0,
    tankDiff: 0,
    supportDiff: 0,
    dpsDiff: 0,
    flankDiff: 0,
    noob: 0,
    hypercarry: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(initialOverview == null);

  useEffect(() => {
    if (initialOverview) return;
    let cancelled = false;
    fetchPlayersOverview()
      .then((overview) => {
        if (cancelled) return;
        setCommunityCounts(overview.communityCounts);
        setDirectoryCounts(overview.directoryCounts);
        setBestDuo(overview.bestDuo);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => { cancelled = true; };
  }, [initialOverview]);

  const cards = useMemo<DirectoryCard[]>(() => [
    { href: "/players/private-accounts", titleKey: "generated.players.privateAccounts", descriptionKey: "moderation.accounts", count: directoryCounts.privateAccounts, icon: LockKeyhole, iconClass: "text-slate-300" },
    { href: "/players/parties", titleKey: "generated.players.rankedParties", descriptionKey: "moderation.pairs", count: directoryCounts.parties, icon: UsersRound, iconClass: "text-cyan-300" },
    { href: "/players/cheaters", titleKey: "generated.players.cheaters", descriptionKey: "moderation.accounts", count: communityCounts.cheaters, icon: ShieldAlert, iconClass: "text-red-400" },
    { href: "/players/exploiters", titleKey: "moderation.exploiterTitle", descriptionKey: "moderation.accounts", count: communityCounts.exploiters, icon: ShieldAlert, iconClass: "text-orange-400" },
    { href: "/players/boosted", titleKey: "moderation.boostedPlayers", descriptionKey: "moderation.accounts", count: communityCounts.boosted, icon: Award, iconClass: "text-orange-300" },
    { href: "/players/suspicious", titleKey: "generated.players.suspiciousPlayers", descriptionKey: "moderation.accounts", count: communityCounts.suspicious, icon: BadgeAlert, iconClass: "text-amber-300" },
    { href: "/players/weirdos", titleKey: "moderation.weirdoTitle", descriptionKey: "moderation.votes", count: communityCounts.weirdos, icon: Sparkles, iconClass: "text-violet-300" },
    { href: "/players/hall-of-fame", titleKey: "moderation.hallOfFameTitle", descriptionKey: "moderation.votes", count: communityCounts.hallOfFame, icon: Award, iconClass: "text-emerald-300" },
    { href: "/players/droppers", titleKey: "moderation.droppersTitle", descriptionKey: "moderation.accounts", count: communityCounts.droppers, icon: CircleSlash2, iconClass: "text-rose-300" },
    { href: "/players/afk-wintrade", titleKey: "moderation.afkWintradeTitle", descriptionKey: "moderation.accounts", count: communityCounts.afkWintrade, icon: Clock3, iconClass: "text-sky-300" },
    { href: "/players/wall-shooters", titleKey: "moderation.wallShooterTitle", descriptionKey: "moderation.wallShooterAccounts", count: directoryCounts.wallShooters, icon: BrickWall, iconClass: "text-cyan-300" },
    { href: "/players/master-feeding", titleKey: "moderation.masterFeedingTitle", descriptionKey: "moderation.masterFeedingAccounts", count: directoryCounts.masterFeeding, icon: Skull, iconClass: "text-rose-300" },
    { href: "/players/tank-diff", titleKey: "moderation.tankDiffTitle", descriptionKey: "moderation.performanceDiffAccounts", count: directoryCounts.tankDiff, icon: Shield, iconClass: "text-sky-300" },
    { href: "/players/support-diff", titleKey: "moderation.supportDiffTitle", descriptionKey: "moderation.performanceDiffAccounts", count: directoryCounts.supportDiff, icon: HeartPulse, iconClass: "text-emerald-300" },
    { href: "/players/dps-diff", titleKey: "moderation.dpsDiffTitle", descriptionKey: "moderation.performanceDiffAccounts", count: directoryCounts.dpsDiff, icon: Crosshair, iconClass: "text-orange-300" },
    { href: "/players/flank-diff", titleKey: "moderation.flankDiffTitle", descriptionKey: "moderation.performanceDiffAccounts", count: directoryCounts.flankDiff, icon: Swords, iconClass: "text-violet-300" },
    { href: "/players/the-noob", titleKey: "moderation.noobTitle", descriptionKey: "moderation.performanceDiffAccounts", count: directoryCounts.noob, icon: CircleHelp, iconClass: "text-amber-300" },
    { href: "/players/hypercarry", titleKey: "moderation.hypercarryTitle", descriptionKey: "moderation.performanceDiffAccounts", count: directoryCounts.hypercarry, icon: Trophy, iconClass: "text-cyan-300" },
    { href: "/players/alt-accounts", titleKey: "moderation.altAccountsTitle", descriptionKey: "moderation.accounts", count: communityCounts.altAccounts, icon: Copy, iconClass: "text-fuchsia-300" },
  ], [communityCounts, directoryCounts]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">
          <ScrambleText text={t("generated.players.players.392feef")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
      </div>

      {bestDuo && (
        <Link href="/players/parties?view=pairs" data-card-accent="primary" className="pc-glass group relative block overflow-hidden rounded-2xl border border-white/5 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10"><UsersRound aria-hidden="true" className="h-7 w-7 text-cyan-300" /></span>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t("common.bestDuo.title")}</div>
                <h2 className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xl font-bold text-pc-text">
                  <PlayerName playerId={bestDuo.sourcePlayerId}>{bestDuo.sourcePlayerName}</PlayerName><span className="text-cyan-300">+</span><PlayerName playerId={bestDuo.targetPlayerId}>{bestDuo.targetPlayerName}</PlayerName>
                </h2>
                <p className="mt-1 text-sm text-pc-text-muted">{t("common.bestDuo.description")}</p>
              </div>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-pc-bg-secondary/70 px-3 py-2"><div className="text-xs text-pc-text-muted">{t("generated.players.matches")}</div><div className="font-mono text-lg font-bold text-cyan-300">{formatNumber(bestDuo.matchCount)}</div></div>
              <div className="rounded-xl bg-pc-bg-secondary/70 px-3 py-2"><div className="text-xs text-pc-text-muted">{t("generated.players.firstObserved")}</div><div className="text-xs font-semibold text-pc-text">{formatDateTime(bestDuo.firstSeen)}</div></div>
              <div className="rounded-xl bg-pc-bg-secondary/70 px-3 py-2"><div className="text-xs text-pc-text-muted">{t("generated.players.lastObserved")}</div><div className="text-xs font-semibold text-pc-text">{formatDateTime(bestDuo.lastSeen)}</div></div>
              <div className="rounded-xl bg-pc-bg-secondary/70 px-3 py-2"><div className="text-xs text-pc-text-muted">{t("common.bestDuo.observedDays", { count: formatNumber(bestDuo.observedDays) })}</div><div className="text-xs font-semibold text-emerald-300">{t("common.bestDuo.matchesPerWeek", { count: formatNumber(bestDuo.matchesPerWeek, { maximumFractionDigits: 1 }) })}</div></div>
            </div>
          </div>
        </Link>
      )}

      <div
        className="mx-auto grid w-full max-w-7xl gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13.5rem), 1fr))" }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="group flex min-h-20 min-w-0 items-center gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary">
              <Icon aria-hidden={true} className={`h-9 w-9 shrink-0 ${card.iconClass}`} strokeWidth={1.5} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold text-pc-text group-hover:text-pc-accent">{card.title ?? t(card.titleKey!)}</h2>
                <p className="mt-0.5 truncate text-xs text-pc-text-muted">
                  {overviewLoading ? t("moderation.loadingDirectory") : t(card.descriptionKey, { value1: formatNumber(card.count) })}
                </p>
              </div>
              <span className="shrink-0 text-pc-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pc-accent">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
