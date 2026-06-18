"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCheaterPlayers, type CheaterPlayer } from "@/lib/api-client";
import { MOCK_CONFIRMED_FULL, MOCK_SUSPICIOUS_FULL } from "@/lib/mock-data";

const CLASS_ICONS: Record<string, string> = {
  Frontline: "/images/icons/Class_Front_Line_Icon.avif",
  Damage: "/images/icons/Class_Damage_Icon.avif",
  Flank: "/images/icons/Class_Flank_Icon.avif",
  Support: "/images/icons/Class_Support_Icon.avif",
};

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString() : "—";

export default function CheatersPage() {
  const [tab, setTab] = useState<"confirmed" | "suspicious">("confirmed");
  const [confirmed, setConfirmed] = useState<any[]>([]);
  const [suspicious, setSuspicious] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const cheaters = await fetchCheaterPlayers({ cheater: true, limit: 100 });
        if (cheaters.length > 0) {
          setConfirmed(cheaters.filter(c => c.cheater));
          setSuspicious(cheaters.filter(c => !c.cheater && c.susCount > 0));
        } else {
          setConfirmed(MOCK_CONFIRMED_FULL);
          setSuspicious(MOCK_SUSPICIOUS_FULL);
        }
      } catch {
        setConfirmed(MOCK_CONFIRMED_FULL);
        setSuspicious(MOCK_SUSPICIOUS_FULL);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const list = tab === "confirmed" ? confirmed : suspicious;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="text-pc-accent text-xs hover:underline mb-2 inline-block">← Players</Link>
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Cheaters & Suspicious Players</h1>
        <p className="text-pc-text-secondary text-sm mt-1">
          Tracked flagged and confirmed cheating accounts with full performance metrics
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("confirmed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "confirmed"
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-pc-card text-pc-muted hover:text-pc-text border border-pc-border"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Confirmed Cheaters
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">{confirmed.length}</span>
        </button>
        <button
          onClick={() => setTab("suspicious")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "suspicious"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              : "bg-pc-card text-pc-muted hover:text-pc-text border border-pc-border"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Suspicious Players
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{suspicious.length}</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-pc-text-secondary text-sm">No {tab} players found.</div>
      ) : (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl overflow-hidden">
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
                  {tab === "confirmed" && <th className="px-3 py-3">Banned</th>}
                  {tab === "suspicious" && <th className="px-3 py-3">Severity</th>}
                  <th className="px-3 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p: any, i: number) => (
                  <tr key={p.id} className="border-b border-pc-border/50 hover:bg-pc-bg/50 transition-colors">
                    <td className="px-3 py-2 text-pc-text-muted text-xs">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <Link href={`/players/${p.id}`} className="text-pc-text font-medium text-xs hover:text-pc-accent transition-colors block truncate">
                            {p.name}
                          </Link>
                          <span className="text-pc-text-muted text-[10px]">{p.region} · {p.className || p.platform}</span>
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
                    {tab === "confirmed" && <td className="px-3 py-2 text-xs text-red-400">{p.banned || "—"}</td>}
                    {tab === "suspicious" && (
                      <td className="px-3 py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${SEVERITY_STYLES[p.severity] || ""}`}>
                          {p.severity || "—"}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 text-xs text-pc-text-muted">{p.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
