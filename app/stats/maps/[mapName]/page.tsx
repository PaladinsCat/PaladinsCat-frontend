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

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.png`; }
function rateColor(rate: number) { return getStatQuality(rate, 1, 1).color; }
function duration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

type MapSection = "champions" | "talents" | "items";
type ChampionSort = "winRate" | "pickRate" | "banRate";

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

export default function MapDetailPage() {
  const params = useParams<{ mapName: string }>();
  const mapName = decodeURIComponent(params.mapName);
  const [detail, setDetail] = useState<MapDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState<MapSection>("champions");
  const [championSort, setChampionSort] = useState<ChampionSort>("winRate");

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

  const sortedChampions = useMemo(() => [...(detail?.champions ?? [])].sort((a, b) => {
    const difference = b[championSort] - a[championSort];
    return difference || b.totalPlays - a.totalPlays || a.championName.localeCompare(b.championName);
  }), [detail, championSort]);

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
          <div className="grid grid-cols-3 divide-x divide-pc-border rounded-lg border border-pc-border bg-pc-bg-secondary/70 text-center"><div className="px-4 py-2.5"><div className="text-[9px] uppercase text-pc-text-muted">Map share</div><div className="mt-1 font-bold text-pc-accent">{map.distributionRate.toFixed(1)}%</div></div><div className="px-4 py-2.5"><div className="text-[9px] uppercase text-pc-text-muted">Matches</div><div className="mt-1 font-bold text-pc-text">{map.totalMatches.toLocaleString()}</div></div><div className="px-4 py-2.5"><div className="text-[9px] uppercase text-pc-text-muted">Avg. time</div><div className="mt-1 font-bold text-pc-text">{duration(map.avgDurationSeconds)}</div></div></div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
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
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="pc-card-title">Champion performance</h2><p className="mt-1 text-xs text-pc-text-muted">Compact map-specific win, pick, and ban performance.</p></div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CHAMPION_SORTS.map((sort) => (
                <button key={sort.key} type="button" onClick={() => setChampionSort(sort.key)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${championSort === sort.key ? "bg-pc-accent text-pc-bg" : "pc-surface text-pc-text-secondary hover:text-pc-text"}`}>{sort.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {sortedChampions.map((champion) => {
              const quality = getStatQuality(champion.winRate, champion.pickRate, Math.max(1, ...detail.champions.map((row) => row.pickRate)));
              return <Link key={champion.championId} href={`/champions/${championSlug(champion.championName)}`} className="group rounded-lg border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid" style={{ borderColor: quality.borderColor }}>
                <div className="flex items-center gap-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-9 w-9 shrink-0 rounded-md object-contain" /><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{champion.championName}</div><div className="mt-0.5 text-[10px] text-pc-text-muted">{champion.totalPlays.toLocaleString()} plays</div></div></div>
                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-pc-border/60 pt-2 text-center"><div><div className="text-[8px] text-pc-text-muted">WR</div><div className="text-[11px] font-bold" style={{ color: rateColor(champion.winRate) }}>{champion.winRate.toFixed(1)}%</div></div><div><div className="text-[8px] text-pc-text-muted">PR</div><div className="text-[11px] font-semibold text-pc-text">{champion.pickRate.toFixed(1)}%</div></div><div><div className="text-[8px] text-pc-text-muted">BR</div><div className="text-[11px] font-semibold text-rose-400">{champion.banRate.toFixed(1)}%</div></div></div>
              </Link>;
            })}
          </div>
        </section>
      )}

      {activeSection === "talents" && (
        <section><div className="mb-3"><h2 className="pc-card-title">Talent picks</h2><p className="mt-1 text-xs text-pc-text-muted">Grouped by champion to make variants easy to compare.</p></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{detail.champions.map((champion) => { const talents = talentsByChampion.get(champion.championId) ?? []; if (!talents.length) return null; return <div key={champion.championId} className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><div className="flex items-center gap-2 border-b border-pc-border px-3 py-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 rounded object-contain" /><span className="text-xs font-semibold text-pc-text">{champion.championName}</span></div><div className="divide-y divide-pc-border/50">{talents.map((talent) => <div key={talent.talentId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-3 py-2 text-xs"><span className="truncate text-pc-text-secondary" title={talent.talentName}>{talent.talentName}</span><span style={{ color: rateColor(talent.winRate) }}>{talent.winRate.toFixed(1)}% WR</span><span className="text-pc-text-muted">{talent.pickRate.toFixed(1)}% PR</span></div>)}</div></div>; })}</div></section>
      )}

      {activeSection === "items" && (
        <section><div className="mb-3"><h2 className="pc-card-title">Item meta</h2><p className="mt-1 text-xs text-pc-text-muted">Top purchased item appearances on this map.</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{detail.items.map((item) => <Link href={`/stats/items/${item.itemId}`} key={item.itemId} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-2.5 transition-colors hover:border-pc-accent-mid"><div className="flex items-center gap-2"><SmartImage src={itemIcon(item.itemName)} alt="" className="h-9 w-9 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-medium text-pc-text">{item.itemName}</span></div><div className="mt-2 flex justify-between text-[10px]"><span style={{ color: rateColor(item.winRate) }}>{item.winRate.toFixed(1)}% WR</span><span className="text-pc-text-muted">{item.pickRate.toFixed(1)}% PR</span></div></Link>)}</div></section>
      )}
    </div>
  );
}
