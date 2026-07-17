"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import SmartImage from "@/components/SmartImage";
import CanonicalTalentImage from "@/components/canonical-talent-image";
import {
  fetchMapCategoryComparison,
  fetchMapDetail,
  type MapCategoryComparisonStat,
  type MapComparisonSection,
  type MapDetailStats,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getStatQuality } from "@/lib/stat-quality";
import { mapImagePath } from "@/lib/map-images";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { LoadingIndicator, LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.png`; }
function rateColor(rate: number) { return getStatQuality(rate, 1, 1).color; }
function itemClassColor(itemClass: string) {
  return itemClass === "Offense" ? "text-red-400" : itemClass === "Defense" ? "text-blue-400" : itemClass === "Healing" ? "text-emerald-400" : "text-amber-400";
}
function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

function AllMapComparison({
  rows,
  summary,
  empty,
  metrics,
}: {
  rows: MapCategoryComparisonStat[];
  summary: string;
  empty: string;
  metrics: (row: MapCategoryComparisonStat) => Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <details className="mt-2 border-t border-pc-border/60 pt-2">
      <summary className="cursor-pointer select-none text-xs font-medium text-pc-accent">{summary}</summary>
      {rows.length > 0 ? (
        <div className="mt-2 max-h-64 divide-y divide-pc-border/50 overflow-y-auto rounded-lg border border-pc-border/60 bg-pc-bg">
          {rows.map((row) => (
            <Link key={row.mapName} href={`/game/maps/${encodeURIComponent(row.mapName)}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-2 py-1.5 transition-colors hover:bg-pc-bg-elevated">
              <span className="truncate text-xs text-pc-text-secondary" title={row.mapName}>{row.mapName.replace(/^Ranked\s+/, "")}</span>
              <span className="flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-right text-xs text-pc-text-muted">
                {metrics(row).map((metric) => <span key={metric.label}>{metric.label} <span className="font-semibold text-pc-text-secondary">{metric.value}</span></span>)}
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

export default function MapDetailPage() {
  const { t } = useLocalization();
  const params = useParams<{ mapName: string }>();
  const mapName = decodeURIComponent(params.mapName);
  const [detail, setDetail] = useState<MapDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<MapSection>("champions");
  const [championRole, setChampionRole] = useState<string | null>(null);
  const [championSort, setChampionSort] = useState<ChampionSort>("winRate");
  const [talentRole, setTalentRole] = useState<string | null>(null);
  const [talentSort, setTalentSort] = useState<TalentSort>("winRate");
  const [comparisonSection, setComparisonSection] = useState<MapSection | null>(null);
  const [comparisonCache, setComparisonCache] = useState<Partial<Record<MapSection, MapCategoryComparisonStat[]>>>({});
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonFailed, setComparisonFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setComparisonSection(null);
    setComparisonCache({});
    setComparisonFailed(false);
    setComparisonLoading(false);
    fetchMapDetail(mapName).then((data) => { if (!cancelled) setDetail(data); }).finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [mapName]);

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
      talents: [...(talentsByChampion.get(champion.championId) ?? [])].sort((a, b) => {
        const difference = b[talentSort] - a[talentSort];
        return difference || a.talentName.localeCompare(b.talentName);
      }),
    }))
    .filter((group) => group.talents.length > 0)
    .sort((a, b) => (b.talents[0]?.[talentSort] ?? 0) - (a.talents[0]?.[talentSort] ?? 0)), [detail, talentRole, talentSort, talentsByChampion]);

  const itemsByClass = useMemo(() => ITEM_CLASSES.map((itemClass) => ({
    itemClass,
    items: (detail?.items ?? []).filter((item) => (ITEM_CLASS_BY_NAME[item.itemName] ?? "Utility") === itemClass),
  })).filter((group) => group.items.length > 0), [detail]);

  const comparisonRows = comparisonSection === activeSection ? comparisonCache[activeSection] ?? [] : [];
  const comparisonByEntity = useMemo(() => {
    const grouped = new Map<string, MapCategoryComparisonStat[]>();
    for (const row of comparisonRows) grouped.set(row.entityKey, [...(grouped.get(row.entityKey) ?? []), row]);
    return grouped;
  }, [comparisonRows]);

  async function loadCategoryComparison() {
    const section = activeSection as MapComparisonSection;
    if (comparisonCache[section]) {
      setComparisonSection(section);
      setComparisonFailed(false);
      return;
    }
    setComparisonFailed(false);
    setComparisonLoading(true);
    try {
      const rows = await fetchMapCategoryComparison(mapName, section);
      setComparisonCache((current) => ({ ...current, [section]: rows }));
      setComparisonSection(section);
    } catch {
      setComparisonFailed(true);
    } finally {
      setComparisonLoading(false);
    }
  }

  function clearComparison() {
    setComparisonSection(null);
    setComparisonFailed(false);
    setComparisonLoading(false);
  }

  if (!detail) return loaded ? <div className="pc-card py-12 text-center text-sm text-pc-text-secondary">{t("generated.stats.mapStatisticsAreUnavailable")}</div> : <LoadingPanel />;
  const { map } = detail;

  return (
    <div className="space-y-6">
      <Link href="/game/maps" className="text-sm text-pc-text-secondary hover:text-pc-accent">{t("generated.stats.allMaps")}</Link>

      <section className="relative overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
        <SmartImage src={mapImagePath(map.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-pc-bg-elevated via-pc-bg-elevated/90 to-pc-bg-elevated/45" />
        <div className="relative grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-7">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-pc-text-muted">{t("generated.stats.rankedMapMeta")}</p><h1 className="mt-1 pc-heading pc-heading-lg text-pc-accent">{map.name.replace(/^Ranked\s+/, "")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("maps.detailDescription")}</p></div>
          <div className="grid grid-cols-3 divide-x divide-pc-border rounded-lg border border-pc-border bg-pc-bg-secondary/70 text-center"><div className="px-4 py-2.5"><div className="text-[10px] uppercase text-pc-text-muted">{t("generated.stats.mapShare.77ce64b")}</div><div className="mt-1 font-bold text-pc-accent">{map.distributionRate.toFixed(1)}%</div></div><div className="px-4 py-2.5"><div className="text-[10px] uppercase text-pc-text-muted">{t("generated.stats.matches")}</div><div className="mt-1 font-bold text-pc-text">{map.totalMatches.toLocaleString()}</div></div><div className="px-4 py-2.5"><div className="text-[10px] uppercase text-pc-text-muted">{t("generated.stats.avgTime.53a0360")}</div><div className="mt-1 font-bold text-pc-text">{duration(map.avgDurationSeconds)}</div></div></div>
        </div>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MAP_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${activeSection === section.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}
            >
              {t(section.labelKey)}
              <span className={`text-xs ${activeSection === section.key ? "text-pc-bg/70" : "text-pc-text-muted"}`}>
                {section.key === "champions" ? detail.champions.length : section.key === "talents" ? detail.talents.length : section.key === "items" ? detail.items.length : detail.compositions.length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button type="button" onClick={() => void loadCategoryComparison()} disabled={comparisonLoading} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-sm font-medium text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-wait disabled:opacity-60">
            {comparisonSection === activeSection
              ? t("maps.comparingAllMaps", { category: t(MAP_SECTIONS.find((section) => section.key === activeSection)?.labelKey ?? "common.sort.champions") })
              : t("maps.compareAllMaps")}
          </button>
          {comparisonSection === activeSection && <button type="button" onClick={clearComparison} className="rounded-lg border border-pc-border px-3 py-2 text-sm text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent">{t("maps.clearComparison")}</button>}
        </div>
      </div>

      {comparisonLoading && <LoadingIndicator className="rounded-xl border border-pc-border bg-pc-bg-elevated p-3" />}
      {comparisonFailed && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{t("maps.comparisonFailed")}</div>}

      {activeSection === "champions" && (
        <section>
          <div className="mb-3"><h2 className="pc-card-title">{t("generated.stats.championPerformance")}</h2><p className="mt-1 text-xs text-pc-text-muted">{t("generated.stats.filterByRoleAndSortCompactMapSpecificWinPick")}</p></div>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setChampionRole(null)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${championRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.stats.all")}</button>
              {ROLES.map((role) => <button key={role.value} type="button" onClick={() => setChampionRole(role.value)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${championRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CHAMPION_SORTS.map((sort) => <button key={sort.key} type="button" onClick={() => setChampionSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${championSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t(sort.labelKey)}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {sortedChampions.map((champion) => {
              const quality = getStatQuality(champion.winRate, champion.pickRate, Math.max(1, ...detail.champions.map((row) => row.pickRate)));
              const compared = comparisonByEntity.get(String(champion.championId)) ?? [];
              return <Link key={champion.championId} href={`/champions/${championSlug(champion.championName)}`} className="group rounded-lg border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
                <div className="flex items-center gap-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{champion.championName}</div><div className="mt-0.5 text-[10px] uppercase text-pc-text-muted">{CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName))}</div></div></div>
                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-pc-border/60 pt-2 text-center"><div><div className="text-[10px] text-pc-text-muted">{t("generated.stats.wr")}</div><div className="text-[11px] font-bold" style={{ color: rateColor(champion.winRate) }}>{champion.winRate.toFixed(1)}%</div><div className="text-[10px] text-pc-text-muted">{champion.wins.toLocaleString()}{t("generated.stats.w.59d8abf")}{champion.losses.toLocaleString()}L</div></div><div><div className="text-[10px] text-pc-text-muted">{t("generated.stats.pr")}</div><div className="text-[11px] font-semibold text-pc-text">{champion.pickRate.toFixed(1)}%</div><div className="text-[10px] text-pc-text-muted">{champion.totalPlays.toLocaleString()} {t("generated.stats.picks")}</div></div><div><div className="text-[10px] text-pc-text-muted">{t("generated.stats.br")}</div><div className="text-[11px] font-semibold text-rose-400">{champion.banRate.toFixed(1)}%</div><div className="text-[10px] text-pc-text-muted">{champion.totalBans.toLocaleString()} {t("generated.stats.bans")}</div></div></div>
                {comparisonSection === "champions" && <AllMapComparison rows={compared} summary={t("maps.allRankedMaps", { count: compared.length })} empty={t("maps.noComparisonData")} metrics={(row) => [{ label: t("generated.stats.wr"), value: `${row.winRate.toFixed(1)}%` }, { label: t("generated.stats.pr"), value: `${row.pickRate.toFixed(1)}%` }, { label: t("generated.stats.br"), value: `${row.banRate.toFixed(1)}%` }]} />}
              </Link>;
            })}
          </div>
        </section>
      )}

      {activeSection === "talents" && (
        <section>
          <div className="mb-3"><h2 className="pc-card-title">{t("generated.stats.talentPicks")}</h2><p className="mt-1 text-xs text-pc-text-muted">{t("generated.stats.filterChampionsByRoleAndRankTheirTalentsByMap")}</p></div>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setTalentRole(null)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${talentRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>{t("generated.stats.all")}</button>
              {ROLES.map((role) => <button key={role.value} type="button" onClick={() => setTalentRole(role.value)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${talentRole === role.value ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{t(role.labelKey)}</button>)}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TALENT_SORTS.map((sort) => <button key={sort.key} type="button" onClick={() => setTalentSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${talentSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{t(sort.labelKey)}</button>)}
            </div>
          </div>
          {talentGroups.length > 0 ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{talentGroups.map(({ champion, talents }) => <div key={champion.championId} className="overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated"><div className="flex items-center gap-2 border-b border-pc-border px-2.5 py-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-pc-text">{champion.championName}</span><span className="text-[10px] uppercase text-pc-text-muted">{CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName))}</span></div><div className="divide-y divide-pc-border/50">{talents.map((talent) => {
            const compared = comparisonByEntity.get(String(talent.talentId)) ?? [];
            return <div key={talent.talentId} className="flex items-start gap-2 px-2.5 py-2"><CanonicalTalentImage talentId={talent.talentId} talentName={talent.talentName} alt="" className="h-8 w-8 shrink-0 rounded object-cover" fallbackClassName="h-8 w-8 shrink-0 rounded" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-pc-text-secondary" title={talent.talentName}>{talent.talentName}</div><div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]"><span style={{ color: rateColor(talent.winRate) }}>{talent.winRate.toFixed(1)}{t("generated.stats.wr.6e80aee")}</span><span className="text-pc-text-muted">{talent.wins.toLocaleString()}{t("generated.stats.w.59d8abf")}{talent.losses.toLocaleString()}L</span><span className="text-pc-text-muted">{talent.pickRate.toFixed(1)}{t("generated.stats.pr.bd06fa1")}</span><span className="text-pc-text-muted">{talent.totalPlays.toLocaleString()} {t("generated.stats.picks")}</span></div>{comparisonSection === "talents" && <AllMapComparison rows={compared} summary={t("maps.allRankedMaps", { count: compared.length })} empty={t("maps.noComparisonData")} metrics={(row) => [{ label: t("generated.stats.wr"), value: `${row.winRate.toFixed(1)}%` }, { label: t("generated.stats.pr"), value: `${row.pickRate.toFixed(1)}%` }, { label: t("generated.stats.picks"), value: row.totalCount.toLocaleString() }]} />}</div></div>;
          })}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated p-8 text-center text-sm text-pc-text-muted">{t("generated.stats.noTalentObservationsMatchThisRole")}</div>}
        </section>
      )}

      {activeSection === "items" && (
        <section><div className="mb-3"><h2 className="pc-card-title">{t("generated.stats.itemMeta.ba645e0")}</h2><p className="mt-1 text-xs text-pc-text-muted">{t("maps.itemDescription")}</p></div><div className="space-y-5">{itemsByClass.map(({ itemClass, items }) => <div key={itemClass}><h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${itemClassColor(itemClass)}`}>{itemClass}</h3><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{items.map((item) => {
          const compared = comparisonByEntity.get(String(item.itemId)) ?? [];
          return <div key={item.itemId} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-2.5"><Link href={`/game/items/${item.itemId}`} className="flex items-center gap-2 transition-colors hover:text-pc-accent"><SmartImage src={itemIcon(item.itemName)} alt="" className="h-9 w-9 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-medium text-pc-text">{item.itemName}</span></Link><div className="mt-2 grid grid-cols-2 gap-2 text-[10px]"><div><span className="block" style={{ color: rateColor(item.winRate) }}>{item.winRate.toFixed(1)}{t("generated.stats.wr.6e80aee")}</span><span className="block text-pc-text-muted">{item.wins.toLocaleString()}{t("generated.stats.w.59d8abf")}{item.losses.toLocaleString()}L</span></div><div className="text-right text-pc-text-muted"><span className="block">{item.pickRate.toFixed(1)}{t("generated.stats.pr.bd06fa1")}</span><span className="block">{item.totalUses.toLocaleString()} {t("generated.stats.purchases.d29d2db")}</span></div></div>{comparisonSection === "items" && <AllMapComparison rows={compared} summary={t("maps.allRankedMaps", { count: compared.length })} empty={t("maps.noComparisonData")} metrics={(row) => [{ label: t("generated.stats.wr"), value: `${row.winRate.toFixed(1)}%` }, { label: t("generated.stats.pr"), value: `${row.pickRate.toFixed(1)}%` }, { label: t("generated.stats.purchases"), value: row.totalCount.toLocaleString() }]} />}</div>;
        })}</div></div>)}</div></section>
      )}

      {activeSection === "compositions" && (
        <section><div className="mb-3"><h2 className="pc-card-title">{t("generated.stats.compositionStats")}</h2><p className="mt-1 text-xs text-pc-text-muted">{t("maps.compositionDescription")}</p></div>{detail.compositions.length > 0 ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{detail.compositions.map((composition) => {
          const compared = comparisonByEntity.get(composition.composition) ?? [];
          return <div key={composition.composition} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-base font-bold text-pc-text">{composition.composition}</div><div className="text-xs text-pc-text-muted">{composition.totalMatches.toLocaleString()} {t("generated.stats.matches.9f3e924")}</div></div><div className="text-right font-bold" style={{ color: rateColor(composition.winRate) }}>{composition.winRate.toFixed(1)}%</div></div><div className="mt-3 grid grid-cols-4 gap-1.5">{COMPOSITION_COLUMNS.map((column) => <div key={column.key} className="rounded-lg bg-pc-bg-secondary/60 p-2 text-center"><img src={column.icon} alt="" className="mx-auto h-5 w-5 object-contain" /><div className="mt-1 font-mono text-sm font-semibold text-pc-text">{composition[column.key]}</div><div className="truncate text-xs uppercase text-pc-text-muted">{t(column.labelKey)}</div></div>)}</div>{comparisonSection === "compositions" && <AllMapComparison rows={compared} summary={t("maps.allRankedMaps", { count: compared.length })} empty={t("maps.noComparisonData")} metrics={(row) => [{ label: t("generated.stats.winRate"), value: `${row.winRate.toFixed(1)}%` }, { label: t("generated.stats.matches"), value: row.totalCount.toLocaleString() }]} />}</div>;
        })}</div> : <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated p-8 text-center text-sm text-pc-text-muted">{t("maps.noCompositions")}</div>}</section>
      )}
    </div>
  );
}
