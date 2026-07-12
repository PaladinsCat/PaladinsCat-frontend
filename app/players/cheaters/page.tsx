"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers } from "@/lib/api-client";
import PlayerModerationCards from "@/components/player-moderation-cards";

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString() : "—";

export default function CheatersPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cheaters = await fetchCheaterPlayers({ cheater: true, limit: 100 });
        setData(cheaters.filter(c => c.cheater));
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Players</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Confirmed Cheaters</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Verified cheating accounts with full performance metrics
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-pc-text-muted text-xs">{data.length} confirmed</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">No confirmed cheaters found.</div>
      ) : (
        <>
          <PlayerModerationCards players={data} />
        <div className="hidden overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pc-border text-pc-text-muted text-left text-xs">
                  <th className="px-3 py-3 w-8">#</th>
                  <th className="px-3 py-3">Player</th>
                  <th className="px-3 py-3 text-right">DPM</th>
                  <th className="px-3 py-3 text-right">HPM</th>
                  <th className="px-3 py-3 text-right">GPM</th>
                  <th className="px-3 py-3 text-right">MPM</th>
                  <th className="px-3 py-3 text-right">KDA</th>
                  <th className="px-3 py-3 text-right">WR</th>
                  <th className="px-3 py-3 text-right">Matches</th>
                  <th className="px-3 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p: any, i: number) => (
                  <tr key={p.id} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                    <td className="px-3 py-2 text-pc-text-muted text-xs">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {CLASS_ICONS[p.className] && (
                          <img src={CLASS_ICONS[p.className]} alt={p.className} className="w-4 h-4 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors block truncate">
                            {p.name}
                          </Link>
                          <span className="text-pc-text-muted text-xs">{p.region}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-pc-text-secondary">{fmt(p.avgDpm ?? p.dpm)}</td>
                    <td className="px-3 py-2 text-right text-xs text-pc-text-secondary">{fmt(p.avgHpm ?? p.hpm)}</td>
                    <td className="px-3 py-2 text-right text-xs text-pc-text-secondary">{fmt(p.avgGpm ?? p.gpm)}</td>
                    <td className="px-3 py-2 text-right text-xs text-pc-text-secondary">{fmt(p.avgMpm ?? p.mpm)}</td>
                    <td className="px-3 py-2 text-right text-xs text-pc-text-secondary">{p.kda ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-xs">
                      <span className={p.winRate >= 50 ? "text-emerald-400" : "text-red-400"}>
                        {p.winRate != null ? `${p.winRate}%` : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-pc-text-secondary">{fmt(p.totalMatches)}</td>
                    <td className="px-3 py-2 text-xs text-pc-text-muted max-w-[200px] truncate">{p.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
