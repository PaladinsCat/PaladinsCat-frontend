"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBuildDetail, toggleBuildLike, getAuthUser, getAuthToken, type Build } from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";

export default function BuildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [build, setBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const loadBuild = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getBuildDetail(parseInt(id, 10));
      setBuild(data);
    } catch {
      setError("Failed to load build");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBuild();
  }, [loadBuild]);

  async function handleLike() {
    if (!build) return;
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      const newLikes = await toggleBuildLike(build.id, user.id, token);
      setBuild((prev) => prev ? { ...prev, likes: newLikes } : null);
    } catch {
      // Ignore like errors
    }
  }


  if (loading) return <div className="text-center py-12 text-pc-text-secondary">Loading build...</div>;
  if (error) return <div className="text-center py-12 text-pc-text-muted">{error}</div>;
  if (!build) return <div className="text-center py-12 text-pc-text-muted">Build not found</div>;

  return (
    <div className="space-y-6">
      <Link href="/builds" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
        ← Back to builds
      </Link>

      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pc-text">{build.name}</h1>
            <div className="flex items-center gap-4 mt-3 text-pc-text-secondary text-sm">
              <span>{build.championName}</span>
              <span>by {build.username}</span>
              <span>{formatLocalDateTime(build.createdAt)}</span>
              <span className={build.visibility === "public" ? "text-green-400" : "text-yellow-400"}>
                {build.visibility === "public" ? "🌐" : "🔒"} {build.visibility}
              </span>
            </div>
          </div>
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-pc-text-secondary hover:text-pc-accent transition-colors"
          >
            ❤ {build.likes}
          </button>
        </div>

        {/* Build components */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-pc-text-secondary mb-2">Items ({build.items.length}/5)</h3>
            <div className="space-y-1">
              {build.items.length === 0 ? (
                <p className="text-pc-text-muted text-sm">No items</p>
              ) : (
                build.items.map((item, i) => (
                  <div key={i} className="px-3 py-2 bg-pc-bg-secondary rounded text-sm text-pc-text">
                    Item #{item}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actives */}
          <div>
            <h3 className="text-sm font-semibold text-pc-text-secondary mb-2">Actives ({build.actives.length}/4)</h3>
            <div className="space-y-1">
              {build.actives.length === 0 ? (
                <p className="text-pc-text-muted text-sm">No actives</p>
              ) : (
                build.actives.map((active, i) => (
                  <div key={i} className="px-3 py-2 bg-pc-bg-secondary rounded text-sm text-pc-text">
                    Active #{active}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Talents */}
          <div>
            <h3 className="text-sm font-semibold text-pc-text-secondary mb-2">Talents ({build.talents.length}/1)</h3>
            <div className="space-y-1">
              {build.talents.length === 0 ? (
                <p className="text-pc-text-muted text-sm">No talents</p>
              ) : (
                build.talents.map((talent, i) => (
                  <div key={i} className="px-3 py-2 bg-pc-bg-secondary rounded text-sm text-pc-text">
                    Talent #{talent}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {build.notes && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-pc-text-secondary mb-2">Notes</h3>
            <p className="text-pc-text whitespace-pre-wrap bg-pc-bg-secondary rounded-lg p-4">{build.notes}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 flex gap-6 text-sm text-pc-text-secondary">
          <span>Views: {build.viewCount}</span>
          <span>Likes: {build.likes}</span>
        </div>
      </div>
    </div>
  );
}
