"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, LoadingIndicator, LoadingPanel } from "@/components/async-state";
import { fetchPlayerLoadouts, refreshPlayerLoadouts, type PlayerLoadoutsResponse } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { getPlayerLoadoutChampionRoster, type PlayerLoadoutChampion } from "@/lib/player-loadout-roster";

const ROLE_ORDER = ["Frontline", "Damage", "Flank", "Support"];

function formatCooldown(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

export default function PlayerLoadoutsPage() {
  const params = useParams<{ id: string }>();
  const playerId = String(params.id ?? "");
  const [data, setData] = useState<PlayerLoadoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [champions, setChampions] = useState<PlayerLoadoutChampion[]>([]);
  const [manualRefreshRemainingSeconds, setManualRefreshRemainingSeconds] = useState(0);

  const load = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchPlayerLoadouts(playerId);
      setData(response);
      setError(response.refreshError);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load player loadouts."); }
    finally { setLoading(false); }
  }, [playerId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { getPlayerLoadoutChampionRoster().then(setChampions); }, []);
  useEffect(() => {
    const availableAt = data?.freshness.manualRefreshAvailableAt;
    if (!availableAt) {
      setManualRefreshRemainingSeconds(0);
      return;
    }
    const updateRemaining = () => setManualRefreshRemainingSeconds(
      Math.max(0, Math.ceil((new Date(availableAt).getTime() - Date.now()) / 1000)),
    );
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [data?.freshness.manualRefreshAvailableAt]);

  const refresh = async () => {
    if (!data || manualRefreshRemainingSeconds > 0) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await refreshPlayerLoadouts(playerId);
      setData(response);
      setError(response.refreshError);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh player loadouts.");
    } finally {
      setRefreshing(false);
    }
  };

  const counts = useMemo(() => new Map(data?.loadouts.reduce((entries, loadout) => {
    entries.set(loadout.championId, (entries.get(loadout.championId) ?? 0) + 1);
    return entries;
  }, new Map<number, number>()) ?? []), [data]);

  if (loading) return <LoadingPanel />;
  if (error && !data) return <ErrorState title="Loadouts unavailable" message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Link href={`/players/${playerId}`} className="mb-2 inline-block text-xs text-pc-accent hover:underline">← Player profile</Link><h1 className="pc-heading pc-heading-lg text-pc-accent">Player Loadouts</h1><p className="mt-1 text-sm text-pc-text-secondary">Choose a champion to see this player&apos;s saved in-game decks.</p></div>
        <button type="button" onClick={refresh} disabled={refreshing || !data || manualRefreshRemainingSeconds > 0} className="rounded-lg border border-pc-border bg-pc-bg-elevated px-3 py-2 text-xs font-semibold text-pc-text hover:border-pc-accent-mid hover:text-pc-accent disabled:cursor-not-allowed disabled:opacity-50">{refreshing ? <LoadingIndicator className="gap-2" /> : manualRefreshRemainingSeconds > 0 ? `Refresh in ${formatCooldown(manualRefreshRemainingSeconds)}` : "Refresh all loadouts"}</button>
      </div>

      {error && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{error}</div>}
      <div className="rounded-xl border border-pc-border bg-pc-bg-elevated px-4 py-3 text-xs text-pc-text-secondary">{data?.loadouts.length ?? 0} saved deck{data?.loadouts.length === 1 ? "" : "s"} found</div>

      {ROLE_ORDER.map((role) => {
        const championsForRole = champions.filter((champion) => champion.roles.includes(role));
        return <section key={role}><h2 className="mb-3 text-sm font-bold text-pc-text">{role}</h2><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{championsForRole.map((champion) => { const deckCount = counts.get(champion.id) ?? 0; return <Link key={champion.id} href={`/players/${playerId}/loadouts/${champion.id}`} className="group rounded-xl border border-pc-border bg-pc-bg-elevated p-3 text-center transition-colors hover:border-pc-accent-mid hover:bg-pc-bg-secondary"><img src={getChampionIconSafe(champion.name)} alt="" className="mx-auto h-12 w-12 rounded-lg object-contain" /><div className="mt-2 truncate text-xs font-semibold text-pc-text group-hover:text-pc-accent">{champion.name}</div><div className={deckCount > 0 ? "mt-1 text-[10px] text-emerald-400" : "mt-1 text-[10px] text-pc-text-muted"}>{deckCount > 0 ? `${deckCount} saved deck${deckCount === 1 ? "" : "s"}` : "No saved deck"}</div></Link>; })}</div></section>;
      })}

    </div>
  );
}
