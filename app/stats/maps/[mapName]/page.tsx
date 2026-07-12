"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SmartImage from "@/components/SmartImage";
import { fetchMapDetail, type MapDetailStats } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { getStatQuality } from "@/lib/stat-quality";
import { mapImagePath } from "@/lib/map-images";
import { STATIC_CHAMPIONS } from "@/lib/static-champions";
import { getTalentImageUrl } from "@/lib/image-assets";

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.png`; }
function rateColor(rate: number) { return getStatQuality(rate, 1, 1).color; }
function itemClassColor(itemClass: string) {
  return itemClass === "Offense" ? "text-red-400" : itemClass === "Defense" ? "text-blue-400" : itemClass === "Healing" ? "text-emerald-400" : "text-amber-400";
}
function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

type MapSection = "champions" | "talents" | "items";
type ChampionSort = "winRate" | "pickRate" | "banRate";
type TalentSort = "winRate" | "pickRate" | "totalPlays";

const MAP_SECTIONS: Array<{ key: MapSection; label: string }> = [
  { key: "champions", label: "Champions" },
  { key: "talents", label: "Talents" },
  { key: "items", label: "Items" },
];

const CHAMPION_SORTS: Array<{ key: ChampionSort; label: string }> = [
  { key: "winRate", label: "Win rate" },
  { key: "pickRate", label: "Pick rate" },
  { key: "banRate", label: "Ban rate" },
];

const TALENT_SORTS: Array<{ key: TalentSort; label: string }> = [
  { key: "winRate", label: "Win rate" },
  { key: "pickRate", label: "Pick rate" },
  { key: "totalPlays", label: "Plays" },
];

const ROLES = [
  { label: "Frontline", icon: "/images/icons/Class_Front_Line_Icon.avif" },
  { label: "Damage", icon: "/images/icons/Class_Damage_Icon.avif" },
  { label: "Flank", icon: "/images/icons/Class_Flank_Icon.avif" },
  { label: "Support", icon: "/images/icons/Class_Support_Icon.avif" },
] as const;

const CHAMPION_ROLE_BY_SLUG = new Map(STATIC_CHAMPIONS.map((champion) => [championSlug(champion.name), champion.roles[0] ?? ""]));
const CHAMPION_NAME_BY_SLUG = new Map(STATIC_CHAMPIONS.map((champion) => [championSlug(champion.name), champion.name]));
const TALENT_ICON_ALIASES = new Map([
  ["maldamba:wekonoswrath", "/images/champions/Talent Mal'Damba Wekono's Wrath.avif"],
  ["maldamba:ripenedgourd", "/images/champions/Talent Mal'Damba Ripened Gourd.avif"],
  ["maldamba:spiritschosen", "/images/champions/Talent Mal'Damba Spirit's Chosen.avif"],
  ["seris:resuscitate", "/images/champions/Talent Seris Soul Collector.avif"],
  ["barik:tinkerin", "/images/champions/Talent Barik Tinkerin'.avif"],
  ["io:goddessblessing", "/images/champions/Talent Io Goddess's Blessing.avif"],
]);

function talentIcon(championName: string, talentName: string) {
  const alias = TALENT_ICON_ALIASES.get(`${championSlug(championName)}:${championSlug(talentName)}`);
  if (alias) return alias;
  return getTalentImageUrl(CHAMPION_NAME_BY_SLUG.get(championSlug(championName)) ?? championName, talentName, "avif");
}

const ITEM_CLASS_BY_NAME: Record<string, string> = {
  "Blast Shields": "Defense", Guardian: "Defense", Haven: "Defense", Illuminate: "Defense", Resilience: "Defense", Sentinel: "Defense",
  Chronos: "Utility", Hoard: "Utility", "Master Riding": "Utility", "Morale Boost": "Utility", Nimble: "Utility",
  Bloodbath: "Healing", "Kill to Heal": "Healing", "Life Rip": "Healing", Meditation: "Healing", Rejuvenate: "Healing", Veteran: "Healing",
  Bulldozer: "Offense", "Deft Hands": "Offense", Lethality: "Offense", "Trigger Scent": "Offense", Wrecker: "Offense",
};

const ITEM_CLASSES = ["Defense", "Utility", "Healing", "Offense"] as const;

export default function MapDetailPage() {
  const params = useParams<{ mapName: string }>();
  const mapName = decodeURIComponent(params.mapName);
  const [detail, setDetail] = useState<MapDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<MapSection>("champions");
  const [championRole, setChampionRole] = useState<string | null>(null);
  const [championSort, setChampionSort] = useState<ChampionSort>("winRate");
  const [talentRole, setTalentRole] = useState<string | null>(null);
  const [talentSort, setTalentSort] = useState<TalentSort>("winRate");

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
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

  if (!detail) return <div className="pc-card py-12 text-center text-sm text-pc-text-secondary">{loaded ? "Map statistics are unavailable." : "Loading map statistics…"}</div>;
  const { map } = detail;

  return (
    <div className="space-y-6">
      <Link href="/stats/maps" className="text-sm text-pc-text-secondary hover:text-pc-accent">← All maps</Link>

      <section className="relative overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
        <SmartImage src={mapImagePath(map.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-pc-bg-elevated via-pc-bg-elevated/90 to-pc-bg-elevated/45" />
        <div className="relative grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-7">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-pc-text-muted">Ranked map meta</p><h1 className="mt-1 pc-heading pc-heading-lg text-pc-accent">{map.name.replace(/^Ranked\s+/, "")}</h1><p className="mt-1 text-sm text-pc-text-secondary">Champion, talent, and item performance in one compact map-specific view.</p></div>
          <div className="grid grid-cols-3 divide-x divide-pc-border rounded-lg border border-pc-border bg-pc-bg-secondary/70 text-center"><div className="px-4 py-2.5"><div className="text-[10px] uppercase text-pc-text-muted">Map share</div><div className="mt-1 font-bold text-pc-accent">{map.distributionRate.toFixed(1)}%</div></div><div className="px-4 py-2.5"><div className="text-[10px] uppercase text-pc-text-muted">Matches</div><div className="mt-1 font-bold text-pc-text">{map.totalMatches.toLocaleString()}</div></div><div className="px-4 py-2.5"><div className="text-[10px] uppercase text-pc-text-muted">Avg. time</div><div className="mt-1 font-bold text-pc-text">{duration(map.avgDurationSeconds)}</div></div></div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MAP_SECTIONS.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveSection(section.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${activeSection === section.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}
          >
            {section.label}
            <span className={`text-[10px] ${activeSection === section.key ? "text-pc-bg/70" : "text-pc-text-muted"}`}>
              {section.key === "champions" ? detail.champions.length : section.key === "talents" ? detail.talents.length : detail.items.length}
            </span>
          </button>
        ))}
      </div>

      {activeSection === "champions" && (
        <section>
          <div className="mb-3"><h2 className="pc-card-title">Champion performance</h2><p className="mt-1 text-xs text-pc-text-muted">Filter by role and sort compact map-specific win, pick, and ban performance.</p></div>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setChampionRole(null)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${championRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>All</button>
              {ROLES.map((role) => <button key={role.label} type="button" onClick={() => setChampionRole(role.label)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${championRole === role.label ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{role.label}</button>)}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CHAMPION_SORTS.map((sort) => <button key={sort.key} type="button" onClick={() => setChampionSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${championSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{sort.label}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {sortedChampions.map((champion) => {
              const quality = getStatQuality(champion.winRate, champion.pickRate, Math.max(1, ...detail.champions.map((row) => row.pickRate)));
              return <Link key={champion.championId} href={`/champions/${championSlug(champion.championName)}`} className="group rounded-lg border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
                <div className="flex items-center gap-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{champion.championName}</div><div className="mt-0.5 text-[10px] uppercase text-pc-text-muted">{CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName))}</div></div></div>
                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-pc-border/60 pt-2 text-center"><div><div className="text-[10px] text-pc-text-muted">WR</div><div className="text-[11px] font-bold" style={{ color: rateColor(champion.winRate) }}>{champion.winRate.toFixed(1)}%</div></div><div><div className="text-[10px] text-pc-text-muted">PR</div><div className="text-[11px] font-semibold text-pc-text">{champion.pickRate.toFixed(1)}%</div><div className="text-[10px] text-pc-text-muted">{champion.totalPlays.toLocaleString()} picks</div></div><div><div className="text-[10px] text-pc-text-muted">BR</div><div className="text-[11px] font-semibold text-rose-400">{champion.banRate.toFixed(1)}%</div></div></div>
              </Link>;
            })}
          </div>
        </section>
      )}

      {activeSection === "talents" && (
        <section>
          <div className="mb-3"><h2 className="pc-card-title">Talent picks</h2><p className="mt-1 text-xs text-pc-text-muted">Filter champions by role and rank their talents by map-specific performance.</p></div>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button type="button" onClick={() => setTalentRole(null)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${talentRole === null ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}>All</button>
              {ROLES.map((role) => <button key={role.label} type="button" onClick={() => setTalentRole(role.label)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors ${talentRole === role.label ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-muted hover:text-pc-text"}`}><img src={role.icon} alt="" className="h-5 w-5" />{role.label}</button>)}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TALENT_SORTS.map((sort) => <button key={sort.key} type="button" onClick={() => setTalentSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${talentSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{sort.label}</button>)}
            </div>
          </div>
          {talentGroups.length > 0 ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{talentGroups.map(({ champion, talents }) => <div key={champion.championId} className="overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated"><div className="flex items-center gap-2 border-b border-pc-border px-2.5 py-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-pc-text">{champion.championName}</span><span className="text-[10px] uppercase text-pc-text-muted">{CHAMPION_ROLE_BY_SLUG.get(championSlug(champion.championName))}</span></div><div className="divide-y divide-pc-border/50">{talents.map((talent) => <div key={talent.talentId} className="flex items-center gap-2 px-2.5 py-2"><SmartImage src={talent.iconUrl ?? talentIcon(champion.championName, talent.talentName)} alt="" className="h-8 w-8 shrink-0 rounded object-cover" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-medium text-pc-text-secondary" title={talent.talentName}>{talent.talentName}</div><div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]"><span style={{ color: rateColor(talent.winRate) }}>{talent.winRate.toFixed(1)}% WR</span><span className="text-pc-text-muted">{talent.pickRate.toFixed(1)}% PR</span><span className="text-pc-text-muted">{talent.totalPlays.toLocaleString()} picks</span></div></div></div>)}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated p-8 text-center text-sm text-pc-text-muted">No talent observations match this role.</div>}
        </section>
      )}

      {activeSection === "items" && (
        <section><div className="mb-3"><h2 className="pc-card-title">Item meta</h2><p className="mt-1 text-xs text-pc-text-muted">Top purchased item appearances grouped by item class.</p></div><div className="space-y-5">{itemsByClass.map(({ itemClass, items }) => <div key={itemClass}><h3 className={`mb-2 text-xs font-bold uppercase tracking-wider ${itemClassColor(itemClass)}`}>{itemClass}</h3><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{items.map((item) => <Link href={`/stats/items/${item.itemId}`} key={item.itemId} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid"><div className="flex items-center gap-2"><SmartImage src={itemIcon(item.itemName)} alt="" className="h-9 w-9 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-medium text-pc-text">{item.itemName}</span></div><div className="mt-2 flex items-start justify-between gap-2 text-[10px]"><span style={{ color: rateColor(item.winRate) }}>{item.winRate.toFixed(1)}% WR</span><span className="text-right text-pc-text-muted"><span className="block">{item.pickRate.toFixed(1)}% PR</span><span className="block text-[10px]">{item.totalUses.toLocaleString()} purchases</span></span></div></Link>)}</div></div>)}</div></section>
      )}
    </div>
  );
}
