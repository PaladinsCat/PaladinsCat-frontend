"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPosts, fetchTwitchStreams, type Post, type TwitchStream } from "@/lib/api-client";
import ScrambleText from "@/components/ScrambleText";
import { formatLocalDateTime } from "@/lib/time-format";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streams, setStreams] = useState<TwitchStream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);

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
    fetchTwitchStreams()
      .then((response) => setStreams(response.streams))
      .catch(() => setStreams([]))
      .finally(() => setStreamsLoading(false));
  }, []);

  if (loading) return <RouteSkeleton variant="list" />;
  if (error) return <ErrorState title="Community unavailable" message={error} />;

  return (
    <div className="space-y-6">
      <div className="pc-section-heading">
        <h1 className="text-2xl font-bold text-pc-accent sm:text-3xl">
          <ScrambleText text="Community" speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <Link
          href="/community/create"
          className="pc-touch-target inline-flex items-center px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors text-sm"
        >
          New Post
        </Link>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <section className="min-w-0">
          {posts.length === 0 ? (
            <EmptyState title="No posts yet" description="Be the first to share something with the community." />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block min-w-0 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent/50 sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-base font-semibold text-pc-text transition-colors hover:text-pc-accent sm:text-lg">
                        {post.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 break-words text-sm text-pc-text-secondary [overflow-wrap:anywhere]">
                        {post.content}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pc-text-muted sm:text-sm">
                        <span className="min-w-0 truncate">by {post.username}</span>
                        <span>{formatLocalDateTime(post.createdAt)}</span>
                        <span aria-label={`${post.likes} likes`}>❤ {post.likes}</span>
                        <span aria-label={`${post.viewCount} views`}>👁 {post.viewCount}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-pc-text-muted">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-5">
          <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
            <div className="flex items-center justify-between border-b border-pc-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                <h2 className="text-sm font-bold text-pc-text">Live on Twitch</h2>
              </div>
              <a
                href="https://www.twitch.tv/directory/category/paladins"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-pc-text-secondary transition-colors hover:text-pc-accent"
              >
                Browse →
              </a>
            </div>

            <div className="divide-y divide-pc-border/70">
              {streamsLoading ? (
                <div className="space-y-3 p-4" aria-label="Loading live streams">
                  {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-pc-bg" />)}
                </div>
              ) : streams.length === 0 ? (
                <div className="p-4 text-sm text-pc-text-secondary">No Paladins streams are live right now.</div>
              ) : (
                streams.map((stream) => (
                  <a
                    key={stream.userLogin}
                    href={stream.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex gap-3 p-3 transition-colors hover:bg-pc-bg/60"
                  >
                    <img
                      src={stream.thumbnailUrl}
                      alt=""
                      className="h-14 w-24 shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="truncate font-semibold text-pc-text group-hover:text-pc-accent">{stream.userName}</span>
                        <span className="shrink-0 text-rose-400">● {stream.viewerCount.toLocaleString()}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-pc-text-secondary">{stream.title || "Playing Paladins"}</p>
                      {stream.language && <span className="mt-1 block text-[10px] uppercase tracking-wide text-pc-text-muted">{stream.language}</span>}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
