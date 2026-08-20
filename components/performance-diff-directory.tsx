"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayerName from "@/components/player-name";
import { fetchPerformanceDiffPlayers, type AutomaticPerformanceDiffPlayer, type PerformanceDiffMetric } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";
import { hasPlayerTag } from "@/lib/player-tag-threshold";

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

export const PERFORMANCE_DIFF_METRICS: Record<PerformanceDiffMetric, MetricConfig> = {
  "tank-diff": {
    titleKey: "moderation.tankDiffTitle",
    noticeKey: "moderation.tankDiffNotice",
    emptyKey: "moderation.noTankDiff",
    tag: "TANK",
    noticeClass: "border-sky-400/30 bg-sky-400/10 text-sky-50",
    dotClass: "bg-sky-400",
    cardClass: "border-sky-400/20 hover:border-sky-400/40",
    badgeClass: "border-sky-400/30 bg-sky-400/15 text-sky-100",
  },
  "support-diff": {
    titleKey: "moderation.supportDiffTitle",
    noticeKey: "moderation.supportDiffNotice",
    emptyKey: "moderation.noSupportDiff",
    tag: "SUP",
    noticeClass: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50",
    dotClass: "bg-emerald-400",
    cardClass: "border-emerald-400/20 hover:border-emerald-400/40",
    badgeClass: "border-emerald-400/30 bg-emerald-400/15 text-emerald-100",
  },
  "dps-diff": {
    titleKey: "moderation.dpsDiffTitle",
    noticeKey: "moderation.dpsDiffNotice",
    emptyKey: "moderation.noDpsDiff",
    tag: "DPS",
    noticeClass: "border-orange-400/30 bg-orange-400/10 text-orange-50",
    dotClass: "bg-orange-400",
    cardClass: "border-orange-400/20 hover:border-orange-400/40",
    badgeClass: "border-orange-400/30 bg-orange-400/15 text-orange-100",
  },
  "flank-diff": {
    titleKey: "moderation.flankDiffTitle",
    noticeKey: "moderation.flankDiffNotice",
    emptyKey: "moderation.noFlankDiff",
    tag: "FLANK",
    noticeClass: "border-violet-400/30 bg-violet-400/10 text-violet-50",
    dotClass: "bg-violet-400",
    cardClass: "border-violet-400/20 hover:border-violet-400/40",
    badgeClass: "border-violet-400/30 bg-violet-400/15 text-violet-100",
  },
  "the-noob": {
    titleKey: "moderation.noobTitle",
    noticeKey: "moderation.noobNotice",
    emptyKey: "moderation.noNoobs",
    tag: "NOOB",
    noticeClass: "border-amber-400/30 bg-amber-400/10 text-amber-50",
    dotClass: "bg-amber-400",
    cardClass: "border-amber-400/20 hover:border-amber-400/40",
    badgeClass: "border-amber-400/30 bg-amber-400/15 text-amber-100",
  },
  hypercarry: {
    titleKey: "moderation.hypercarryTitle",
    noticeKey: "moderation.hypercarryNotice",
    emptyKey: "moderation.noHypercarries",
    tag: "CARRY",
    noticeClass: "border-cyan-400/30 bg-cyan-400/10 text-cyan-50",
    dotClass: "bg-cyan-400",
    cardClass: "border-cyan-400/20 hover:border-cyan-400/40",
    badgeClass: "border-cyan-400/30 bg-cyan-400/15 text-cyan-100",
  },
};

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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <Link href="/players" className="mb-2 inline-block text-xs text-pc-accent hover:underline">{t("generated.players.players")}</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t(config.titleKey)}</h1>
        <div className={`mt-3 rounded-xl border px-4 py-3 text-sm font-medium backdrop-blur-md ${config.noticeClass}`} role="note">
          {t(config.noticeKey)}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">{t("generated.players.searchByInGameNameOrPlayerId")}</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={t("generated.players.searchByInGameNameOrPlayerId")} className="w-full rounded-xl border border-pc-border bg-pc-bg-elevated py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted focus:border-pc-accent-mid" />
        </label>
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
              <Link key={player.id} href={`/players/${player.id}`} className={`flex min-h-24 h-full flex-col gap-2 rounded-xl border bg-pc-bg-elevated p-3 transition-colors ${config.cardClass}`}>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 truncate text-sm font-semibold text-pc-text">
                    <PlayerName playerId={player.id} cheater={player.cheater} susCount={player.susCount} dropper={player.dropper} dropperVoteCount={player.dropperVoteCount} afkWintrade={player.afkWintrade} afkWintradeVoteCount={player.afkWintradeVoteCount} automaticTag={hasPlayerTag(player.metricCount) ? config.tag : undefined} boosted={player.boosted} altAccount={player.altAccount}>
                      {player.name}
                    </PlayerName>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${config.badgeClass}`}>
                    {t("moderation.value1FlaggedMatches", { value1: formatNumber(player.metricCount) })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
