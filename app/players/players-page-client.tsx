"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Award,
  BadgeAlert,
  BrickWall,
  CircleSlash2,
  Clock3,
  Copy,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { fetchPlayersOverview, type PlayersOverview } from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

type DirectoryCard = {
  href: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  count: number;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  iconClass: string;
};

const EMPTY_COUNTS: PlayersOverview["communityCounts"] = {
  cheaters: 0,
  boosted: 0,
  suspicious: 0,
  weirdos: 0,
  hallOfFame: 0,
  droppers: 0,
  afkWintrade: 0,
  altAccounts: 0,
};

export default function PlayersPageClient({ initialOverview }: { initialOverview: PlayersOverview | null }) {
  const { t , formatNumber} = useLocalization();
  const [communityCounts, setCommunityCounts] = useState(initialOverview?.communityCounts ?? EMPTY_COUNTS);
  const [directoryCounts, setDirectoryCounts] = useState<PlayersOverview["directoryCounts"]>(initialOverview?.directoryCounts ?? {
    privateAccounts: 0,
    parties: 0,
    wallShooters: 0,
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

  const cards = useMemo<DirectoryCard[]>(() => [
    { href: "/players/private-accounts", titleKey: "generated.players.privateAccounts", descriptionKey: "moderation.accounts", count: directoryCounts.privateAccounts, icon: LockKeyhole, iconClass: "text-slate-300" },
    { href: "/players/parties", titleKey: "generated.players.rankedParties", descriptionKey: "moderation.pairs", count: directoryCounts.parties, icon: UsersRound, iconClass: "text-cyan-300" },
    { href: "/players/cheaters", titleKey: "generated.players.cheaters", descriptionKey: "moderation.accounts", count: communityCounts.cheaters, icon: ShieldAlert, iconClass: "text-red-400" },
    { href: "/players/boosted", titleKey: "moderation.boostedPlayers", descriptionKey: "moderation.accounts", count: communityCounts.boosted, icon: Award, iconClass: "text-orange-300" },
    { href: "/players/suspicious", titleKey: "generated.players.suspiciousPlayers", descriptionKey: "moderation.accounts", count: communityCounts.suspicious, icon: BadgeAlert, iconClass: "text-amber-300" },
    { href: "/players/weirdos", titleKey: "moderation.weirdoTitle", descriptionKey: "moderation.votes", count: communityCounts.weirdos, icon: Sparkles, iconClass: "text-violet-300" },
    { href: "/players/hall-of-fame", titleKey: "moderation.hallOfFameTitle", descriptionKey: "moderation.votes", count: communityCounts.hallOfFame, icon: Award, iconClass: "text-emerald-300" },
    { href: "/players/droppers", titleKey: "moderation.droppersTitle", descriptionKey: "moderation.accounts", count: communityCounts.droppers, icon: CircleSlash2, iconClass: "text-rose-300" },
    { href: "/players/afk-wintrade", titleKey: "moderation.afkWintradeTitle", descriptionKey: "moderation.accounts", count: communityCounts.afkWintrade, icon: Clock3, iconClass: "text-sky-300" },
    { href: "/players/wall-shooters", titleKey: "moderation.wallShooterTitle", descriptionKey: "moderation.wallShooterAccounts", count: directoryCounts.wallShooters, icon: BrickWall, iconClass: "text-cyan-300" },
    { href: "/players/alt-accounts", titleKey: "moderation.altAccountsTitle", descriptionKey: "moderation.accounts", count: communityCounts.altAccounts, icon: Copy, iconClass: "text-fuchsia-300" },
  ], [communityCounts, directoryCounts]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">
          <ScrambleText text={t("generated.players.players.392feef")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
      </div>

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
                <h2 className="truncate text-sm font-semibold text-pc-text group-hover:text-pc-accent">{t(card.titleKey)}</h2>
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
