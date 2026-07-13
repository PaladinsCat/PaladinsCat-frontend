"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  fetchChampionCardStats,
  fetchChampionTalentStats,
  fetchItemDetail,
  fetchItems,
  type ChampionCardStatsResponse,
  type ChampionTalentStatsResponse,
  type ItemStat,
  type MatchFactPlayer,
  type MatchPlayerDetail,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { loadBuildReferenceData, type BuildReferenceData } from "@/lib/build-reference";
import { championSlug } from "@/lib/utils";
import { canonicalLocalImageUrl } from "@/lib/image-assets";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { getStatQuality } from "@/lib/stat-quality";
import { readBrowserResult, writeBrowserResult } from "@/lib/browser-result-cache";
import { LoadingIndicator } from "@/components/async-state";

type Props = { team1Players: MatchPlayerDetail[]; team2Players: MatchPlayerDetail[]; team1Wins: boolean; team2Wins: boolean; factMap: Map<string, MatchFactPlayer> };

// Reuse the exact resolver and source data used by champion/build pages.
// Cache per champion so the 10 match rows do not issue duplicate reference requests.
const referenceByChampion = new Map<number, Promise<BuildReferenceData>>();
const itemMetricsByChampionScope = new Map<string, Promise<ItemStat[]>>();
const itemDetailByChampionScope = new Map<string, ReturnType<typeof fetchItemDetail>>();
const loadoutMetricsByChampionTalentScope = new Map<string, Promise<{
  talents: ChampionTalentStatsResponse;
  cards: ChampionCardStatsResponse;
}>>();
const RESULT_CACHE_PREFIX = "paladinscat:match-build:v1";
const REFERENCE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const METRIC_CACHE_TTL_MS = 5 * 60 * 1000;
const UI_CACHE_TTL_MS = 30 * 60 * 1000;

function normalizeName(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’']/g, "")
    // The live match feed uses the modern "Guerrilla" spelling, while the
    // Strix champion asset and champion-data entry retain "Guerilla".
    .replace(/guerrilla/g, "guerilla")
    .replace(/[^a-z0-9]+/g, "");
}

function getBuildReference(championId: number, championName: string) {
  let promise = referenceByChampion.get(championId);
  if (!promise) {
    const cacheKey = `${RESULT_CACHE_PREFIX}:reference:${championId}`;
    const cached = readBrowserResult<BuildReferenceData>(cacheKey);
    promise = cached
      ? Promise.resolve(cached)
      : loadBuildReferenceData(championId, championSlug(championName))
          .then((value) => writeBrowserResult(cacheKey, value, REFERENCE_CACHE_TTL_MS))
          .catch(() => ({ items: [], cards: [], talents: [] }));
    referenceByChampion.set(championId, promise);
  }
  return promise;
}

function getScopedItemMetrics(championId: number, scope: string, tierMin?: number, tierMax?: number) {
  const key = `${championId}:${scope}`;
  let promise = itemMetricsByChampionScope.get(key);
  if (!promise) {
    const cacheKey = `${RESULT_CACHE_PREFIX}:items:${key}`;
    const cached = readBrowserResult<ItemStat[]>(cacheKey);
    promise = cached
      ? Promise.resolve(cached)
      : fetchItems({ mode: "ranked", championId, limit: 200, tierMin, tierMax })
          .then((value) => writeBrowserResult(cacheKey, value, METRIC_CACHE_TTL_MS))
          .catch(() => []);
    itemMetricsByChampionScope.set(key, promise);
  }
  return promise;
}

function getScopedItemDetail(itemId: number, championId: number, scope: string, tierMin?: number, tierMax?: number) {
  const key = `${itemId}:${championId}:${scope}`;
  let promise = itemDetailByChampionScope.get(key);
  if (!promise) {
    const cacheKey = `${RESULT_CACHE_PREFIX}:item-detail:${key}`;
    const cached = readBrowserResult<Awaited<ReturnType<typeof fetchItemDetail>>>(cacheKey);
    promise = cached !== null
      ? Promise.resolve(cached)
      : fetchItemDetail(itemId, "ranked", { championId, tierMin, tierMax })
          .then((value) => writeBrowserResult(cacheKey, value, METRIC_CACHE_TTL_MS));
    itemDetailByChampionScope.set(key, promise);
  }
  return promise;
}

function getScopedLoadoutMetrics(championId: number, talentId: number | null, scope: string, tierMin?: number, tierMax?: number) {
  const key = `${championId}:${talentId ?? "all"}:${scope}`;
  let promise = loadoutMetricsByChampionTalentScope.get(key);
  if (!promise) {
    const tier = { tierMin, tierMax };
    const cacheKey = `${RESULT_CACHE_PREFIX}:loadout:${key}`;
    const cached = readBrowserResult<Awaited<typeof promise>>(cacheKey);
    promise = cached
      ? Promise.resolve(cached)
      : Promise.all([
          fetchChampionTalentStats(championId, "ranked", tier),
          fetchChampionCardStats(championId, "ranked", talentId, tier),
        ]).then(([talents, cards]) => writeBrowserResult(cacheKey, { talents, cards }, METRIC_CACHE_TTL_MS));
    loadoutMetricsByChampionTalentScope.set(key, promise);
  }
  return promise;
}

function Asset({ sources, alt, level, tone = "border-pc-border" }: { sources: Array<string | null | undefined>; alt: string; level?: number | null; tone?: string }) {
  const candidates = [...new Set(sources.filter((source): source is string => Boolean(source)).map(canonicalLocalImageUrl))];
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [alt, candidates.join("|")]);
  const src = candidates[index];
  if (!src) return <div className="h-9 w-9 rounded border border-pc-border bg-pc-bg-secondary" title={alt} />;
  return <div className="relative shrink-0" title={alt}>
    <img src={src} alt={alt} className={`h-9 w-9 rounded border ${tone} object-cover`} loading="eager" onError={() => setIndex(current => Math.min(current + 1, candidates.length))} />
    {level != null && <span className="absolute -right-1 -top-1 min-w-3 rounded bg-pc-bg px-1 text-center text-[9px] font-bold text-pc-text ring-1 ring-pc-border">{level}</span>}
  </div>;
}

function cleanNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatDescription(description: string | null | undefined, level: number) {
  if (!description) return null;
  return description
    // Hi-Rez reference descriptions carry legacy category/ability markers
    // such as "[Armor]" and "[Dimensional Link]". They are metadata, can be
    // stale, and should not be presented as part of the effect sentence.
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/, "")
    .replace(/\{\s*(?:scale\s*=\s*)?(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\|\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/gi, (_match, base: string, increase: string) => (
      cleanNumber(Number(base) + Number(increase) * Math.max(0, level - 1))
    ))
    .replace(/\{\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/g, (_match, value: string) => (
      cleanNumber(Number(value))
    ));
}

type DetailMetric = {
  winRate: number;
  pickRate: number;
  plays: number;
};

function DetailEntry({
  name,
  description,
  sources,
  level,
  tone,
  label,
  metric,
  showMetrics = false,
  metricsLoaded = false,
  maxPickRate = 1,
  playsLabel = "plays",
  loadingLabel: _loadingLabel,
  href,
  onNavigate,
}: {
  name: string;
  description: ReactNode;
  sources: Array<string | null | undefined>;
  level?: number | null;
  tone?: string;
  label: string;
  metric?: DetailMetric;
  showMetrics?: boolean;
  metricsLoaded?: boolean;
  maxPickRate?: number;
  playsLabel?: string;
  loadingLabel?: string;
  href?: string;
  onNavigate?: () => void;
}) {
  const quality = metric ? getStatQuality(metric.winRate, metric.pickRate, maxPickRate) : null;
  return <article className="flex min-w-0 items-start gap-3 rounded-lg border border-pc-border/70 bg-pc-bg-secondary/45 p-3">
    <Asset sources={sources} alt={name} level={level} tone={tone} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {href ? <Link href={href} onClick={onNavigate} className="text-xs font-semibold text-pc-text transition-colors hover:text-pc-accent hover:underline">{name}</Link> : <h4 className="text-xs font-semibold text-pc-text">{name}</h4>}
        <span className="text-[9px] font-semibold uppercase tracking-wider text-pc-text-muted">{label}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-pc-text-secondary">{description}</p>
      {showMetrics && <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] tabular-nums">
        {metric ? <>
          <span className="rounded-md border px-1.5 py-0.5 font-semibold" style={{ color: quality?.color, borderColor: quality?.borderColor, background: quality?.background }}>WR {metric.winRate.toFixed(1)}%</span>
          <span className="rounded-md border border-pc-border bg-pc-bg px-1.5 py-0.5 text-pc-text-secondary">PR {metric.pickRate.toFixed(1)}%</span>
          <span className="text-pc-text-muted">{metric.plays.toLocaleString()} {playsLabel}</span>
        </> : metricsLoaded ? <span className="text-pc-text-muted">No ranked sample in this lobby scope.</span> : <LoadingIndicator className="gap-1.5 text-[10px]" />}
      </div>}
    </div>
  </article>;
}

function PlayerBuildRow({
  player,
  fact,
  wins,
  lobbyScope,
  lobbyScopeLabel,
  lobbyTierMin,
  lobbyTierMax,
  lobbyTierReady,
  returnTo,
}: {
  player: MatchPlayerDetail;
  fact?: MatchFactPlayer;
  wins: boolean;
  lobbyScope: string;
  lobbyScopeLabel: string;
  lobbyTierMin?: number;
  lobbyTierMax?: number;
  lobbyTierReady: boolean;
  returnTo: string;
}) {
  const champion = player.champion_name || `Champion #${player.champion_id}`;
  const talents = fact?.talents ?? [];
  const cards = fact?.cards ?? [];
  const items = fact?.items ?? [];
  const itemIdsKey = items.map((item) => item.item_id).join(",");
  const selectedTalent = talents[0] ?? null;
  const championPath = `/champions/${championSlug(player.champion_name || "")}`;
  const returnToQuery = encodeURIComponent(returnTo);
  const matchId = returnTo.match(/^\/matches\/(\d+)/)?.[1];
  const preserveMatchPosition = () => {
    if (!matchId) return;
    const cacheKey = `paladinscat:match-scroll:v1:${matchId}`;
    writeBrowserResult(cacheKey, { scrollY: window.scrollY }, UI_CACHE_TTL_MS);
    // Next resets scroll during client navigation. Ignore that synthetic
    // scroll event until the match page mounts again and clears this lock.
    writeBrowserResult(`${cacheKey}:navigating`, true, 10_000);
  };
  const [reference, setReference] = useState<BuildReferenceData | null>(null);
  const [itemMetrics, setItemMetrics] = useState<ItemStat[] | null>(null);
  const [loadoutMetrics, setLoadoutMetrics] = useState<{
    talents: ChampionTalentStatsResponse;
    cards: ChampionCardStatsResponse;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const disclosureId = useId();
  const expandedCacheKey = `${RESULT_CACHE_PREFIX}:expanded:${returnTo}:${player.player_id}`;
  useEffect(() => {
    setExpanded(readBrowserResult<boolean>(expandedCacheKey) ?? false);
  }, [expandedCacheKey]);
  useEffect(() => {
    let cancelled = false;
    getBuildReference(player.champion_id, player.champion_name || "").then((data) => { if (!cancelled) setReference(data); });
    return () => { cancelled = true; };
  }, [player.champion_id, player.champion_name]);
  useEffect(() => {
    if (!expanded || !lobbyTierReady) return;
    let cancelled = false;
    setItemMetrics(null);
    getScopedItemMetrics(player.champion_id, lobbyScope, lobbyTierMin, lobbyTierMax)
      .then(async (rows) => {
        const missingBreakdowns = [...new Set(items.map((item) => item.item_id))]
          .filter((itemId) => !rows.find((row) => row.itemId === itemId)?.breakdown.length);
        if (missingBreakdowns.length === 0) return rows;
        const details = await Promise.all(missingBreakdowns.map((itemId) => (
          getScopedItemDetail(itemId, player.champion_id, lobbyScope, lobbyTierMin, lobbyTierMax)
        )));
        const detailByItem = new Map(details.filter((detail) => detail != null).map((detail) => [detail.itemId, detail]));
        return rows.map((row) => {
          const detail = detailByItem.get(row.itemId);
          return detail ? {
            ...row,
            breakdown: detail.breakdown.map((entry) => ({
              ...entry,
              pickRate: detail.totalUses > 0 ? (row.pickRate ?? 0) * entry.totalUses / detail.totalUses : 0,
            })),
          } : row;
        });
      })
      .then((rows) => { if (!cancelled) setItemMetrics(rows); });
    return () => { cancelled = true; };
  }, [expanded, itemIdsKey, lobbyScope, lobbyTierMax, lobbyTierMin, lobbyTierReady, player.champion_id]);
  useEffect(() => {
    if (!expanded || !lobbyTierReady) return;
    let cancelled = false;
    setLoadoutMetrics(null);
    getScopedLoadoutMetrics(player.champion_id, selectedTalent?.talent_id ?? null, lobbyScope, lobbyTierMin, lobbyTierMax)
      .then((metrics) => { if (!cancelled) setLoadoutMetrics(metrics); });
    return () => { cancelled = true; };
  }, [expanded, lobbyScope, lobbyTierMax, lobbyTierMin, lobbyTierReady, player.champion_id, selectedTalent?.talent_id]);
  const findReference = (kind: "items" | "cards" | "talents", id: number, name: string | null | undefined) => (
    reference?.[kind].find((entry) => entry.id === id)
    ?? reference?.[kind].find((entry) => normalizeName(entry.name) === normalizeName(name))
  );
  const playerName = player.player_name || "PRIVATE";
  const findItemMetric = (itemId: number, itemName: string | null | undefined) => (
    itemMetrics?.find((metric) => metric.itemId === itemId)
    ?? itemMetrics?.find((metric) => normalizeName(metric.itemName) === normalizeName(itemName))
  );
  const selectedTalentMetric = selectedTalent ? (
    loadoutMetrics?.talents.talents.find((metric) => metric.talentId === selectedTalent.talent_id)
    ?? loadoutMetrics?.talents.talents.find((metric) => normalizeName(metric.talentName) === normalizeName(selectedTalent.talent_name))
  ) : undefined;
  const talentMetric: DetailMetric | undefined = selectedTalentMetric ? {
    winRate: selectedTalentMetric.winRate,
    pickRate: (selectedTalentMetric.totalPlays / Math.max(1, loadoutMetrics?.talents.totalMatches ?? 0)) * 100,
    plays: selectedTalentMetric.totalPlays,
  } : undefined;
  const maxLoadoutLevelPickRate = Math.max(1, ...(loadoutMetrics?.cards.cards.flatMap((card) => (
    card.levels.map((level) => (level.plays / Math.max(1, loadoutMetrics.cards.totalMatches)) * 100)
  )) ?? []));
  const cardMetricAtRecordedLevel = (cardId: number, cardName: string | null | undefined, level: number): DetailMetric | undefined => {
    const cardMetric = loadoutMetrics?.cards.cards.find((metric) => metric.cardId === cardId)
      ?? loadoutMetrics?.cards.cards.find((metric) => normalizeName(metric.cardName) === normalizeName(cardName));
    const levelMetric = cardMetric?.levels.find((metric) => metric.level === level);
    if (!levelMetric) return undefined;
    return {
      winRate: levelMetric.winRate,
      pickRate: (levelMetric.plays / Math.max(1, loadoutMetrics?.cards.totalMatches ?? 0)) * 100,
      plays: levelMetric.plays,
    };
  };
  const itemMetricAtRecordedSlotAndLevel = (itemId: number, itemName: string | null | undefined, slot: number, level: number): DetailMetric | undefined => {
    const itemMetric = findItemMetric(itemId, itemName);
    const breakdown = itemMetric?.breakdown.find((metric) => metric.slot === slot && metric.level === level);
    if (!itemMetric || !breakdown) return undefined;
    return {
      winRate: breakdown.winRate,
      pickRate: breakdown.pickRate ?? (itemMetric.totalUsage > 0 ? (itemMetric.pickRate ?? 0) * breakdown.totalUses / itemMetric.totalUsage : 0),
      plays: breakdown.totalUses,
    };
  };
  const maxItemPickRate = Math.max(1, ...items.map((item) => (
    itemMetricAtRecordedSlotAndLevel(item.item_id, item.item_name, item.slot, item.item_level ?? 0)?.pickRate ?? 0
  )));

  return <div className={`border-b border-pc-border/60 last:border-b-0 ${wins ? "bg-emerald-400/[0.025]" : ""}`}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3 lg:min-w-[780px] lg:grid-cols-[240px_1fr_1fr_36px] lg:items-center lg:gap-4 lg:px-4">
      <div className="flex min-w-0 items-center gap-3 pr-2 lg:pr-0">
        <img src={getChampionIconSafe(player.champion_name)} alt={champion} className="h-11 w-11 rounded-lg border border-pc-border object-cover" onError={(event) => { event.currentTarget.src = "/images/champions/Champion_Generic_Icon.avif"; }} />
        <div className="min-w-0"><Link href={`/players/${player.player_id}`} className="block truncate text-sm font-semibold text-pc-text hover:text-pc-accent">{playerName}</Link>{player.champion_name && <Link href={`/champions/${championSlug(player.champion_name)}`} className="text-xs text-pc-text-secondary hover:text-pc-accent">{champion}</Link>}</div>
      </div>
      <div className="col-span-2 lg:col-span-1">
        <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-pc-text-muted lg:hidden">Talent &amp; cards</div>
        <div className="flex flex-wrap items-center gap-1.5">{talents.map(t => { const entry = findReference("talents", t.talent_id, t.talent_name); return <Asset key={`talent-${t.talent_id}`} sources={[entry?.iconUrl, t.icon_url, t.fallback_icon_url]} alt={t.talent_name ?? "Talent"} tone="border-amber-400/40" />; })}{cards.map(c => { const entry = findReference("cards", c.card_id, c.card_name); return <Asset key={`card-${c.card_id}`} sources={[entry?.iconUrl, c.icon_url, c.fallback_icon_url]} alt={c.card_name ?? "Loadout card"} level={c.card_level ?? undefined} tone="border-pc-accent/30" />; })}</div>
      </div>
      <div className="col-span-2 lg:col-span-1">
        <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-pc-text-muted lg:hidden">Purchased items</div>
        <div className="flex flex-wrap items-center gap-1.5">{items.map(i => { const entry = findReference("items", i.item_id, i.item_name); return <Asset key={`item-${i.slot}-${i.item_id}`} sources={[entry?.iconUrl, i.icon_url, i.fallback_icon_url]} alt={i.item_name ?? "Item"} level={i.item_level == null ? undefined : i.item_level + 1} />; })}</div>
      </div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={disclosureId}
        aria-label={`${expanded ? "Collapse" : "Expand"} items and loadout details for ${playerName}`}
        title={`${expanded ? "Collapse" : "Expand"} details`}
        onClick={() => setExpanded((current) => {
          const next = !current;
          writeBrowserResult(expandedCacheKey, next, UI_CACHE_TTL_MS);
          return next;
        })}
        className="col-start-2 row-start-1 flex h-9 w-9 items-center justify-center rounded-lg border border-pc-border bg-pc-bg-secondary text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent lg:col-start-4"
      >
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
    </div>

    {expanded && <div id={disclosureId} className="border-t border-pc-border/60 bg-pc-bg/25 px-3 py-4 lg:px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-pc-border/50 pb-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">Ranked performance</span>
        {lobbyTierReady ? <span className="text-[9px] font-semibold text-pc-accent">{lobbyScopeLabel}</span> : <LoadingIndicator className="gap-1.5 text-[10px]" />}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">Talent &amp; loadout cards</h3>
            <p className="mt-1 text-[10px] text-pc-text-muted">{selectedTalent ? <>Card metrics are filtered by <span className="font-semibold text-pc-accent">{selectedTalent.talent_name ?? "the selected talent"}</span> and use each recorded card level.</> : "No selected talent was recorded; card metrics include all talents."}</p>
          </div>
          {talents.map((talent) => {
            const entry = findReference("talents", talent.talent_id, talent.talent_name);
            const name = talent.talent_name ?? entry?.name ?? `Talent #${talent.talent_id}`;
            return <DetailEntry key={`talent-detail-${talent.talent_id}`} name={name} href={`${championPath}/talents/${talent.talent_id}?returnTo=${returnToQuery}`} onNavigate={preserveMatchPosition} label="Talent" description={formatDescription(entry?.description, 1) ?? (reference ? "Description unavailable." : <LoadingIndicator className="gap-1.5 text-xs" />)} sources={[entry?.iconUrl, talent.icon_url, talent.fallback_icon_url]} tone="border-amber-400/40" metric={talentMetric} showMetrics metricsLoaded={loadoutMetrics !== null} maxPickRate={100} />;
          })}
          {cards.map((card) => {
            const entry = findReference("cards", card.card_id, card.card_name);
            const level = Math.max(1, card.card_level ?? 1);
            const name = card.card_name ?? entry?.name ?? `Card #${card.card_id}`;
            const query = new URLSearchParams({ returnTo });
            if (selectedTalent) query.set("talentId", String(selectedTalent.talent_id));
            return <DetailEntry key={`card-detail-${card.card_id}`} name={name} href={`${championPath}/cards/${card.card_id}?${query.toString()}`} onNavigate={preserveMatchPosition} label={`Card · level ${level}`} description={formatDescription(entry?.description, level) ?? (reference ? "Description unavailable." : <LoadingIndicator className="gap-1.5 text-xs" />)} sources={[entry?.iconUrl, card.icon_url, card.fallback_icon_url]} level={level} tone="border-pc-accent/30" metric={cardMetricAtRecordedLevel(card.card_id, card.card_name, level)} showMetrics metricsLoaded={loadoutMetrics !== null} maxPickRate={maxLoadoutLevelPickRate} playsLabel="picks" />;
          })}
          {talents.length === 0 && cards.length === 0 && <p className="text-xs text-pc-text-muted">No talent or loadout cards were recorded.</p>}
        </section>

        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">Purchased items</h3>
          {items.map((item) => {
            const entry = findReference("items", item.item_id, item.item_name);
            const level = Math.max(1, (item.item_level ?? 0) + 1);
            const name = item.item_name ?? entry?.name ?? `Item #${item.item_id}`;
            const description = entry?.description ?? item.description;
            const itemMetric = itemMetricAtRecordedSlotAndLevel(item.item_id, item.item_name, item.slot, item.item_level ?? 0);
            return <DetailEntry key={`item-detail-${item.slot}-${item.item_id}`} name={name} href={`/stats/items/${item.item_id}?returnTo=${returnToQuery}`} onNavigate={preserveMatchPosition} label={`Item · slot ${item.slot} · level ${level}`} description={formatDescription(description, level) ?? (reference ? "Description unavailable." : <LoadingIndicator className="gap-1.5 text-xs" />)} sources={[entry?.iconUrl, item.icon_url, item.fallback_icon_url]} level={level} metric={itemMetric} showMetrics metricsLoaded={itemMetrics !== null} maxPickRate={maxItemPickRate} playsLabel="uses" />;
          })}
          {items.length === 0 && <p className="text-xs text-pc-text-muted">No purchased items were recorded.</p>}
        </section>
      </div>
    </div>}
  </div>;
}

export default function ItemsLoadoutsSection({ team1Players, team2Players, team1Wins, team2Wins, factMap }: Props) {
  const { filter: lobbyScope, definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
  const rows = (players: MatchPlayerDetail[], wins: boolean) => players.map(p => <PlayerBuildRow key={p.player_id} player={p} fact={factMap.get(String(p.player_id))} wins={wins} lobbyScope={lobbyScope} lobbyScopeLabel={lobbyTier.label} lobbyTierMin={lobbyTier.tierMin} lobbyTierMax={lobbyTier.tierMax} lobbyTierReady={lobbyTierReady} returnTo={returnTo} />);
  return <section className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-pc-border px-4 py-3"><div><h2 className="text-lg font-bold uppercase tracking-wide text-pc-text">Items &amp; Loadouts</h2><p className="mt-0.5 text-xs text-pc-text-muted">Talent and cards · purchased items · expand a row for descriptions</p></div></div><div className="overflow-x-hidden lg:overflow-x-auto"><div className="hidden min-w-[780px] grid-cols-[240px_1fr_1fr_36px] gap-4 border-b border-pc-border bg-pc-bg-secondary/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted lg:grid"><span>Champion / player</span><span>Loadout</span><span>Items</span><span className="sr-only">Details</span></div>{rows(team1Players, team1Wins)}<div className="flex items-center gap-3 bg-pc-bg-secondary/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-pc-text-muted"><span className={`h-1.5 w-1.5 rounded-full ${team2Wins ? "bg-emerald-400" : "bg-red-400"}`} />Opposing team</div>{rows(team2Players, team2Wins)}</div></section>;
}
