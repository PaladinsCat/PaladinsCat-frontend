/**
 * Define the community page responsibility boundary.
 * Coordinates community page data loading, authorization, and presentation.
 * refs: none
 */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPosts, fetchTwitchStreams, type Post, type TwitchStream } from "@/lib/api-client";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { LoadingPanel } from "@/components/async-state";
import { VerifiedPlayerBadge } from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";

const HIDDEN_TWITCH_CHANNEL_LOGINS = new Set(["paladins2ttv"]);

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function CommunityPage() {
  const { t , formatNumber, formatDateTime} = useLocalization();
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
        setError(err instanceof Error ? err.message : t("generated.community.page.failedtoloadposts"));
      } finally {
        setLoading(false);
      }
    }
    load();
    fetchTwitchStreams()
      .then((response) => setStreams(response.streams.filter(
        (stream) => !HIDDEN_TWITCH_CHANNEL_LOGINS.has(stream.userLogin.trim().toLowerCase()),
      )))
      .catch(() => setStreams([]))
      .finally(() => setStreamsLoading(false));
  }, []);

  if (loading) return <RouteSkeleton variant="list" />;
  if (error) return <ErrorState title={t("generated.community.communityUnavailable")} message={error} />;

  return (
    <div className="space-y-6">
      <div className="pc-section-heading">
        <h1 className="pc-heading pc-heading-lg">
          {t("generated.community.community")}
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/community/create"
            className="pc-touch-target inline-flex items-center px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {t("generated.community.newPost")}</Link>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <section className="min-w-0">
          {posts.length === 0 ? (
            <EmptyState title={t("generated.community.noPostsYet")} description={t("generated.community.beTheFirstToShareSomethingWithTheCommunity")} />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={post.tierListId != null ? `/tierlists/${post.id}` : `/community/${post.id}`}
                  className="block min-w-0 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent/50 sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-base font-semibold text-pc-text transition-colors hover:text-pc-accent sm:text-lg">
                        {post.title}{post.tierListId != null && <span className="ml-2 rounded-full border border-pc-accent/40 bg-pc-accent/10 px-2 py-0.5 align-middle text-xs font-semibold uppercase tracking-wide text-pc-accent">{t("tierLists.badge")}</span>}
                      </h2>
                      <p className="mt-1 line-clamp-2 break-words text-sm text-pc-text-secondary [overflow-wrap:anywhere]">
                        {post.content}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pc-text-muted sm:text-sm">
                        <span className="inline-flex min-w-0 items-center gap-1 truncate">{t("generated.community.by")}{" "}{post.username}{post.linkedPlayerId != null && <VerifiedPlayerBadge />}</span>
                        <span>{formatDateTime(post.createdAt)}</span>
                        <span aria-label={t("generated.community.value1Likes", { value1: post.likes })}>❤ {post.likes}</span>
                        <span aria-label={t("generated.community.value1Views", { value1: post.viewCount })}>👁 {post.viewCount}</span>
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
                <h2 className="text-sm font-bold text-pc-text">{t("generated.community.liveOnTwitch")}</h2>
              </div>
              <a
                href="https://www.twitch.tv/directory/category/paladins"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-pc-text-secondary transition-colors hover:text-pc-accent"
              >
                {t("generated.community.browse")}</a>
            </div>

            <div className="divide-y divide-pc-border/70">
              {streamsLoading ? (
                <LoadingPanel compact />
              ) : streams.length === 0 ? (
                <div className="p-4 text-sm text-pc-text-secondary">{t("generated.community.noPaladinsStreamsAreLiveRightNow")}</div>
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
                        <span className="shrink-0 text-rose-400">● {formatNumber(stream.viewerCount)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-pc-text-secondary">{stream.title || t("generated.community.playingPaladins")}</p>
                      {stream.language && <span className="mt-1 block text-xs uppercase tracking-wide text-pc-text-muted">{stream.language}</span>}
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
