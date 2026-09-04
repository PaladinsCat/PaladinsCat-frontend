/**
 * Define the stats maps page route boundary.
 * Coordinates this module's route data flow and rendered output.
 * refs: none
 */
"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import SmartImage from "@/components/SmartImage";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import {
  fetchMapCategoryComparison,
  fetchMapDetail,
  type MapCategoryComparisonStat,
  type MapComparisonSection,
  type MapDetailStats,
  type PublicStatsScope,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getChampionData } from "@/lib/champion-data";
import { championSlug } from "@/lib/utils";
import { getPercentageColor, getStatQuality } from "@/lib/stat-quality";
import { mapImagePath } from "@/lib/map-images";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { LoadingIndicator } from "@/components/async-state";
import ContextBackLink from "@/components/context-back-link";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useLocalization } from "@/lib/localization-context";
import { useRouteSettledLoading } from "@/lib/route-transition-context";

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.avif`; }
function rateColor(rate: number) { return getPercentageColor(rate); }
function itemClassColor(itemClass: string) {
  return itemClass === "Offense" ? "text-red-400" : itemClass === "Defense" ? "text-blue-400" : itemClass === "Healing" ? "text-emerald-400" : "text-amber-400";
}
function AllMapComparison({
  rows,
  summary,
  empty,
  error,
  loading,
  loaded,
  failed,
  onOpen,
  metrics,
}: {
  rows: MapCategoryComparisonStat[];
  summary: string;
  empty: string;
  error: string;
  loading: boolean;
  loaded: boolean;
  failed: boolean;
  onOpen: () => void;
  metrics: (row: MapCategoryComparisonStat) => Array<{ label: string; value: ReactNode; color?: string }>;
}) {
  return (
    <details
      className="mt-2 border-t border-pc-border/60 pt-2"
      onToggle={(event) => {
        if (event.currentTarget.open) onOpen();
      }}
    >
      <summary className="cursor-pointer select-none text-xs font-medium text-pc-accent">{summary}</summary>
      {loading || (!loaded && !failed) ? (
        <LoadingIndicator className="mt-2" />
      ) : failed ? (
        <p className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-2 text-xs text-rose-300">{error}</p>
      ) : rows.length > 0 ? (
        <div className="mt-2 max-h-80 divide-y divide-pc-border/50 overflow-y-auto rounded-lg border border-pc-border/60 bg-pc-bg">
          {rows.map((row) => (
            <Link key={row.mapName} href={`/game/maps/${encodeURIComponent(row.mapName)}`} className="block px-2.5 py-2 transition-colors hover:bg-pc-bg-elevated">
              <span className="block text-xs font-medium leading-4 text-pc-text-secondary" title={row.mapName}>{row.mapName.replace(/^Ranked\s+/, "")}</span>
              <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-pc-text-muted">
                {metrics(row).map((metric) => <span key={metric.label}>{metric.label} <span className="font-semibold text-pc-text-secondary" style={metric.color ? { color: metric.color } : undefined}>{metric.value}</span></span>)}
              </span>
            </Link>
          ))}
        </div>
      ) : <p className="mt-2 text-xs text-pc-text-muted">{empty}</p>}
    </details>
  );
}

type MapSection = "champions" | "talents" | "items" | "compositions";
type ChampionSort = "winRate" | "pickRate" | "banRate";
type TalentSort = "winRate" | "pickRate" | "totalPlays";

const MAP_SECTIONS = [
  { key: "champions", labelKey: "common.sort.champions" },
  { key: "talents", labelKey: "common.sort.talents" },
  { key: "items", labelKey: "common.sort.items" },
  { key: "compositions", labelKey: "generated.stats.composition" },
] as const satisfies ReadonlyArray<{ key: MapSection; labelKey: string }>;

const CHAMPION_SORTS = [
  { key: "winRate", labelKey: "common.metrics.winRate" },
  { key: "pickRate", labelKey: "common.metrics.pickRate" },
  { key: "banRate", labelKey: "common.metrics.banRate" },
] as const satisfies ReadonlyArray<{ key: ChampionSort; labelKey: string }>;

const TALENT_SORTS = [
  { key: "winRate", labelKey: "common.metrics.winRate" },
  { key: "pickRate", labelKey: "common.metrics.pickRate" },
  { key: "totalPlays", labelKey: "common.sort.plays" },
] as const satisfies ReadonlyArray<{ key: TalentSort; labelKey: string }>;

const ROLES = [
  { value: "Frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { value: "Damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { value: "Flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { value: "Support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

const ROLE_LABEL_KEYS = new Map<string, (typeof ROLES)[number]["labelKey"]>(ROLES.map((role) => [role.value, role.labelKey]));

const COMPOSITION_COLUMNS = [
  { key: "frontline", labelKey: "common.roles.frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { key: "damage", labelKey: "common.roles.damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { key: "flank", labelKey: "common.roles.flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { key: "support", labelKey: "common.roles.support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

const CHAMPION_ROLE_BY_SLUG = new Map(STATIC_CHAMPIONS.map((champion) => [championSlug(champion.name), champion.roles[0] ?? ""]));

const ITEM_CLASS_BY_NAME: Record<string, string> = {
  "Blast Shields": "Defense", Guardian: "Defense", Haven: "Defense", Illuminate: "Defense", Resilience: "Defense", Sentinel: "Defense",
  Chronos: "Utility", Hoard: "Utility", "Master Riding": "Utility", "Morale Boost": "Utility", Nimble: "Utility",
  Bloodbath: "Healing", "Kill to Heal": "Healing", "Life Rip": "Healing", Meditation: "Healing", Rejuvenate: "Healing", Veteran: "Healing",
  Bulldozer: "Offense", "Deft Hands": "Offense", Lethality: "Offense", "Trigger Scent": "Offense", Wrecker: "Offense",
};

const ITEM_CLASSES = ["Defense", "Utility", "Healing", "Offense"] as const;
const ITEM_CLASS_LABEL_KEYS = {
  Defense: "maps.itemClass.defense",
  Utility: "maps.itemClass.utility",
  Healing: "maps.itemClass.healing",
  Offense: "maps.itemClass.offense",
} as const;

const STATS_SCOPE_LABEL_KEYS = {
  ranked: "stats.scope.ranked",
  casual: "stats.scope.casual",
  bot: "stats.scope.bot",
  team_deathmatch: "stats.scope.teamDeathmatch",
  arcade: "stats.scope.arcade",
  wave_defense: "stats.scope.waveDefense",
  experiment: "stats.scope.experiment",
  newcomer: "stats.scope.newcomer",
} as const;

/**
 * Renders the exported statistics view with its route data.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function MapDetailPage() {
  const { formatDuration, formatNumber, formatPercent, formatRecord, t } = useLocalization();
  const params = useParams<{ mapName: string }>();
  const searchParams = useSearchParams();
  const mapName = decodeURIComponent(params.mapName);
  const requestedScope = searchParams.get("scope");
  const statsScope: PublicStatsScope = (
    ["casual", "bot", "team_deathmatch", "arcade", "wave_defense", "experiment", "newcomer"] as string[]
  ).includes(requestedScope ?? "") ? requestedScope as PublicStatsScope : "ranked";
  const [detail, setDetail] = useState<MapDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const displayLoading = useRouteSettledLoading(!loaded);
  const [activeSection, setActiveSection] = useState<MapSection>("champions");
  const [championRole, setChampionRole] = useState<string | null>(null);
  const [championSort, setChampionSort] = useState<ChampionSort>("winRate");
  const [talentRole, setTalentRole] = useState<string | null>(null);
  const [talentSort, setTalentSort] = useState<TalentSort>("winRate");
  const [comparisonCache, setComparisonCache] = useState<Partial<Record<MapSection, MapCategoryComparisonStat[]>>>({});
  const [comparisonLoading, setComparisonLoading] = useState<Partial<Record<MapSection, boolean>>>({});
  const [comparisonFailed, setComparisonFailed] = useState<Partial<Record<MapSection, boolean>>>({});
  const [canonicalTalentIds, setCanonicalTalentIds] = useState<ReadonlyMap<number, ReadonlySet<number>> | null>(null);
  const comparisonRequests = useRef<Partial<Record<MapSection, Promise<void>>>>({});
  const comparisonMapName = useRef(mapName);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setDetail(null);
    setComparisonCache({});
    setComparisonFailed({});
    setComparisonLoading({});
    comparisonRequests.current = {};
    comparisonMapName.current = mapName;
    fetchMapDetail(mapName, { scope: statsScope }).then((data) => { if (!cancelled) setDetail(data); }).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [mapName, statsScope]);

  useEffect(() => {
    let cancelled = false;
    if (!detail) return () => { cancelled = true; };
    // champion-data.json is the current three-talent authority.  Aggregates
    // intentionally retain observed legacy talent facts for investigation.
    void Promise.all(detail.champions.map(async (champion) => [
      champion.championId,
      new Set((await getChampionData(championSlug(champion.championName)))?.talents.map((talent) => talent.id) ?? []),
    ] as const)).then((entries) => {
      if (!cancelled) setCanonicalTalentIds(new Map(entries));
    });
    return () => { cancelled = true; };
  }, [detail]);

  useEffect(() => {
    if (statsScope !== "ranked") {
      setActiveSection("champions");
      if (championSort === "banRate") setChampionSort("winRate");
    }
  }, [statsScope, championSort]);

  const talentsByChampion = useMemo(() => {
    const grouped = new Map<number, MapDetailStats["talents"]>();
    detail?.talents.forEach((talent) => grouped.set(talent.championId, [...(grouped.get(talent.championId) ?? []), talent]));
    return grouped;
  }, [detail]);

  const sortedChampions = useMemo(() => [...(detail?.champions ?? [])]
    .filter((champion) => !championRole || CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName)) === championRole)
    .sort((a, b) => {
      const difference = b[championSort] - a[championSort];
      return difference || b.totalPlays - a.totalPlays || a.championName.localeCompare(b.championName);
    }), [detail, championRole, championSort]);

  const talentGroups = useMemo(() => (detail?.champions ?? [])
    .filter((champion) => !talentRole || CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName)) === talentRole)
    .map((champion) => ({
      champion,
      talents: [...(talentsByChampion.get(champion.championId) ?? [])]
        .filter((talent) => canonicalTalentIds?.get(champion.championId)?.has(talent.talentId) ?? false)
        .sort((a, b) => {
        const difference = b[talentSort] - a[talentSort];
        return difference || a.talentName.localeCompare(b.talentName);
      }),
    }))
    .filter((group) => group.talents.length > 0)
    .sort((a, b) => (b.talents[0]?.[talentSort] ?? 0) - (a.talents[0]?.[talentSort] ?? 0)), [canonicalTalentIds, detail, talentRole, talentSort, talentsByChampion]);

  const visibleTalentCount = useMemo(() => talentGroups.reduce((count, group) => count + group.talents.length, 0), [talentGroups]);

  const itemsByClass = useMemo(() => ITEM_CLASSES.map((itemClass) => ({
    itemClass,
    items: (detail?.items ?? []).filter((item) => (ITEM_CLASS_BY_NAME[item.itemName] ?? "Utility") === itemClass),
  })).filter((group) => group.items.length > 0), [detail]);

  const comparisonRows = comparisonCache[activeSection] ?? [];
  const comparisonByEntity = useMemo(() => {
    const grouped = new Map<string, MapCategoryComparisonStat[]>();
    for (const row of comparisonRows) grouped.set(row.entityKey, [...(grouped.get(row.entityKey) ?? []), row]);
    return grouped;
  }, [comparisonRows]);

  function loadCategoryComparison(section: MapComparisonSection) {
    if (statsScope !== "ranked") return;
    if (Object.prototype.hasOwnProperty.call(comparisonCache, section) || comparisonRequests.current[section]) return;
    setComparisonFailed((current) => ({ ...current, [section]: false }));
    setComparisonLoading((current) => ({ ...current, [section]: true }));
    const request = fetchMapCategoryComparison(mapName, section)
      .then((rows) => {
        if (comparisonMapName.current !== mapName) return;
        setComparisonCache((current) => ({ ...current, [section]: rows }));
      })
      .catch(() => {
        if (comparisonMapName.current !== mapName) return;
        setComparisonFailed((current) => ({ ...current, [section]: true }));
      })
      .finally(() => {
        if (comparisonRequests.current[section] === request) delete comparisonRequests.current[section];
        if (comparisonMapName.current !== mapName) return;
        setComparisonLoading((current) => ({ ...current, [section]: false }));
      });
    comparisonRequests.current[section] = request;
  }

  if (!detail) return displayLoading ? <RouteSkeleton variant="detail" /> : <div className="pc-card py-12 text-center text-sm text-pc-text-secondary">{t("generated.stats.mapStatisticsAreUnavailable")}</div>;
  const { map } = detail;

  return (
    <div className="space-y-6">
      <ContextBackLink fallbackHref={`/game/maps?scope=${statsScope}`} label={t("menu.maps")} />

      <section className="relative overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
        <SmartImage src={mapImagePath(map.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-pc-bg-elevated via-pc-bg-elevated/90 to-pc-bg-elevated/45" />
        <div className="relative grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-pc-text-muted">{t(STATS_SCOPE_LABEL_KEYS[statsScope])}</p><h1 className="mt-1 pc-heading pc-heading-lg">{map.name.replace(/^Ranked\s+/, "")}</h1></div>
          <div className="grid grid-cols-3 divide-x divide-pc-border text-center tabular-nums"><div className="px-4 py-1"><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.mapShare.77ce64b")}</div><div className="mt-1 font-bold" style={{ color: getPercentageColor(map.distributionRate) }}>{formatPercent(map.distributionRate)}</div></div><div className="px-4 py-1"><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.matches")}</div><div className="mt-1 font-bold text-pc-text">{formatNumber(map.totalMatches)}</div></div><div className="px-4 py-1"><div className="text-xs uppercase text-pc-text-muted">{t("generated.stats.avgTime.53a0360")}</div><div className="mt-1 font-bold text-pc-text">{formatDuration(map.avgDurationSeconds)}</div></div></div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MAP_SECTIONS.filter((section) => statsScope === "ranked" || section.key === "champions").map((section) => (
            <button
              key={section.key}
              type="button"
              aria-pressed={activeSection === section.key}
              onClick={() => setActiveSection(section.key)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${activeSection === section.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}
            >
              {t(section.labelKey)}
              <span className={`text-xs ${activeSection === section.key ? "text-pc-bg/70" : "text-pc-text-muted"}`}>
                {formatNumber(section.key === "champions" ? detail.champions.length : section.key === "talents" ? visibleTalentCount : section.key === "items" ? detail.items.length : detail.compositions.length)}
              </span>
            </button>
          ))}
      </div>

      {activeSection === "champions" && (
        <section>
          <h2 className="pc-card-title mb-3">{t("generated.stats.championPerformance")}</h2>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><span className="mb-1.5 block text-xs text-pc-text-secondary">{t("generated.stats.role")}</span><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("generated.stats.role")}>
              <button type="button" aria-pressed={championRole === null} onClick={() => setChampionRole(null)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${championRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.stats.all")}</button>
              {ROLES.map((role) => <button key={role.value} type="button" aria-pressed={championRole === role.value} onClick={() => setChampionRole(role.value)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${championRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
            </div></div>
            <div><span className="mb-1.5 block text-xs text-pc-text-secondary">{t("skins.sortBy")}</span><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("skins.sortBy")}>
              {CHAMPION_SORTS.filter((sort) => statsScope === "ranked" || sort.key !== "banRate").map((sort) => <button key={sort.key} type="button" aria-pressed={championSort === sort.key} onClick={() => setChampionSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${championSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t(sort.labelKey)}</button>)}
            </div></div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {sortedChampions.map((champion) => {
              const quality = getStatQuality(champion.winRate, champion.pickRate, Math.max(1, ...detail.champions.map((row) => row.pickRate)));
              const compared = comparisonByEntity.get(String(champion.championId)) ?? [];
              return <div key={champion.championId} className="group rounded-lg border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
                <Link href={`/champions/${championSlug(champion.championName)}?scope=${statsScope}`} className="flex items-center gap-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{champion.championName}</div><div className="mt-0.5 text-xs uppercase text-pc-text-muted">{t(ROLE_LABEL_KEYS.get(CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName)) ?? "") ?? "common.roles.global")}</div></div></Link>
                <div className={`mt-2 grid gap-1 border-t border-pc-border/60 pt-2 text-center ${statsScope === "ranked" ? "grid-cols-3" : "grid-cols-2"}`}><div><div className="text-xs text-pc-text-muted">{t("generated.stats.wr")}</div><div className="text-xs font-bold" style={{ color: rateColor(champion.winRate) }}>{formatPercent(champion.winRate)}</div><div className="text-xs text-pc-text-muted">{formatRecord(champion.wins, champion.losses)}</div></div><div><div className="text-xs text-pc-text-muted">{t("generated.stats.pr")}</div><div className="text-xs font-semibold" style={{ color: getPercentageColor(champion.pickRate) }}>{formatPercent(champion.pickRate)}</div><div className="text-xs text-pc-text-muted">{formatNumber(champion.totalPlays)} {t("generated.stats.picks")}</div></div>{statsScope === "ranked" && <div><div className="text-xs text-pc-text-muted">{t("generated.stats.br")}</div><div className="text-xs font-semibold" style={{ color: getPercentageColor(champion.banRate) }}>{formatPercent(champion.banRate)}</div><div className="text-xs text-pc-text-muted">{formatNumber(champion.totalBans)} {t("generated.stats.bans")}</div></div>}</div>
                {statsScope === "ranked" && <AllMapComparison rows={compared} summary={t("maps.compareOtherMaps")} empty={t("maps.noComparisonData")} error={t("maps.comparisonFailed")} loaded={Object.prototype.hasOwnProperty.call(comparisonCache, "champions")} loading={comparisonLoading.champions === true} failed={comparisonFailed.champions === true} onOpen={() => loadCategoryComparison("champions")} metrics={(row) => [{ label: t("generated.stats.wr"), value: formatPercent(row.winRate), color: rateColor(row.winRate) }, { label: t("generated.stats.pr"), value: formatPercent(row.pickRate), color: getPercentageColor(row.pickRate) }, { label: t("generated.stats.br"), value: formatPercent(row.banRate), color: getPercentageColor(row.banRate) }]} />}
              </div>;
            })}
          </div>
        </section>
      )}

      {activeSection === "talents" && (
        <section>
          <h2 className="pc-card-title mb-3">{t("generated.stats.talentPicks")}</h2>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><span className="mb-1.5 block text-xs text-pc-text-secondary">{t("generated.stats.role")}</span><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("generated.stats.role")}>
              <button type="button" aria-pressed={talentRole === null} onClick={() => setTalentRole(null)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${talentRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.stats.all")}</button>
              {ROLES.map((role) => <button key={role.value} type="button" aria-pressed={talentRole === role.value} onClick={() => setTalentRole(role.value)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${talentRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
            </div></div>
            <div><span className="mb-1.5 block text-xs text-pc-text-secondary">{t("skins.sortBy")}</span><div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("skins.sortBy")}>
              {TALENT_SORTS.map((sort) => <button key={sort.key} type="button" aria-pressed={talentSort === sort.key} onClick={() => setTalentSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${talentSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t(sort.labelKey)}</button>)}
            </div></div>
          </div>
          {talentGroups.length > 0 ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{talentGroups.map(({ champion, talents }) => <div key={champion.championId} className="overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated"><div className="flex items-center gap-2 border-b border-pc-border px-2.5 py-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-pc-text">{champion.championName}</span><span className="text-xs uppercase text-pc-text-muted">{t(ROLE_LABEL_KEYS.get(CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName)) ?? "") ?? "common.roles.global")}</span></div><div className="divide-y divide-pc-border/50">{talents.map((talent) => {
            const compared = comparisonByEntity.get(String(talent.talentId)) ?? [];
            return <div key={talent.talentId} className="flex items-start gap-2 px-2.5 py-2"><CanonicalTalentImage talentId={talent.talentId} talentName={talent.talentName} alt="" className="h-8 w-8 shrink-0 rounded object-cover" fallbackClassName="h-8 w-8 shrink-0 rounded" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-pc-text-secondary" title={talent.talentName}>{talent.talentName}</div><div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"><span style={{ color: rateColor(talent.winRate) }}>{formatPercent(talent.winRate)} {t("generated.stats.wr")}</span><span className="text-pc-text-muted">{formatRecord(talent.wins, talent.losses)}</span><span style={{ color: getPercentageColor(talent.pickRate) }}>{formatPercent(talent.pickRate)} {t("generated.stats.pr")}</span><span className="text-pc-text-muted">{formatNumber(talent.totalPlays)} {t("generated.stats.picks")}</span></div><AllMapComparison rows={compared} summary={t("maps.compareOtherMaps")} empty={t("maps.noComparisonData")} error={t("maps.comparisonFailed")} loaded={Object.prototype.hasOwnProperty.call(comparisonCache, "talents")} loading={comparisonLoading.talents === true} failed={comparisonFailed.talents === true} onOpen={() => loadCategoryComparison("talents")} metrics={(row) => [{ label: t("generated.stats.wr"), value: formatPercent(row.winRate), color: rateColor(row.winRate) }, { label: t("generated.stats.pr"), value: formatPercent(row.pickRate), color: getPercentageColor(row.pickRate) }, { label: t("generated.stats.picks"), value: formatNumber(row.totalCount) }]} /></div></div>;
          })}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated p-8 text-center text-sm text-pc-text-muted">{t("generated.stats.noTalentObservationsMatchThisRole")}</div>}
        </section>
      )}

      {activeSection === "items" && (
        <section><h2 className="pc-card-title mb-3">{t("generated.stats.itemMeta.ba645e0")}</h2><div className="space-y-5">{itemsByClass.map(({ itemClass, items }) => <div key={itemClass}><h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${itemClassColor(itemClass)}`}>{t(ITEM_CLASS_LABEL_KEYS[itemClass])}</h3><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{items.map((item) => {
          const compared = comparisonByEntity.get(String(item.itemId)) ?? [];
          return <div key={item.itemId} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-2.5"><Link href={`/game/items/${item.itemId}`} className="flex items-center gap-2 transition-colors hover:text-pc-accent"><SmartImage src={itemIcon(item.itemName)} alt="" className="h-12 w-12 rounded-lg object-contain" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-pc-text">{item.itemName}</span></Link><div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div><span className="block" style={{ color: rateColor(item.winRate) }}>{formatPercent(item.winRate)} {t("generated.stats.wr")}</span><span className="block text-pc-text-muted">{formatRecord(item.wins, item.losses)}</span></div><div className="text-right"><span className="block" style={{ color: getPercentageColor(item.pickRate) }}>{formatPercent(item.pickRate)} {t("generated.stats.pr")}</span><span className="block text-pc-text-muted">{formatNumber(item.totalUses)} {t("generated.stats.purchases.d29d2db")}</span></div></div><AllMapComparison rows={compared} summary={t("maps.compareOtherMaps")} empty={t("maps.noComparisonData")} error={t("maps.comparisonFailed")} loaded={Object.prototype.hasOwnProperty.call(comparisonCache, "items")} loading={comparisonLoading.items === true} failed={comparisonFailed.items === true} onOpen={() => loadCategoryComparison("items")} metrics={(row) => [{ label: t("generated.stats.wr"), value: formatPercent(row.winRate), color: rateColor(row.winRate) }, { label: t("generated.stats.pr"), value: formatPercent(row.pickRate), color: getPercentageColor(row.pickRate) }, { label: t("generated.stats.purchases"), value: formatNumber(row.totalCount) }]} /></div>;
        })}</div></div>)}</div></section>
      )}

      {activeSection === "compositions" && (
        <section><h2 className="pc-card-title mb-3">{t("generated.stats.compositionStats")}</h2>{detail.compositions.length > 0 ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{detail.compositions.map((composition) => {
          const compared = comparisonByEntity.get(composition.composition) ?? [];
          return <div key={composition.composition} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-base font-bold text-pc-text">{composition.composition}</div><div className="text-xs text-pc-text-muted">{formatNumber(composition.totalMatches)} {t("generated.stats.matches.9f3e924")}</div></div><div className="text-right font-bold" style={{ color: rateColor(composition.winRate) }}>{formatPercent(composition.winRate)}</div></div><div className="mt-3 grid grid-cols-4 gap-1.5">{COMPOSITION_COLUMNS.map((column) => <div key={column.key} className="rounded-lg bg-pc-bg-secondary/60 p-2 text-center"><img src={column.icon} alt="" className="mx-auto h-5 w-5 object-contain" /><div className="mt-1 font-mono text-sm font-semibold text-pc-text">{formatNumber(composition[column.key])}</div><div className="truncate text-xs uppercase text-pc-text-muted">{t(column.labelKey)}</div></div>)}</div><AllMapComparison rows={compared} summary={t("maps.compareOtherMaps")} empty={t("maps.noComparisonData")} error={t("maps.comparisonFailed")} loaded={Object.prototype.hasOwnProperty.call(comparisonCache, "compositions")} loading={comparisonLoading.compositions === true} failed={comparisonFailed.compositions === true} onOpen={() => loadCategoryComparison("compositions")} metrics={(row) => [{ label: t("generated.stats.winRate"), value: formatPercent(row.winRate), color: rateColor(row.winRate) }, { label: t("generated.stats.matches"), value: formatNumber(row.totalCount) }]} /></div>;
        })}</div> : <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated p-8 text-center text-sm text-pc-text-muted">{t("maps.noCompositions")}</div>}</section>
      )}
    </div>
  );
}
