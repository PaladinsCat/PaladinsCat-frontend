"use client";

import { useEffect, useState } from "react";
import { fetchTalents } from "@/lib/api-client";

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
      <h1 className="text-3xl font-bold text-pc-accent">Talent Performance</h1>
      <div className="flex gap-2 flex-wrap">
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
        <div className="text-center py-8 text-pc-text-secondary">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-pc-text-muted">{error}</div>
      ) : (
        <div className="overflow-x-auto">
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
                <tr key={t.talentId} className="border-t border-pc-border">
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
