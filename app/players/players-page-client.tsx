/**
 * Render the PlayersPageClient view for the player players-page-client route.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
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
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";
import PageHeader from "@/components/ui/page-header";

type DirectoryCard = {
  href: string;
  titleKey?: TranslationKey;
  title?: string;
  count?: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  accent: "slate" | "cyan" | "red" | "orange" | "amber" | "violet" | "emerald" | "sky" | "rose" | "fuchsia";
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
 * refs: none
 * I/O types: `{ initialOverview }: { initialOverview: PlayersOverview | null } -> JSX.Element`.
 */
export default function PlayersPageClient({ initialOverview }: { initialOverview: PlayersOverview | null }) {
  const { t, formatNumber } = useLocalization();
  const [communityCounts, setCommunityCounts] = useState(initialOverview?.communityCounts ?? EMPTY_COUNTS);
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
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setOverviewLoading(false);
      });
    return () => { cancelled = true; };
  }, [initialOverview]);

  // Card accents mirror the dominant semantic family used by each destination route.
  const cards = useMemo<DirectoryCard[]>(() => [
    { href: "/players/private-accounts", titleKey: "generated.players.privateAccounts", count: directoryCounts.privateAccounts, icon: LockKeyhole, accent: "slate" },
    { href: "/players/parties", titleKey: "generated.players.rankedParties", count: directoryCounts.parties, icon: UsersRound, accent: "cyan" },
    { href: "/players/cheaters", titleKey: "generated.players.cheaters", count: communityCounts.cheaters, icon: ShieldAlert, accent: "red" },
    { href: "/players/boosted", titleKey: "moderation.boostedPlayers", count: communityCounts.boosted, icon: Award, accent: "orange" },
    { href: "/players/suspicious", titleKey: "generated.players.suspiciousPlayers", count: communityCounts.suspicious, icon: BadgeAlert, accent: "amber" },
    { href: "/players/weirdos", titleKey: "moderation.weirdoTitle", count: communityCounts.weirdos, icon: Sparkles, accent: "violet" },
    { href: "/players/hall-of-fame", titleKey: "moderation.hallOfFameTitle", count: communityCounts.hallOfFame, icon: Award, accent: "emerald" },
    { href: "/players/droppers", titleKey: "moderation.droppersTitle", count: communityCounts.droppers, icon: CircleSlash2, accent: "rose" },
    { href: "/players/afk-wintrade", titleKey: "moderation.afkWintradeTitle", count: communityCounts.afkWintrade, icon: Clock3, accent: "sky" },
    { href: "/players/wall-shooters", titleKey: "moderation.wallShooterTitle", count: directoryCounts.wallShooters, icon: BrickWall, accent: "cyan" },
    { href: "/players/master-feeding", titleKey: "moderation.masterFeedingTitle", count: directoryCounts.masterFeeding, icon: Skull, accent: "rose" },
    { href: "/players/tank-diff", titleKey: "moderation.tankDiffTitle", count: directoryCounts.tankDiff, icon: Shield, accent: "sky" },
    { href: "/players/support-diff", titleKey: "moderation.supportDiffTitle", count: directoryCounts.supportDiff, icon: HeartPulse, accent: "emerald" },
    { href: "/players/dps-diff", titleKey: "moderation.dpsDiffTitle", count: directoryCounts.dpsDiff, icon: Crosshair, accent: "orange" },
    { href: "/players/flank-diff", titleKey: "moderation.flankDiffTitle", count: directoryCounts.flankDiff, icon: Swords, accent: "violet" },
    { href: "/players/the-noob", titleKey: "moderation.noobTitle", count: directoryCounts.noob, icon: CircleHelp, accent: "amber" },
    { href: "/players/hypercarry", titleKey: "moderation.hypercarryTitle", count: directoryCounts.hypercarry, icon: Trophy, accent: "cyan" },
    { href: "/players/alt-accounts", titleKey: "moderation.altAccountsTitle", count: communityCounts.altAccounts, icon: Copy, accent: "fuchsia" },
  ], [communityCounts, directoryCounts]);

  const levelAbbreviation = t("common.playerChampions.level", { level: "" }).trim();
  const accountLevelLabel = [t("generated.players.account"), levelAbbreviation].join(" ");
  const championLevelLabel = [t("generated.players.champion"), levelAbbreviation].join(" ");
  const leaderboardCards = useMemo<DirectoryCard[]>(() => [
    { href: "/players/leaderboard", titleKey: "generated.players.ranked", icon: Trophy, accent: "amber" },
    { href: "/players/elo/account", titleKey: "generated.players.accountElo", icon: Award, accent: "cyan" },
    { href: "/players/elo/champion", titleKey: "generated.players.championElo", icon: Award, accent: "cyan" },
    { href: "/players/performance/account", title: t("stats.scope.performance", { mode: t("generated.players.account") }), icon: Crosshair, accent: "rose" },
    { href: "/players/performance/champion", title: t("stats.scope.performance", { mode: t("generated.players.champion") }), icon: Crosshair, accent: "rose" },
    { href: "/players/levels/account", title: accountLevelLabel, icon: UsersRound, accent: "emerald" },
    { href: "/players/levels/champion", title: championLevelLabel, icon: Swords, accent: "violet" },
  ], [accountLevelLabel, championLevelLabel, t]);

  const renderCard = (card: DirectoryCard) => {
    const Icon = card.icon;
    return (
      <Link key={card.href} href={card.href} data-card-accent={card.accent} className="pc-home-feature-card group flex min-h-20 min-w-0 items-center gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary">
        <Icon aria-hidden={true} className="pc-card-icon h-9 w-9 shrink-0" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-pc-text group-hover:text-pc-accent">{card.title ?? t(card.titleKey!)}</h2>
        </div>
        {card.count != null && <span className="shrink-0 tabular-nums text-sm font-semibold text-pc-text-secondary">
          {overviewLoading ? "…" : formatNumber(card.count)}
        </span>}
        <span className="shrink-0 text-pc-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pc-accent">→</span>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("generated.players.players.392feef")}
        description={t("seo.players.description")}
      />

      <div
        className="mx-auto grid w-full max-w-7xl gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13.5rem), 1fr))" }}
      >
        {cards.map(renderCard)}
      </div>

      <section aria-labelledby="leaderboards-heading" className="space-y-3">
        <h2 id="leaderboards-heading" className="pc-heading text-xl">{t("menu.leaderboards")}</h2>
        <div
          className="mx-auto grid w-full max-w-7xl gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 13.5rem), 1fr))" }}
        >
          {leaderboardCards.map(renderCard)}
        </div>
      </section>

    </div>
  );
}
