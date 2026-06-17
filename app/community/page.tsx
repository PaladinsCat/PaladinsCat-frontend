"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPosts, type Post } from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchPosts({ limit: "50" });
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    // CRITICAL: Guard against Invalid Date. If dateStr is malformed, getTime()
    // returns NaN, diff is NaN, Math.floor(NaN) is NaN. All comparisons with
    // NaN are false, so it falls through to toLocaleDateString() which returns
    // "Invalid Date". Source: Fault #12 — "formatDate crashes on bad date"
    if (isNaN(date.getTime())) return "—";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString();
  }

  if (loading) return <div className="text-center py-12 text-pc-text-secondary">Loading community...</div>;
  if (error) return <div className="text-center py-12 text-pc-text-muted">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-pc-accent">
          <ScrambleText text="Community" speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <Link
          href="/community/create"
          className="px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors text-sm"
        >
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-pc-bg-elevated rounded-lg border border-pc-border">
          <p className="text-pc-text-secondary text-lg">No posts yet</p>
          <p className="text-pc-text-muted mt-2">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block bg-pc-bg-elevated rounded-lg border border-pc-border p-5 hover:border-pc-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-pc-text hover:text-pc-accent transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-pc-text-secondary text-sm mt-1 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-pc-text-muted text-sm">
                    <span>by {post.username}</span>
                    <span>{formatDate(post.createdAt)}</span>
                    <span>❤ {post.likes}</span>
                    <span>👁 {post.viewCount}</span>
                  </div>
                </div>
                <span className="text-pc-text-muted ml-4">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
