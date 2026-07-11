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

export default function MapDetailPage() {
  const params = useParams<{ mapName: string }>();
  const mapName = decodeURIComponent(params.mapName);
  const [detail, setDetail] = useState<MapDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);

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

      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="pc-card-title">Champion performance</h2><p className="mt-1 text-xs text-pc-text-muted">Each card keeps a champion’s most useful map-specific signals together.</p></div><span className="text-xs text-pc-text-muted">{detail.champions.length} champions</span></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {detail.champions.map((champion) => <Link key={champion.championId} href={`/champions/${championSlug(champion.championName)}`} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-3 transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary/70">
            <div className="flex items-center gap-3"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-10 w-10 rounded-lg object-contain" /><div className="min-w-0 flex-1"><div className="truncate font-semibold text-pc-text">{champion.championName}</div><div className="text-xs text-pc-text-muted">{champion.totalPlays.toLocaleString()} plays · {champion.wins}/{champion.losses} W/L</div></div><div className="text-right"><div className="text-[10px] uppercase text-pc-text-muted">Win rate</div><div className="font-bold" style={{ color: rateColor(champion.winRate) }}>{champion.winRate.toFixed(1)}%</div></div></div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-pc-border/60 pt-2 text-xs"><div className="rounded bg-pc-bg px-2 py-1.5"><span className="text-pc-text-muted">Pick</span><span className="float-right text-pc-text">{champion.pickRate.toFixed(1)}%</span></div><div className="rounded bg-pc-bg px-2 py-1.5"><span className="text-pc-text-muted">Ban</span><span className="float-right text-rose-400">{champion.banRate.toFixed(1)}%</span></div></div>
          </Link>)}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(21rem,0.6fr)]">
        <div><div className="mb-3"><h2 className="pc-card-title">Talent picks</h2><p className="mt-1 text-xs text-pc-text-muted">Grouped by champion to make variants easy to compare without a dense global table.</p></div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{detail.champions.map((champion) => { const talents = talentsByChampion.get(champion.championId) ?? []; if (!talents.length) return null; return <div key={champion.championId} className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><div className="flex items-center gap-2 border-b border-pc-border px-3 py-2"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 rounded object-contain" /><span className="text-xs font-semibold text-pc-text">{champion.championName}</span></div><div className="divide-y divide-pc-border/50">{talents.map((talent) => <div key={talent.talentId} className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 px-3 py-2 text-xs"><span className="truncate text-pc-text-secondary" title={talent.talentName}>{talent.talentName}</span><span style={{ color: rateColor(talent.winRate) }}>{talent.winRate.toFixed(1)}% WR</span><span className="text-pc-text-muted">{talent.pickRate.toFixed(1)}% PR</span></div>)}</div></div>; })}</div></div>
        <div><div className="mb-3"><h2 className="pc-card-title">Item meta</h2><p className="mt-1 text-xs text-pc-text-muted">Top purchased item appearances on this map.</p></div><div className="grid grid-cols-2 gap-2">{detail.items.map((item) => <div key={item.itemId} className="rounded-xl border border-pc-border bg-pc-bg-elevated p-2.5"><div className="flex items-center gap-2"><SmartImage src={itemIcon(item.itemName)} alt="" className="h-9 w-9 rounded object-contain" /><span className="min-w-0 flex-1 truncate text-xs font-medium text-pc-text">{item.itemName}</span></div><div className="mt-2 flex justify-between text-[10px]"><span style={{ color: rateColor(item.winRate) }}>{item.winRate.toFixed(1)}% WR</span><span className="text-pc-text-muted">{item.pickRate.toFixed(1)}% PR</span></div></div>)}</div></div>
      </section>
    </div>
  );
}
