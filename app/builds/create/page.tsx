"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBuild, getAuthUser, getAuthToken, fetchChampions, type ChampionNameOnly } from "@/lib/api-client";

export default function CreateBuildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [championId, setChampionId] = useState<number>(0);
  const [items, setItems] = useState<number[]>([]);
  const [actives, setActives] = useState<number[]>([]);
  const [talents, setTalents] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [champions, setChampions] = useState<ChampionNameOnly[]>([]);
  const [loadingChampions, setLoadingChampions] = useState(true);

  // Load champions for selection
  useState(() => {
    async function loadChampions() {
      try {
        const data = await fetchChampions();
        setChampions(data.map((c) => ({ id: c.id, name: c.name })));
      } catch {
        // Ignore champion load errors
      } finally {
        setLoadingChampions(false);
      }
    }
    loadChampions();
  });

  function toggleItem(item: number) {
    if (items.includes(item)) {
      setItems(items.filter((i) => i !== item));
    } else if (items.length < 5) {
      setItems([...items, item]);
    }
  }

  function toggleActive(active: number) {
    if (actives.includes(active)) {
      setActives(actives.filter((a) => a !== active));
    } else if (actives.length < 4) {
      setActives([...actives, active]);
    }
  }

  function toggleTalent(talent: number) {
    if (talents.includes(talent)) {
      setTalents(talents.filter((t) => t !== talent));
    } else if (talents.length < 1) {
      setTalents([talent]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const user = getAuthUser();
    const token = getAuthToken();
    if (!user || !token) {
      window.location.href = "/auth/login";
      return;
    }

    if (!name.trim() || !championId) {
      setError("Name and champion are required");
      return;
    }

    setLoading(true);
    try {
      const build = await createBuild(
        user.id,
        championId,
        name.trim(),
        items,
        actives,
        talents,
        notes.trim() || null,
        visibility,
        token
      );
      router.push(`/builds/${build.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create build");
    } finally {
      setLoading(false);
    }
  }

  // Sample item IDs for demonstration (1-20)
  const sampleItems = Array.from({ length: 20 }, (_, i) => i + 1);
  const sampleActives = Array.from({ length: 10 }, (_, i) => i + 1);
  const sampleTalents = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/builds" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          ← Back to builds
        </Link>
        <h1 className="text-3xl font-bold text-pc-accent">Create Build</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-pc-text-secondary mb-1">
            Build Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            placeholder="My awesome build"
          />
        </div>

        {/* Champion */}
        <div>
          <label htmlFor="champion" className="block text-sm font-medium text-pc-text-secondary mb-1">
            Champion *
          </label>
          <select
            id="champion"
            value={championId}
            onChange={(e) => setChampionId(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
          >
            <option value={0}>Select champion...</option>
            {champions.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium text-pc-text-secondary mb-2">
            Items ({items.length}/5)
          </label>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {sampleItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleItem(item)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  items.includes(item)
                    ? "bg-pc-accent/20 border-pc-accent text-pc-accent"
                    : "bg-pc-bg-secondary border-pc-border text-pc-text-secondary hover:border-pc-accent/50"
                }`}
              >
                #{item}
              </button>
            ))}
          </div>
        </div>

        {/* Actives */}
        <div>
          <label className="block text-sm font-medium text-pc-text-secondary mb-2">
            Actives ({actives.length}/4)
          </label>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {sampleActives.map((active) => (
              <button
                key={active}
                type="button"
                onClick={() => toggleActive(active)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  actives.includes(active)
                    ? "bg-pc-accent/20 border-pc-accent text-pc-accent"
                    : "bg-pc-bg-secondary border-pc-border text-pc-text-secondary hover:border-pc-accent/50"
                }`}
              >
                #{active}
              </button>
            ))}
          </div>
        </div>

        {/* Talents */}
        <div>
          <label className="block text-sm font-medium text-pc-text-secondary mb-2">
            Talents ({talents.length}/1)
          </label>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {sampleTalents.map((talent) => (
              <button
                key={talent}
                type="button"
                onClick={() => toggleTalent(talent)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  talents.includes(talent)
                    ? "bg-pc-accent/20 border-pc-accent text-pc-accent"
                    : "bg-pc-bg-secondary border-pc-border text-pc-text-secondary hover:border-pc-accent/50"
                }`}
              >
                #{talent}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-pc-text-secondary mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            placeholder="Tips, strategies, or notes about this build..."
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-pc-text-secondary mb-2">Visibility</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === "public"}
                onChange={() => setVisibility("public")}
                className="accent-pc-accent"
              />
              <span className="text-pc-text">Public</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === "private"}
                onChange={() => setVisibility("private")}
                className="accent-pc-accent"
              />
              <span className="text-pc-text">Private</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Build"}
        </button>
      </form>
    </div>
  );
}
