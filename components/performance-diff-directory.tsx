/** performance-diff-directory component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingPanel } from "@/components/async-state";
import { PLAYER_DIRECTORY_CARD_CLASS } from "@/components/player-directory-grid";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import { fetchPerformanceDiffPlayers, type AutomaticPerformanceDiffPlayer, type PerformanceDiffMetric } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";
import { hasPlayerTag } from "@/lib/player-tag-threshold";
import PlayersPageHeader from "@/components/ui/players-page-header";
import PlayerDirectorySearch from "@/components/player-directory-search";

const PAGE_SIZE = 32;

type MetricConfig = {
  titleKey: TranslationKey;
  noticeKey: TranslationKey;
  emptyKey: TranslationKey;
  tag: "TANK" | "SUP" | "DPS" | "FLANK" | "NOOB" | "CARRY";
  noticeClass: string;
  dotClass: string;
  cardClass: string;
  badgeClass: string;
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export const PERFORMANCE_DIFF_METRICS: Record<PerformanceDiffMetric, MetricConfig> = {
  "tank-diff": {
    titleKey: "moderation.tankDiffTitle",
    noticeKey: "moderation.tankDiffNotice",
    emptyKey: "moderation.noTankDiff",
    tag: "TANK",
    noticeClass: "border-sky-400/30 bg-sky-400/10 text-sky-50",
    dotClass: "bg-sky-400",
    cardClass: "border-sky-400/20 hover:border-sky-400/40",
    badgeClass: "text-sky-100",
  },
  "support-diff": {
    titleKey: "moderation.supportDiffTitle",
    noticeKey: "moderation.supportDiffNotice",
    emptyKey: "moderation.noSupportDiff",
    tag: "SUP",
    noticeClass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50",
    dotClass: "bg-emerald-400",
    cardClass: "border-emerald-400/20 hover:border-emerald-400/40",
    badgeClass: "text-emerald-100",
  },
  "dps-diff": {
    titleKey: "moderation.dpsDiffTitle",
    noticeKey: "moderation.dpsDiffNotice",
    emptyKey: "moderation.noDpsDiff",
    tag: "DPS",
    noticeClass: "border-orange-400/30 bg-orange-400/10 text-orange-50",
    dotClass: "bg-orange-400",
    cardClass: "border-orange-400/20 hover:border-orange-400/40",
    badgeClass: "text-orange-100",
  },
  "flank-diff": {
    titleKey: "moderation.flankDiffTitle",
    noticeKey: "moderation.flankDiffNotice",
    emptyKey: "moderation.noFlankDiff",
    tag: "FLANK",
    noticeClass: "border-violet-400/30 bg-violet-400/10 text-violet-50",
    dotClass: "bg-violet-400",
    cardClass: "border-violet-400/20 hover:border-violet-400/40",
    badgeClass: "text-violet-100",
  },
  "the-noob": {
    titleKey: "moderation.noobTitle",
    noticeKey: "moderation.noobNotice",
    emptyKey: "moderation.noNoobs",
    tag: "NOOB",
    noticeClass: "border-amber-400/30 bg-amber-400/10 text-amber-50",
    dotClass: "bg-amber-400",
    cardClass: "border-amber-400/20 hover:border-amber-400/40",
    badgeClass: "text-amber-100",
  },
  hypercarry: {
    titleKey: "moderation.hypercarryTitle",
    noticeKey: "moderation.hypercarryNotice",
    emptyKey: "moderation.noHypercarries",
    tag: "CARRY",
    noticeClass: "border-cyan-400/30 bg-cyan-400/10 text-cyan-50",
    dotClass: "bg-cyan-400",
    cardClass: "border-cyan-400/20 hover:border-cyan-400/40",
    badgeClass: "text-cyan-100",
  },
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function PerformanceDiffDirectory({ metric }: { metric: PerformanceDiffMetric }) {
  const { t, formatNumber } = useLocalization();
  const config = PERFORMANCE_DIFF_METRICS[metric];
  const [players, setPlayers] = useState<AutomaticPerformanceDiffPlayer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = usePersistentDirectoryPage(`performanceDiffPage:${metric}`);
  const normalizedQuery = query.trim();
  const requestKey = `${metric}:${normalizedQuery}:${page}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      fetchPerformanceDiffPlayers(metric, {
        name: normalizedQuery || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
        .then((result) => {
          if (!active) return;
          setPlayers(result.players);
          setTotalCount(result.totalCount);
          setLoadedKey(requestKey);
        })
        .catch(() => {
          if (!active) return;
          setPlayers([]);
          setTotalCount(0);
          setLoadedKey(requestKey);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [metric, normalizedQuery, page, requestKey]);

  return (
    <div className="space-y-6">
      <PlayersPageHeader title={t(config.titleKey)} />
      <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${config.noticeClass}`} role="note">
        {t(config.noticeKey)}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PlayerDirectorySearch label={t("generated.players.searchByInGameNameOrPlayerId")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
          <span className="text-xs text-pc-text-muted">{t("moderation.value1AutomaticallyFlaggedPlayers", { value1: formatNumber(totalCount) })}</span>
        </span>
      </div>

      {loading && players.length === 0 ? <LoadingPanel compact /> : players.length === 0 ? (
        <div className="py-8 text-center text-sm text-pc-text-secondary">{t(config.emptyKey)}</div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {players.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className={`${PLAYER_DIRECTORY_CARD_CLASS} items-center justify-between gap-2 ${config.cardClass}`}>
                <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                    <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount} dropper={player.dropper} dropperVoteCount={player.dropperVoteCount} afkWintrade={player.afkWintrade} afkWintradeVoteCount={player.afkWintradeVoteCount} automaticTag={hasPlayerTag(player.metricCount) ? config.tag : undefined} boosted={player.boosted} altAccount={player.altAccount}>
                      {player.name}
                    </PlayerName>
                </div>
                <span className={`w-fit shrink-0 text-xs font-semibold tabular-nums ${config.badgeClass}`}>
                  {formatNumber(player.metricCount)} {t("generated.players.matches.9f3e924")}
                </span>
              </Link>
            ))}
          </div>
          <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
