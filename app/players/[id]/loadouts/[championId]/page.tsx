"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import { ErrorState, LoadingPanel } from "@/components/async-state";
import { fetchPlayerLoadouts, refreshPlayerLoadouts, type PlayerLoadoutsResponse } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { loadBuildReferenceData, type BuildCardReference } from "@/lib/build-reference";
import { getPlayerLoadoutChampionRoster, type PlayerLoadoutChampion } from "@/lib/player-loadout-roster";
import { championSlug } from "@/lib/utils";

function formatCooldown(seconds: number) { const minutes = Math.floor(Math.max(0, seconds) / 60); const remainder = Math.max(0, seconds) % 60; return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`; }

export default function ChampionLoadoutsPage() {
  const params = useParams<{ id: string; championId: string }>();
  const playerId = String(params.id ?? "");
  const championId = Number(params.championId ?? 0);
  const [champions, setChampions] = useState<PlayerLoadoutChampion[]>([]);
  const champion = champions.find((entry) => entry.id === championId) ?? null;
  const [data, setData] = useState<PlayerLoadoutsResponse | null>(null);
  const [references, setReferences] = useState<BuildCardReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => { if (!playerId) return; setLoading(true); setError(null); try { setData(await fetchPlayerLoadouts(playerId)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load player loadouts."); } finally { setLoading(false); } }, [playerId]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { getPlayerLoadoutChampionRoster().then(setChampions); }, []);
  useEffect(() => { if (!champion) return; loadBuildReferenceData(champion.id, championSlug(champion.name)).then((reference) => setReferences(reference.cards)).catch(() => setReferences([])); }, [champion]);

  const refresh = async () => { if (!data || data.freshness.manualRefreshRemainingSeconds > 0) return; setRefreshing(true); setError(null); try { setData(await refreshPlayerLoadouts(playerId)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not refresh player loadouts."); } finally { setRefreshing(false); } };
  const decks = useMemo(() => data?.loadouts.filter((loadout) => loadout.championId === championId) ?? [], [data, championId]);
  const cardsById = useMemo(() => new Map(references.map((card) => [card.id, card])), [references]);

  if (!champions.length) return <LoadingPanel label="Loading champion roster…" />;
  if (!champion) return <ErrorState title="Champion unavailable" message="This champion is not in the current roster." />;
  if (loading) return <LoadingPanel label="Loading saved decks…" detail="Reading the local player-loadout cache." />;
  if (error && !data) return <ErrorState title="Loadouts unavailable" message={error} onRetry={load} />;

  return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Link href={`/players/${playerId}/loadouts`} className="mb-2 inline-block text-xs text-pc-accent hover:underline">← All champions</Link><div className="flex items-center gap-3"><img src={getChampionIconSafe(champion.name)} alt="" className="h-12 w-12 rounded-xl object-contain" /><div><h1 className="pc-heading pc-heading-lg text-pc-accent">{champion.name} Loadouts</h1><p className="text-sm text-pc-text-secondary">{decks.length} saved deck{decks.length === 1 ? "" : "s"} for this player.</p></div></div></div><button type="button" onClick={refresh} disabled={refreshing || !data || data.freshness.manualRefreshRemainingSeconds > 0} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs font-semibold text-pc-text hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-50">{refreshing ? "Refreshing…" : data && data.freshness.manualRefreshRemainingSeconds > 0 ? `Refresh in ${formatCooldown(data.freshness.manualRefreshRemainingSeconds)}` : "Refresh"}</button></div>{error && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</div>}<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">{decks.map((deck) => <Link key={deck.id} href={`/players/${playerId}/loadouts/${championId}/${deck.id}`} className="group overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary"><div className="flex items-center justify-between border-b border-pc-border px-4 py-3"><div className="min-w-0"><div className="truncate font-semibold text-pc-text group-hover:text-pc-accent">{deck.loadoutName}</div><div className="text-[10px] uppercase tracking-wider text-pc-text-muted">Saved deck</div></div><span className="rounded-full bg-pc-accent/10 px-2 py-1 text-[10px] font-semibold text-pc-accent">View</span></div><div className="grid grid-cols-5 gap-1.5 p-3">{deck.cardIds.slice(0, 5).map((cardId, index) => { const card = cardsById.get(cardId); const level = deck.cardLevels[index] ?? 0; return <div key={`${cardId}-${index}`} className="relative aspect-[0.72] overflow-hidden rounded border border-pc-border bg-pc-bg"><SmartImage src={card?.iconUrl || "/images/icons/Player_Loadouts_Icon.png"} alt={card?.name || `Card ${cardId}`} className="h-full w-full object-cover" />{level > 0 && <span className="absolute bottom-0 right-0 rounded-tl bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white">{level}</span>}</div>; })}</div></Link>)}{decks.length === 0 && <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated p-8 text-center text-sm text-pc-text-muted lg:col-span-2 xl:col-span-3">This player has no saved {champion.name} decks in the current cached response.</div>}</div></div>;
}
