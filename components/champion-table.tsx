/**
 * Render champion table with `ArrowUp`, `ArrowDown`.
 * refs: none
 */
"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import TagCriteriaTip from "@/components/tag-criteria-tip";
import { fetchChampions, type Champion, type PublicStatsScope } from "@/lib/api-client";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { useLocalization } from "@/lib/localization-context";
import { getStoredLobbyTierFilter } from "@/lib/lobby-tier";
import { fetchChampionMatchupPreviews, type ChampionRelationship } from "@/lib/champion-matchups-api";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ROUTE_CONTENT_SETTLE_MS } from "@/lib/route-transition-context";

const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

type MatchupPreview = {
  strong: ChampionRelationship[];
  weak: ChampionRelationship[];
};

const MATCHUP_PREVIEW_EXCLUSIONS = new Set(["cassie", "kasumi"]);

/** Build the guaranteed base list: all 59 champions, no stats. · refs: none */
function buildStaticBase(): Champion[] {
  return STATIC_CHAMPIONS.map((c) => ({
    id: c.id,
    name: c.name,
    roles: c.roles,
    winRate: null,
    pickRate: null,
    banRate: null,
    rating: null,
    ratingDeviation: null,
    volatility: null,
    totalMatches: null,
    totalPlays: null,
    wins: null,
    imagePath: getChampionIconSafe(c.name),
  }));
}

function mergeChampionStats(rows: Champion[]): Champion[] {
  const statsByName = new Map(rows.map((row) => [championSlug(row.name), row]));
  return buildStaticBase().map((champion) => {
    const stats = statsByName.get(championSlug(champion.name));
    return stats
      ? {
          ...champion,
          ...stats,
          name: stats.name || champion.name,
          imagePath: stats.imagePath || champion.imagePath,
        }
      : champion;
  });
}

/**
 * Render champion table with `ArrowUp`, `ArrowDown`.
 * refs: none
 * I/O types: `{ initialChampions = null }: { initialChampions?: Champion[] | null } -> JSX.Element`.
 */
export default function ChampionTable({
  initialChampions = null,
  relationshipDirectory = false,
}: {
  initialChampions?: Champion[] | null;
  relationshipDirectory?: boolean;
}) {
  const { t , formatNumber} = useLocalization();
  const hasInitialChampions = Boolean(initialChampions?.length);
  const [champions, setChampions] = useState<Champion[]>(() => (
    hasInitialChampions ? mergeChampionStats(initialChampions ?? []) : buildStaticBase()
  ));
  const [dbAvailable, setDbAvailable] = useState<boolean | null>(relationshipDirectory || hasInitialChampions ? true : null); // null = checking
  const [matchupPreviewState, setMatchupPreviewState] = useState<{
    scope: string;
    previews: Map<number, MatchupPreview>;
  }>({ scope: "", previews: new Map() });
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "popularity">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [statsScope] = useState<PublicStatsScope>("ranked");
  const deferredFilterRole = useDeferredValue(filterRole);
  const deferredSortBy = useDeferredValue(sortBy);
  const deferredSortDir = useDeferredValue(sortDir);

  // Try to fetch DB stats in the background and merge them in
  useEffect(() => {
    if (relationshipDirectory) return;
    if (hasInitialChampions && statsScope === "ranked" && getStoredLobbyTierFilter() === "all") return;

    let cancelled = false;
    let revealTimer: number | undefined;
    const entranceStartedAt = performance.now();

    const revealAfterEntrance = (reveal: () => void) => {
      const elapsed = performance.now() - entranceStartedAt;
      const remaining = Math.max(0, ROUTE_CONTENT_SETTLE_MS - elapsed);
      revealTimer = window.setTimeout(() => {
        if (!cancelled) reveal();
      }, remaining);
    };

    async function tryFetchStats() {
      try {
        if (!hasInitialChampions || statsScope !== "ranked") {
          setDbAvailable(null);
          setChampions(buildStaticBase());
        }
        const data = await fetchChampions({ scope: statsScope });
        if (cancelled) return;

        if (data.length > 0) {
          // DB is up: merge stats into the guaranteed static champion list.
          //
          // The static fallback data predates the canonical reference import and
          // has a few punctuation differences, most visibly "Mal Damba" vs the
          // database/reference spelling "Mal'Damba".  Joining by the route slug
          // keeps the visible list durable without requiring every fallback name
          // to exactly match the live database string.
          const statsByName = new Map(data.map((d) => [championSlug(d.name), d]));
          revealAfterEntrance(() => {
            setChampions((prev) =>
              prev.map((c) => {
                const dbData = statsByName.get(championSlug(c.name));
                if (dbData) {
                  return {
                    ...c,
                    name: dbData.name || c.name,
                    winRate: dbData.winRate ?? c.winRate,
                    pickRate: dbData.pickRate ?? c.pickRate,
                    banRate: dbData.banRate ?? c.banRate,
                    rating: dbData.rating ?? c.rating,
                    totalMatches: dbData.totalMatches ?? c.totalMatches,
                    totalPlays: dbData.totalPlays ?? c.totalPlays,
                    wins: dbData.wins ?? c.wins,
                    imagePath: dbData.imagePath || c.imagePath,
                  };
                }
                return c;
              })
            );
            setDbAvailable(true);
          });
        } else if (!hasInitialChampions || statsScope !== "ranked") {
          revealAfterEntrance(() => setDbAvailable(false));
        }
      } catch {
        if (!cancelled && (!hasInitialChampions || statsScope !== "ranked")) {
          revealAfterEntrance(() => setDbAvailable(false));
        }
      }
    }

    tryFetchStats();
    return () => {
      cancelled = true;
      if (revealTimer !== undefined) window.clearTimeout(revealTimer);
    };
  }, [hasInitialChampions, relationshipDirectory, statsScope]);

  const previewScope = "all";
  useEffect(() => {
    if (!relationshipDirectory) return;
    const controller = new AbortController();
    const load = async () => {
      const previews = new Map<number, MatchupPreview>();
      const response = await fetchChampionMatchupPreviews(controller.signal);
      if (controller.signal.aborted) return;
      for (const row of response.champions) {
        const visible = (relationships: ChampionRelationship[]) => relationships
          .filter((relationship) => !MATCHUP_PREVIEW_EXCLUSIONS.has(championSlug(relationship.opponentChampionName)));
        previews.set(row.championId, {
          strong: visible(row.strong),
          weak: visible(row.weak),
        });
      }
      setMatchupPreviewState({ scope: previewScope, previews });
    };
    void load().catch(() => {
      if (!controller.signal.aborted) {
        setMatchupPreviewState({ scope: previewScope, previews: new Map() });
      }
    });
    return () => controller.abort();
  }, [previewScope, relationshipDirectory]);

  const filtered = useMemo(() => champions
    .filter((c) => {
      const matchesRole = !deferredFilterRole || (c.roles && c.roles.includes(deferredFilterRole));
      const isVisibleMatchup = !relationshipDirectory || !MATCHUP_PREVIEW_EXCLUSIONS.has(championSlug(c.name));
      return matchesRole && isVisibleMatchup;
    })
    .sort((a, b) => {
      if (relationshipDirectory) return a.name.localeCompare(b.name);
      // Nulls sink to the bottom for stat sorts.
      const nullsLast = (av: number | null | undefined, bv: number | null | undefined) => {
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        return deferredSortDir === "desc" ? bv - av : av - bv;
      };
      switch (deferredSortBy) {
        case "popularity": return nullsLast(a.totalPlays, b.totalPlays);
        default:           return deferredSortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
    }), [champions, deferredFilterRole, deferredSortBy, deferredSortDir, relationshipDirectory]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="pc-heading pc-heading-lg">{relationshipDirectory ? t("stats.matchups.title") : t("generated.champions.champions")}</h1>
        {relationshipDirectory && <p className="max-w-4xl text-sm leading-6 text-pc-text-secondary">{t("stats.matchups.directoryDescription")}</p>}
      </header>

      {relationshipDirectory && <TagCriteriaTip
        labelKey="stats.matchups.previewNote"
        criteriaKey="stats.matchups.previewExclusions"
      />}



      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <span id="champion-class-filter-label" className="sr-only">{t("generated.champions.class.41ff354")}</span>
        <div role="group" aria-labelledby="champion-class-filter-label" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setFilterRole(null)}
              aria-pressed={filterRole === null}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors motion-reduce:transition-none ${
                filterRole === null
                  ? "bg-pc-accent text-pc-bg"
                  : "pc-surface text-pc-muted hover:text-pc-text"
              }`}
            >
              {t("generated.stats.all")}</button>
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setFilterRole(r.value)}
                aria-pressed={filterRole === r.value}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors motion-reduce:transition-none ${
                  filterRole === r.value
                    ? "bg-pc-accent text-pc-bg"
                    : "pc-surface text-pc-muted hover:text-pc-text"
                }`}
              >
                <img src={r.icon} alt="" aria-hidden="true" className="h-5 w-5" />
                {t(r.labelKey)}
              </button>
            ))}
        </div>

        {!relationshipDirectory && <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            className="pc-select w-44 shrink-0"
            aria-label={t("skins.sortBy")}
          >
            <option value="name">{t("generated.champions.name")}</option>
            <option value="popularity">{t("generated.champions.popularity")}</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
            className="pc-surface flex h-[38px] w-11 shrink-0 items-center justify-center rounded-lg text-pc-text-secondary transition-colors hover:text-pc-text motion-reduce:transition-none"
            aria-label={sortDir === "asc" ? t("generated.champions.ascending") : t("generated.champions.descending")}
            title={sortDir === "asc" ? t("generated.champions.ascending") : t("generated.champions.descending")}
          >
            {sortDir === "asc" ? <ArrowUp aria-hidden="true" className="h-4 w-4" /> : <ArrowDown aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>}
      </div>

      {/* DB status indicator */}
      {!relationshipDirectory && dbAvailable === false && (
        <div className="text-pc-muted text-sm italic">
          {t("generated.champions.statsUnavailableShowingChampionListOnlyWinPickBanRates")}</div>
      )}

      {/* Champion Grid */}
      {filtered.length === 0 ? (
        <div className="pc-card text-center">
          <p className="pc-body">{t("generated.champions.noChampionsMatchedYourSearch")}</p>
        </div>
      ) : (
        <div
          className={relationshipDirectory
            ? "grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
            : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}
          aria-busy={dbAvailable === null}
        >
          {filtered.map((c) => {
            if (relationshipDirectory) {
              const preview = matchupPreviewState.scope === previewScope
                ? matchupPreviewState.previews.get(Number(c.id))
                : undefined;
              return <Link
                key={c.id}
                href={`/stats/champions/${championSlug(c.name)}`}
                className="group rounded-2xl border border-pc-border bg-pc-bg-elevated p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-pc-accent-mid hover:bg-pc-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent motion-reduce:transform-none motion-reduce:transition-none"
              >
                <div className="mb-4 flex items-center gap-3">
                  <SmartImage src={c.imagePath || getChampionIconSafe(c.name)} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 rounded-xl object-contain" />
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-pc-text transition-colors group-hover:text-pc-accent">{c.name}</h2>
                    <p className="text-xs text-pc-text-muted">{c.roles?.[0]}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-pc-border/70 pt-3">
                  {([
                    ["stats.matchups.strong", preview?.strong, "border-emerald-400/50"],
                    ["stats.matchups.weak", preview?.weak, "border-rose-400/50"],
                  ] as const).map(([label, rows, tone]) => <section key={label}>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-pc-text-muted">{t(label)}</h3>
                    <div className="grid min-h-8 grid-cols-5 gap-1.5">
                      {rows?.map((row) => <SmartImage
                        key={row.opponentChampionId}
                        src={getChampionIconSafe(row.opponentChampionName)}
                        alt={row.opponentChampionName}
                        title={row.opponentChampionName}
                        width={40}
                        height={40}
                        loading="lazy"
                        className={`aspect-square h-auto w-full rounded-lg border-2 ${tone} bg-pc-bg object-cover`}
                      />)}
                    </div>
                  </section>)}
                </div>
              </Link>;
            }
            const roleIcon = c.roles && c.roles.length > 0
              ? ROLES.find(r => r.value === c.roles![0])?.icon
              : undefined;
            const formatPlays = (n: number | null | undefined) => {
              if (n == null) return "—";
              if (n >= 1_000_000) return `${formatNumber((n / 1_000_000), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
              if (n >= 1_000) return `${formatNumber((n / 1_000), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
              return String(n);
            };
            return (
              <Link
                key={c.id}
                href={`/champions/${championSlug(c.name)}?scope=${statsScope}`}
                className="group relative flex min-h-20 items-center gap-3.5 rounded-xl border border-pc-border bg-pc-bg-elevated p-3 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-pc-accent-mid hover:bg-pc-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent motion-reduce:transform-none motion-reduce:transition-none"
              >
                  {/* Portrait */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-pc-border/50 bg-pc-bg-elevated transition-colors duration-200 group-hover:border-pc-accent-deep/50 motion-reduce:transition-none">
                    <SmartImage
                      src={c.imagePath || getChampionIconSafe(c.name)}
                      alt=""
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: name + role */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-pc-text font-semibold text-sm truncate group-hover:text-pc-accent transition-colors">
                        {c.name}
                      </h3>
                      {c.roles && c.roles.length > 0 && (
                        <span className="shrink-0 flex items-center gap-1 text-pc-text-muted text-xs px-1.5 py-0.5 rounded pc-surface-subtle">
                          {roleIcon && <img src={roleIcon} alt="" aria-hidden="true" className="h-3 w-3" />}
                          {c.roles[0]}
                        </span>
                      )}
                    </div>

                    <div className="text-xs tabular-nums text-pc-text-muted">
                      <span className="min-w-0 whitespace-nowrap text-right text-pc-text-muted">
                        <span>{t("generated.champions.plays")}</span>
                        <span className="text-pc-text-secondary">{formatPlays(c.totalPlays)}</span>
                      </span>
                    </div>
                  </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
