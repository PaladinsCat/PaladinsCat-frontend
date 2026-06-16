"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Card, { StatsGrid } from "@/components/Card";
import Button from "@/components/Button";
import { fetchPlayerProfile, fetchPlayerMatches, type PlayerProfile, type MatchRecord } from "@/lib/api-client";

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const data = await fetchPlayerProfile(id);
      setProfile(data);
    } catch {
      setError("Failed to load player profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadMatches = useCallback(async () => {
    try {
      const data = await fetchPlayerMatches(id, { limit: "20", offset: String(page * 20) });
      setMatches(data);
    } catch {
      /* non-fatal */
    }
  }, [id, page]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  if (loading) return <div className="text-center py-8 text-pc-text-secondary">Loading player...</div>;
  if (error) return <div className="text-center py-8 text-pc-text-muted">{error}</div>;
  if (!profile) return <div className="text-center py-8 text-pc-text-muted">Player not found</div>;

  // Compute averages from recent matches
  const avgKda = matches.length > 0
    ? (matches.reduce((s, m) => s + (m.deaths > 0 ? (m.kills + m.assists) / m.deaths : m.kills + m.assists), 0) / matches.length).toFixed(2)
    : "—";
  const avgDpm = matches.length > 0
    ? (matches.reduce((s, m) => s + (m.duration > 0 ? (m.damageDone / m.duration) * 60 : 0), 0) / matches.length).toFixed(0)
    : "—";
  const avgHpm = "—";
  const avgEgpm = "—";

  return (
    <div className="space-y-6">
      {/* ── Player Header ── */}
      <div className="flex items-center gap-4">
        <Link href="/players" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          ← Back
        </Link>
        <div className="w-16 h-16 rounded-full bg-pc-bg-elevated border-2 border-pc-accent flex items-center justify-center">
          <span className="text-2xl font-bold text-pc-accent">
            {profile.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="pc-heading pc-heading-md">{profile.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {profile.kbmTier && <span className="pc-badge">{profile.kbmTier}</span>}
            <span className="pc-badge">{profile.platform}</span>
            <span className="pc-badge">{profile.region}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid (6 cards) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card hover={false}>
          <div className="pc-stats-value">{profile.totalMatches}</div>
          <div className="pc-stats-label">Matches</div>
        </Card>
        <Card hover={false}>
          <div className="pc-stats-value">{avgKda}</div>
          <div className="pc-stats-label">KDA</div>
        </Card>
        <Card hover={false}>
          <div className="pc-stats-value">
            {profile.winRate != null ? `${profile.winRate.toFixed(1)}%` : "—"}
          </div>
          <div className="pc-stats-label">Win Rate</div>
        </Card>
        <Card hover={false}>
          <div className="pc-stats-value">{avgEgpm}</div>
          <div className="pc-stats-label">Avg EGPM</div>
        </Card>
        <Card hover={false}>
          <div className="pc-stats-value">{avgDpm}</div>
          <div className="pc-stats-label">Avg DPM</div>
        </Card>
        <Card hover={false}>
          <div className="pc-stats-value">{avgHpm}</div>
          <div className="pc-stats-label">Avg HPM</div>
        </Card>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex gap-3">
        <Link href={`/stats/player/${id}/charts`}>
          <Button variant="secondary">View Charts</Button>
        </Link>
      </div>

      {/* ── Champion Mastery (Horizontal Scroll) ── */}
      {profile.topChampions && profile.topChampions.length > 0 && (
        <Card title="Champion Mastery">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {profile.topChampions.map((c) => (
              <div
                key={c.championId}
                className="flex-shrink-0 w-40 pc-card-flush p-4 hover:scale-[1.02] transition-transform"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-pc-bg border border-pc-border flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-pc-accent">
                    {c.championName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h4 className="text-center text-pc-text text-sm font-semibold mb-2">
                  {c.championName}
                </h4>
                <div className="text-center space-y-1">
                  <div className="text-pc-text text-sm">{c.totalPlays} games</div>
                  <div className="text-pc-accent text-sm font-medium">
                    {c.winRate?.toFixed(1)}% WR
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Recent Matches Table ── */}
      <Card title="Recent Matches">
        {matches.length === 0 ? (
          <p className="pc-body text-sm">No matches recorded yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="pc-table">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Champion</th>
                    <th>Map</th>
                    <th>K</th>
                    <th>D</th>
                    <th>A</th>
                    <th>DPM</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.matchId}>
                      <td>
                        <Link
                          href={`/matches/${m.matchId}`}
                          className="text-pc-accent hover:text-pc-accent-light transition-colors"
                        >
                          {m.matchId}
                        </Link>
                      </td>
                      <td>{m.championName}</td>
                      <td>{m.mapGame}</td>
                      <td>{m.kills}</td>
                      <td>{m.deaths}</td>
                      <td>{m.assists}</td>
                      <td>{m.duration > 0 ? ((m.damageDone / m.duration) * 60).toFixed(0) : "—"}</td>
                      <td>
                        <span
                          className={`pc-badge ${
                            m.isWinner ? "text-pc-accent" : "text-pc-text-muted"
                          }`}
                        >
                          {m.isWinner ? "Win" : "Loss"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {matches.length >= 20 && (
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <Button variant="secondary" onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
