"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { MatchFactPlayer, MatchPlayerDetail } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { loadBuildReferenceData, type BuildReferenceData } from "@/lib/build-reference";
import { championSlug } from "@/lib/utils";
import { canonicalLocalImageUrl } from "@/lib/image-assets";

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

function formatDescription(description: string | null | undefined, level: number, multiplyPlainValues = false) {
  if (!description) return null;
  return description
    .replace(/\{(?:scale=)?(-?\d*\.?\d+)\|(-?\d*\.?\d+)\}/gi, (_match, base: string, step: string) => (
      cleanNumber(Number(base) + Number(step) * Math.max(0, level - 1))
    ))
    .replace(/\{(-?\d*\.?\d+)\}/g, (_match, value: string) => (
      cleanNumber(Number(value) * (multiplyPlainValues ? Math.max(1, level) : 1))
    ));
}

function DetailEntry({
  name,
  description,
  sources,
  level,
  tone,
  label,
}: {
  name: string;
  description: string;
  sources: Array<string | null | undefined>;
  level?: number | null;
  tone?: string;
  label: string;
}) {
  return <article className="flex min-w-0 items-start gap-3 rounded-lg border border-pc-border/70 bg-pc-bg-secondary/45 p-3">
    <Asset sources={sources} alt={name} level={level} tone={tone} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h4 className="text-xs font-semibold text-pc-text">{name}</h4>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-pc-text-muted">{label}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-pc-text-secondary">{description}</p>
    </div>
  </article>;
}

function PlayerBuildRow({ player, fact, wins }: { player: MatchPlayerDetail; fact?: MatchFactPlayer; wins: boolean }) {
  const champion = player.champion_name || `Champion #${player.champion_id}`;
  const [reference, setReference] = useState<BuildReferenceData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const disclosureId = useId();
  useEffect(() => {
    let cancelled = false;
    getBuildReference(player.champion_id, player.champion_name || "").then((data) => { if (!cancelled) setReference(data); });
    return () => { cancelled = true; };
  }, [player.champion_id, player.champion_name]);
  const findReference = (kind: "items" | "cards" | "talents", id: number, name: string | null | undefined) => (
    reference?.[kind].find((entry) => entry.id === id)
    ?? reference?.[kind].find((entry) => normalizeName(entry.name) === normalizeName(name))
  );
  const talents = fact?.talents ?? [];
  const cards = fact?.cards ?? [];
  const items = fact?.items ?? [];
  const playerName = player.player_name || "PRIVATE";

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
        onClick={() => setExpanded((current) => !current)}
        className="col-start-2 row-start-1 flex h-9 w-9 items-center justify-center rounded-lg border border-pc-border bg-pc-bg-secondary text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent lg:col-start-4"
      >
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
    </div>

    {expanded && <div id={disclosureId} className="border-t border-pc-border/60 bg-pc-bg/25 px-3 py-4 lg:px-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="space-y-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted">Talent &amp; loadout cards</h3>
          {talents.map((talent) => {
            const entry = findReference("talents", talent.talent_id, talent.talent_name);
            const name = talent.talent_name ?? entry?.name ?? `Talent #${talent.talent_id}`;
            return <DetailEntry key={`talent-detail-${talent.talent_id}`} name={name} label="Talent" description={formatDescription(entry?.description, 1) ?? (reference ? "Description unavailable." : "Loading description…")} sources={[entry?.iconUrl, talent.icon_url, talent.fallback_icon_url]} tone="border-amber-400/40" />;
          })}
          {cards.map((card) => {
            const entry = findReference("cards", card.card_id, card.card_name);
            const level = Math.max(1, card.card_level ?? 1);
            const name = card.card_name ?? entry?.name ?? `Card #${card.card_id}`;
            return <DetailEntry key={`card-detail-${card.card_id}`} name={name} label={`Card · level ${level}`} description={formatDescription(entry?.description, level) ?? (reference ? "Description unavailable." : "Loading description…")} sources={[entry?.iconUrl, card.icon_url, card.fallback_icon_url]} level={level} tone="border-pc-accent/30" />;
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
            return <DetailEntry key={`item-detail-${item.slot}-${item.item_id}`} name={name} label={`Item · level ${level}`} description={formatDescription(description, level, true) ?? (reference ? "Description unavailable." : "Loading description…")} sources={[entry?.iconUrl, item.icon_url, item.fallback_icon_url]} level={level} />;
          })}
          {items.length === 0 && <p className="text-xs text-pc-text-muted">No purchased items were recorded.</p>}
        </section>
      </div>
    </div>}
  </div>;
}

export default function ItemsLoadoutsSection({ team1Players, team2Players, team1Wins, team2Wins, factMap }: Props) {
  const rows = (players: MatchPlayerDetail[], wins: boolean) => players.map(p => <PlayerBuildRow key={p.player_id} player={p} fact={factMap.get(String(p.player_id))} wins={wins} />);
  return <section className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-pc-border px-4 py-3"><div><h2 className="text-lg font-bold uppercase tracking-wide text-pc-text">Items &amp; Loadouts</h2><p className="mt-0.5 text-xs text-pc-text-muted">Talent and cards · purchased items · expand a row for descriptions</p></div></div><div className="overflow-x-hidden lg:overflow-x-auto"><div className="hidden min-w-[780px] grid-cols-[240px_1fr_1fr_36px] gap-4 border-b border-pc-border bg-pc-bg-secondary/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-pc-text-muted lg:grid"><span>Champion / player</span><span>Loadout</span><span>Items</span><span className="sr-only">Details</span></div>{rows(team1Players, team1Wins)}<div className="flex items-center gap-3 bg-pc-bg-secondary/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-pc-text-muted"><span className={`h-1.5 w-1.5 rounded-full ${team2Wins ? "bg-emerald-400" : "bg-red-400"}`} />Opposing team</div>{rows(team2Players, team2Wins)}</div></section>;
}
