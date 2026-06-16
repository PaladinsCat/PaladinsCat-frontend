"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchKdaHistory, fetchDpmHistory, fetchGlickoHistory, type KdaHistoryEntry, type DpmHistoryEntry, type GlickoHistoryEntry } from "@/lib/api-client";

export default function PlayerChartsPage({ params }: { params: Promise<{ id: string }> }) {
  const [kdaData, setKdaData] = useState<KdaHistoryEntry[]>([]);
  const [dpmData, setDpmData] = useState<DpmHistoryEntry[]>([]);
  const [glickoData, setGlickoData] = useState<GlickoHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [kda, dpm, glicko] = await Promise.all([
        fetchKdaHistory(id, days, 50).catch(() => []),
        fetchDpmHistory(id, days, 50).catch(() => []),
        fetchGlickoHistory(id, days, 50).catch(() => []),
      ]);
      setKdaData(kda);
      setDpmData(dpm);
      setGlickoData(glicko);
    } catch {
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  }, [id, days]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  if (loading) return <div className="text-center py-12 text-pc-text-secondary">Loading charts...</div>;
  if (error) return <div className="text-center py-12 text-pc-text-muted">{error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/players/${id}`} className="text-pc-text-secondary hover:text-pc-accent transition-colors">
            ← Back to profile
          </Link>
          <h1 className="text-3xl font-bold text-pc-accent">Player Charts</h1>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-2 bg-pc-bg-elevated border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KDA Chart */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h2 className="text-xl font-semibold text-pc-accent mb-4">KDA History</h2>
        {kdaData.length === 0 ? (
          <p className="text-pc-text-muted text-center py-8">No KDA data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kdaData.map((d) => ({ ...d, label: formatDate(d.date) }))} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "0.5rem", color: "#F9FAFB" }}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Legend />
              <Line type="monotone" dataKey="kills" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="deaths" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="assists" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* DPM Chart */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h2 className="text-xl font-semibold text-pc-accent mb-4">Damage Per Minute</h2>
        {dpmData.length === 0 ? (
          <p className="text-pc-text-muted text-center py-8">No DPM data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dpmData.map((d) => ({ ...d, label: formatDate(d.date) }))} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "0.5rem", color: "#F9FAFB" }}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Legend />
              <Line type="monotone" dataKey="playerDpm" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} name="Player DPM" />
              <Line type="monotone" dataKey="avgDpm" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Server Average" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Glicko-2 Chart */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h2 className="text-xl font-semibold text-pc-accent mb-4">Glicko-2 Rating</h2>
        {glickoData.length === 0 ? (
          <p className="text-pc-text-muted text-center py-8">No rating data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={glickoData.map((d) => ({ ...d, label: formatDate(d.date) }))} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "0.5rem", color: "#F9FAFB" }}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Legend />
              <Line type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Rating" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
