"use client";

import { useEffect, useState } from "react";
import { fetchTalents } from "@/lib/api-client";
import { EmptyState, ErrorState } from "@/components/async-state";
import { DataTableSkeleton } from "@/components/route-skeleton";
import Link from "next/link";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { championSlug } from "@/lib/utils";

export default function TalentsPage() {
  const [talents, setTalents] = useState<Array<{ talentId: number; talentName: string; championId: number; championName: string; totalPlays: number; winRate: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);

  useEffect(() => {
    fetchTalents()
      .then(setTalents)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedChampion
    ? talents.filter((t) => t.championName === selectedChampion)
    : talents;
  const champions = [...new Set(talents.map((t) => t.championName))];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-pc-accent sm:text-3xl">Talent Performance</h1>
      <label className="block sm:hidden"><span className="pc-label">Champion</span><select value={selectedChampion ?? ""} onChange={(event) => setSelectedChampion(event.target.value || null)} className="pc-select w-full"><option value="">All champions</option>{champions.map((champion) => <option key={champion} value={champion}>{champion}</option>)}</select></label>
      <div className="hidden flex-wrap gap-2 sm:flex">
        <button
          onClick={() => setSelectedChampion(null)}
          className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
            !selectedChampion ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
          }`}
        >
          All
        </button>
        {champions.map((champion) => (
          <button
            key={champion}
            onClick={() => setSelectedChampion(champion)}
            className={`px-4 py-2 rounded-lg border border-pc-border text-pc-text ${
              selectedChampion === champion ? "bg-pc-accent text-pc-bg" : "bg-pc-bg-elevated hover:bg-pc-bg-secondary"
            }`}
          >
            {champion}
          </button>
        ))}
      </div>
      {loading ? (
        <DataTableSkeleton />
      ) : error ? (
        <ErrorState message={String(error)} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No talent statistics" description="Talent performance will appear after ranked matches are processed." />
      ) : (
        <div className="space-y-2 sm:hidden">
          {filtered.slice(0, 20).map((talent) => <Link key={`${talent.championId}-${talent.talentId}`} href={`/champions/${championSlug(talent.championName)}/talents/${talent.talentId}`} className="pc-mobile-panel flex min-w-0 items-center gap-3 p-3">
            <img src={getChampionIconSafe(talent.championName)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-pc-text">{talent.talentName}</div><div className="text-xs text-pc-text-muted">{talent.championName} · {talent.totalPlays.toLocaleString()} plays</div></div>
            <span className={talent.winRate >= 50 ? "shrink-0 font-bold text-emerald-400" : "shrink-0 font-bold text-rose-400"}>{talent.winRate?.toFixed(1)}%</span>
          </Link>)}
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left">
            <thead className="bg-pc-bg-elevated">
              <tr>
                <th className="px-4 py-2 text-pc-accent font-semibold">Champion</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Talent</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Plays</th>
                <th className="px-4 py-2 text-pc-accent font-semibold">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((t) => (
                <tr key={`${t.championId}-${t.talentId}`} className="border-t border-pc-border">
                  <td className="px-4 py-2 text-pc-text">{t.championName}</td>
                  <td className="px-4 py-2 text-pc-text">{t.talentName}</td>
                  <td className="px-4 py-2 text-pc-text">{t.totalPlays}</td>
                  <td className="px-4 py-2 text-pc-text">{t.winRate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
