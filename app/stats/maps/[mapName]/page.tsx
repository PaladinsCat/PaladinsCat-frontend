"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SmartImage from "@/components/SmartImage";
import { fetchMapDetail, type MapDetailStats } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getStatQuality } from "@/lib/stat-quality";
import { mapImagePath } from "@/lib/map-images";

function itemIcon(name: string) { return `/images/items/${name.replace(/\s+/g, "_")}_Icon.png`; }
function rateColor(rate: number) { return getStatQuality(rate, 1, 1).color; }

export default function MapDetailPage() {
  const params = useParams<{ mapName: string }>();
  const mapName = decodeURIComponent(params.mapName);
  const [detail, setDetail] = useState<MapDetailStats | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); fetchMapDetail(mapName).then(setDetail).finally(() => setLoaded(true)); }, [mapName]);
  const talentsByChampion = useMemo(() => { const grouped = new Map<number, MapDetailStats["talents"]>(); detail?.talents.forEach((talent) => grouped.set(talent.championId, [...(grouped.get(talent.championId) ?? []), talent])); return grouped; }, [detail]);
  if (!detail) return <div className="pc-card py-12 text-center text-sm text-pc-text-secondary">{loaded ? "Map statistics are unavailable." : "Loading map statistics…"}</div>;
  const { map } = detail;
  return <div className="space-y-6">
    <Link href="/stats/maps" className="text-sm text-pc-text-secondary hover:text-pc-accent">← All maps</Link>
    <section className="relative overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><SmartImage src={mapImagePath(map.name)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="absolute inset-0 bg-gradient-to-r from-pc-bg-elevated via-pc-bg-elevated/90 to-pc-bg-elevated/40" /><div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="pc-heading pc-heading-lg text-pc-accent">{map.name.replace(/^Ranked\s+/, "")}</h1><p className="mt-1 text-sm text-pc-text-secondary">Ranked side balance and map-specific meta.</p></div><div className="grid grid-cols-4 gap-5 text-right text-sm"><div><div className="text-[9px] uppercase text-pc-text-muted">Side WR</div><div className="font-bold" style={{ color: rateColor(map.winRate) }}>{map.winRate.toFixed(1)}%</div></div><div><div className="text-[9px] uppercase text-pc-text-muted">W</div><div className="font-bold text-pc-text">{map.wins.toLocaleString()}</div></div><div><div className="text-[9px] uppercase text-pc-text-muted">L</div><div className="font-bold text-pc-text">{map.losses.toLocaleString()}</div></div><div><div className="text-[9px] uppercase text-pc-text-muted">Matches</div><div className="font-bold text-pc-text">{map.totalMatches.toLocaleString()}</div></div></div></div></section>
    <section className="pc-card overflow-x-auto"><h2 className="pc-card-title mb-3">Champion performance</h2><table className="w-full min-w-[680px] text-xs"><thead><tr className="border-b border-pc-border text-left text-pc-text-muted"><th className="px-2 py-2">Champion</th><th className="px-2 py-2 text-right">WR</th><th className="px-2 py-2 text-right">Pick</th><th className="px-2 py-2 text-right">Ban</th><th className="px-2 py-2 text-right">W/L</th><th className="px-2 py-2 text-right">Plays</th></tr></thead><tbody>{detail.champions.map((champion) => <tr key={champion.championId} className="border-b border-pc-border/50"><td className="flex items-center gap-2 px-2 py-2 font-medium text-pc-text"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-7 w-7 rounded-full" />{champion.championName}</td><td className="px-2 py-2 text-right font-semibold" style={{ color: rateColor(champion.winRate) }}>{champion.winRate.toFixed(1)}%</td><td className="px-2 py-2 text-right text-pc-text-secondary">{champion.pickRate.toFixed(1)}%</td><td className="px-2 py-2 text-right text-rose-400">{champion.banRate.toFixed(1)}%</td><td className="px-2 py-2 text-right text-pc-text-secondary">{champion.wins}/{champion.losses}</td><td className="px-2 py-2 text-right text-pc-text">{champion.totalPlays.toLocaleString()}</td></tr>)}</tbody></table></section>
    <section><h2 className="pc-card-title mb-3">Talents</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">{detail.champions.map((champion) => { const talents = talentsByChampion.get(champion.championId) ?? []; if (talents.length === 0) return null; return <div key={champion.championId} className="pc-card"><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-pc-text"><img src={getChampionIconSafe(champion.championName)} alt="" className="h-6 w-6 rounded-full" />{champion.championName}</div><div className="space-y-1.5">{talents.map((talent) => <div key={talent.talentId} className="flex items-center justify-between gap-2 text-[11px]"><span className="truncate text-pc-text-secondary">{talent.talentName}</span><span className="shrink-0" style={{ color: rateColor(talent.winRate) }}>{talent.winRate.toFixed(1)}% WR</span><span className="shrink-0 text-pc-text-muted">{talent.pickRate.toFixed(1)}% PR</span></div>)}</div></div>; })}</div></section>
    <section><h2 className="pc-card-title mb-3">Item meta</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{detail.items.map((item) => <div key={item.itemId} className="rounded-lg border border-pc-border bg-pc-bg-elevated p-2"><div className="flex items-center gap-2"><SmartImage src={itemIcon(item.itemName)} alt="" className="h-9 w-9 rounded object-contain" /><span className="truncate text-xs font-medium text-pc-text">{item.itemName}</span></div><div className="mt-2 flex justify-between text-[10px]"><span style={{ color: rateColor(item.winRate) }}>{item.winRate.toFixed(1)}% WR</span><span className="text-pc-text-muted">{item.pickRate.toFixed(1)}% PR</span></div></div>)}</div></section>
  </div>;
}
