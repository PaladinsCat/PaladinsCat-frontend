"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchChampions, fetchSkinStats, type Champion, type SkinStat } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";
import { useLobbyTier } from "@/lib/lobby-tier-context";

export default function SkinStatsPage() {
  const searchParams = useSearchParams();
  const initialChampion = Number(searchParams.get("champion") ?? 0) || 0;
  const [champions, setChampions] = useState<Champion[]>([]);
  const [rows, setRows] = useState<SkinStat[]>([]);
  const [championId, setChampionId] = useState(initialChampion);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { definition: lobbyTier, ready: lobbyTierReady } = useLobbyTier();

  useEffect(() => { fetchChampions({ limit: "200" }).then(setChampions).catch(() => setChampions([])); }, []);
  useEffect(() => {
    let cancelled = false;
    if (!lobbyTierReady) return;
    setLoading(true);
    fetchSkinStats({ championId: championId || undefined, tierMin: lobbyTier.tierMin, tierMax: lobbyTier.tierMax, limit: 200 })
      .then((data) => { if (!cancelled) setRows(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [championId, lobbyTier.tierMin, lobbyTier.tierMax, lobbyTierReady]);

  const visibleRows = useMemo(() => rows.filter((row) => {
    const value = `${row.skinName} ${row.championName}`.toLowerCase();
    return value.includes(search.trim().toLowerCase());
  }), [rows, search]);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/stats" className="mb-2 inline-block text-xs text-pc-accent hover:underline">← Global Stats</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Skin Stats</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">Ranked cosmetic performance from stored match facts, including repaired or overflow skin IDs.</p>
      </div>

      <div className="rounded-xl border border-pc-accent/30 bg-pc-accent/10 px-4 py-3 text-sm text-pc-text">
        <div className="flex flex-wrap items-center justify-between gap-3"><span>Lobby scope: {lobbyTier.label}</span><Link href="/account" className="text-xs font-semibold text-pc-accent hover:underline">Change in Account Settings</Link></div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 md:grid-cols-2">
        <label className="text-xs text-pc-text-secondary">Champion<select value={championId} onChange={(event) => setChampionId(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text"><option value={0}>All champions</option>{champions.map((champion) => <option key={champion.id} value={champion.id}>{champion.name}</option>)}</select></label>
        <label className="text-xs text-pc-text-secondary">Search skins<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Skin or champion" className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text placeholder:text-pc-text-muted" /></label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-elevated">
        <table className="w-full min-w-[680px] text-sm"><thead className="border-b border-pc-border text-left text-xs text-pc-text-muted"><tr><th className="px-4 py-3">Skin</th><th className="px-3 py-3">Champion</th><th className="px-3 py-3 text-right">Plays</th><th className="px-3 py-3 text-right">W / L</th><th className="px-4 py-3 text-right">Win Rate</th></tr></thead><tbody>
          {visibleRows.map((row) => <tr key={`${row.championId}-${row.skinId}`} className="border-b border-pc-border/50 transition-colors hover:bg-pc-bg-secondary/60"><td className="px-4 py-3"><div className="font-medium text-pc-text">{row.skinName}</div><div className="text-[10px] text-pc-text-muted">ID {row.skinId}</div></td><td className="px-3 py-3"><Link href={`/champions/${championSlug(row.championName)}`} className="flex items-center gap-2 text-pc-text-secondary hover:text-pc-accent"><img src={getChampionIconSafe(row.championName)} alt="" className="h-6 w-6 rounded object-contain" />{row.championName}</Link></td><td className="px-3 py-3 text-right text-pc-text">{row.totalPlays.toLocaleString()}</td><td className="px-3 py-3 text-right text-pc-text-secondary">{row.wins.toLocaleString()} / {row.losses.toLocaleString()}</td><td className={row.winRate >= 50 ? "px-4 py-3 text-right font-semibold text-emerald-400" : "px-4 py-3 text-right font-semibold text-rose-400"}>{row.winRate.toFixed(1)}%</td></tr>)}
          {!loading && visibleRows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-pc-text-muted">No skin statistics match these filters.</td></tr>}
          {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-pc-text-muted">Loading skin statistics…</td></tr>}
        </tbody></table>
      </div>
    </div>
  );
}
