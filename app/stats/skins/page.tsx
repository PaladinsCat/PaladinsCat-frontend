"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchChampions, fetchSkinStats, type Champion, type SkinStat } from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";

type LobbyFilter = "all" | "bronze-gold" | "platinum-plus" | "diamond-plus";

const LOBBY_FILTERS: Record<LobbyFilter, { label: string; banner: string; tierMin?: number; tierMax?: number }> = {
  all: { label: "All ranked lobbies", banner: "All ranked lobby stats" },
  "bronze-gold": { label: "Bronze 5 – Gold 1", banner: "Bronze 5 – Gold 1 lobby stats only", tierMin: 1, tierMax: 15 },
  "platinum-plus": { label: "Platinum 5+", banner: "Platinum 5+ lobby stats only", tierMin: 16, tierMax: 26 },
  "diamond-plus": { label: "Diamond 5+", banner: "Diamond+ lobby stats only", tierMin: 21, tierMax: 26 },
};

export default function SkinStatsPage() {
  const searchParams = useSearchParams();
  const initialChampion = Number(searchParams.get("champion") ?? 0) || 0;
  const [champions, setChampions] = useState<Champion[]>([]);
  const [rows, setRows] = useState<SkinStat[]>([]);
  const [championId, setChampionId] = useState(initialChampion);
  const [lobbyFilter, setLobbyFilter] = useState<LobbyFilter>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchChampions({ limit: "200" }).then(setChampions).catch(() => setChampions([])); }, []);
  useEffect(() => {
    let cancelled = false;
    const filter = LOBBY_FILTERS[lobbyFilter];
    setLoading(true);
    fetchSkinStats({ championId: championId || undefined, tierMin: filter.tierMin, tierMax: filter.tierMax, limit: 200 })
      .then((data) => { if (!cancelled) setRows(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [championId, lobbyFilter]);

  const visibleRows = useMemo(() => rows.filter((row) => {
    const value = `${row.skinName} ${row.championName}`.toLowerCase();
    return value.includes(search.trim().toLowerCase());
  }), [rows, search]);
  const activeFilter = LOBBY_FILTERS[lobbyFilter];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/stats" className="mb-2 inline-block text-xs text-pc-accent hover:underline">← Global Stats</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Skin Stats</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">Ranked cosmetic performance from stored match facts, including repaired or overflow skin IDs.</p>
      </div>

      <div className="rounded-xl border border-pc-accent/30 bg-pc-accent/10 px-4 py-3 text-sm text-pc-text">
        <div className="flex flex-wrap items-center justify-between gap-3"><span>{activeFilter.banner}</span>{lobbyFilter !== "all" && <button onClick={() => setLobbyFilter("all")} className="text-xs font-semibold text-pc-accent hover:underline">Clear filter</button>}</div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 md:grid-cols-3">
        <label className="text-xs text-pc-text-secondary">Lobby tier<select value={lobbyFilter} onChange={(event) => setLobbyFilter(event.target.value as LobbyFilter)} className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text"><option value="all">All ranked lobbies</option><option value="bronze-gold">Bronze 5 – Gold 1</option><option value="platinum-plus">Platinum 5+</option><option value="diamond-plus">Diamond 5+</option></select></label>
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
