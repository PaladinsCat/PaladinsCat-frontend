"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MatchFactPlayer, MatchPlayerDetail } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { loadBuildReferenceData, type BuildReferenceData } from "@/lib/build-reference";
import { championSlug } from "@/lib/utils";

type Props = { team1Players: MatchPlayerDetail[]; team2Players: MatchPlayerDetail[]; team1Wins: boolean; team2Wins: boolean; factMap: Map<string, MatchFactPlayer> };

// Reuse the exact resolver and source data used by champion/build pages.
// Cache per champion so the 10 match rows do not issue duplicate reference requests.
const referenceByChampion = new Map<number, Promise<BuildReferenceData>>();

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
    promise = loadBuildReferenceData(championId, championSlug(championName)).catch(() => ({ items: [], cards: [], talents: [] }));
    referenceByChampion.set(championId, promise);
  }
  return promise;
}

function Asset({ sources, alt, level, tone = "border-pc-border" }: { sources: Array<string | null | undefined>; alt: string; level?: number | null; tone?: string }) {
  const candidates = [...new Set(sources.filter((source): source is string => Boolean(source)))];
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [alt, candidates.join("|")]);
  const src = candidates[index];
  if (!src) return <div className="h-9 w-9 rounded border border-pc-border bg-pc-bg-secondary" title={alt} />;
  return <div className="relative shrink-0" title={alt}>
    <img src={src} alt={alt} className={`h-9 w-9 rounded border ${tone} object-cover`} loading="eager" onError={() => setIndex(current => Math.min(current + 1, candidates.length))} />
    {level != null && <span className="absolute -right-1 -top-1 min-w-3 rounded bg-pc-bg px-1 text-center text-[9px] font-bold text-pc-text ring-1 ring-pc-border">{level}</span>}
  </div>;
}

function PlayerBuildRow({ player, fact, wins }: { player: MatchPlayerDetail; fact?: MatchFactPlayer; wins: boolean }) {
  const champion = player.champion_name || `Champion #${player.champion_id}`;
  const [reference, setReference] = useState<BuildReferenceData | null>(null);
  useEffect(() => {
    let cancelled = false;
    getBuildReference(player.champion_id, player.champion_name || "").then((data) => { if (!cancelled) setReference(data); });
    return () => { cancelled = true; };
  }, [player.champion_id, player.champion_name]);
  const findIcon = (kind: "items" | "cards" | "talents", id: number, name: string | null | undefined) =>
    reference?.[kind].find((entry) => entry.id === id)?.iconUrl
    ?? reference?.[kind].find((entry) => normalizeName(entry.name) === normalizeName(name))?.iconUrl;

  return <div className={`grid min-w-[780px] grid-cols-[240px_1fr_1fr] items-center gap-4 border-b border-pc-border/60 px-4 py-3 last:border-b-0 ${wins ? "bg-emerald-400/[0.025]" : ""}`}>
    <div className="flex min-w-0 items-center gap-3"><img src={getChampionIconSafe(player.champion_name)} alt={champion} className="h-11 w-11 rounded-lg border border-pc-border object-cover" onError={(event) => { event.currentTarget.src = "/images/champions/Champion_Generic_Icon.avif"; }} /><div className="min-w-0"><Link href={`/players/${player.player_id}`} className="block truncate text-sm font-semibold text-pc-text hover:text-pc-accent">{player.player_name || "PRIVATE"}</Link>{player.champion_name && <Link href={`/champions/${championSlug(player.champion_name)}`} className="text-xs text-pc-text-secondary hover:text-pc-accent">{champion}</Link>}</div></div>
    <div className="flex items-center gap-1.5">{(fact?.talents ?? []).map(t => <Asset key={`talent-${t.talent_id}`} sources={[findIcon("talents", t.talent_id, t.talent_name), t.icon_url, t.fallback_icon_url]} alt={t.talent_name ?? "Talent"} tone="border-amber-400/40" />)}{(fact?.cards ?? []).map(c => <Asset key={`card-${c.card_id}`} sources={[findIcon("cards", c.card_id, c.card_name), c.icon_url, c.fallback_icon_url]} alt={c.card_name ?? "Loadout card"} level={c.card_level ?? undefined} tone="border-pc-accent/30" />)}</div>
    <div className="flex items-center gap-1.5">{(fact?.items ?? []).map(i => <Asset key={`item-${i.slot}-${i.item_id}`} sources={[findIcon("items", i.item_id, i.item_name), i.icon_url, i.fallback_icon_url]} alt={i.item_name ?? "Item"} level={i.item_level == null ? undefined : i.item_level + 1} />)}</div>
  </div>;
}

export default function ItemsLoadoutsSection({ team1Players, team2Players, team1Wins, team2Wins, factMap }: Props) {
  const rows = (players: MatchPlayerDetail[], wins: boolean) => players.map(p => <PlayerBuildRow key={p.player_id} player={p} fact={factMap.get(String(p.player_id))} wins={wins} />);
  return <section className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-pc-border px-4 py-3"><div><h2 className="text-lg font-bold uppercase tracking-wide text-pc-text">Items &amp; Loadouts</h2><p className="mt-0.5 text-xs text-pc-text-muted">Talent and cards · purchased items</p></div></div><div className="overflow-x-auto"><div className="grid min-w-[780px] grid-cols-[240px_1fr_1fr] gap-4 border-b border-pc-border bg-pc-bg-secondary/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted"><span>Champion / player</span><span>Loadout</span><span>Items</span></div>{rows(team1Players, team1Wins)}<div className="flex items-center gap-3 bg-pc-bg-secondary/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-pc-text-muted"><span className={`h-1.5 w-1.5 rounded-full ${team2Wins ? "bg-emerald-400" : "bg-red-400"}`} />Opposing team</div>{rows(team2Players, team2Wins)}</div></section>;
}
