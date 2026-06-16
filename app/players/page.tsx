"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchPlayerSearch, type PlayerSearchResult } from "@/lib/api-client";

export default function PlayerSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlayerSearch(q);
      setResults(data);
    } catch {
      setError("Failed to search players");
    } finally {
      setLoading(false);
    }
  }, []);

  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-pc-accent">Player Search</h1>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="Search by player name..."
          className="flex-1 px-4 py-2 rounded-lg bg-pc-bg-elevated border border-pc-border text-pc-text placeholder-pc-text-muted"
        />
        <button
          onClick={() => search(debouncedQuery)}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold hover:bg-pc-accent-secondary transition-colors disabled:opacity-50"
        >
          Search
        </button>
      </div>
      {error && <p className="text-pc-text-muted">{error}</p>}
      {loading && <p className="text-pc-text-secondary">Searching...</p>}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="block p-4 rounded-lg bg-pc-bg-elevated border border-pc-border hover:border-pc-accent transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pc-text font-semibold">{player.name}</p>
                  <p className="text-pc-text-secondary text-sm">{player.region} · {player.platform}</p>
                </div>
                {player.kbmTier && (
                  <span className="px-2 py-1 rounded bg-pc-bg-secondary text-pc-text-secondary text-sm">
                    {player.kbmTier}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && !error && query.length >= 2 && results.length === 0 && (
        <p className="text-pc-text-muted">No players found</p>
      )}
    </div>
  );
}
