/** Render the player's saved friends and distinct private, empty and unavailable states.
 * refs: endpoints: GET /players/{id}/friends · see: lib/player-friends-api.ts
 */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/async-state";
import { DataCardSkeleton } from "@/components/route-skeleton";
import PlatformIcon from "@/components/platform-icon";
import { useLocalization } from "@/lib/localization-context";
import { fetchPlayerFriends, type PlayerFriendsResponse } from "@/lib/player-friends-api";

/**
 * Render friends and profile navigation. I/O: no inputs -> React.JSX.Element.
 * refs: endpoints: GET /players/{id}/friends
 * I/O types: `none -> JSX.Element`.
 */
export default function PlayerFriendsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocalization();
  const [data, setData] = useState<PlayerFriendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setFailed(false); setData(null);
    fetchPlayerFriends(id, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt]);
  return <div className="space-y-6">
    <PageHeader parentHref={`/players/${id}`} parentLabel={t("playerFriends.profile")} title={t("playerFriends.title")} />
    <section className="min-h-56" aria-busy={loading}>
      {loading ? <DataCardSkeleton /> : failed || !data || data.status === "unavailable" ? <ErrorState title={t("playerFriends.unavailable")} onRetry={() => setAttempt(value => value + 1)} /> : data.status === "private" ? <EmptyState title={t("playerFriends.private")} /> : <>
        {data.freshness.expired && <p className="mb-3 text-sm text-pc-text-muted" role="status">{t("playerFriends.stale")}</p>}
        {data.friends.length === 0 ? <EmptyState title={t("playerFriends.empty")} /> : <ul className="pc-card min-h-56 divide-y divide-pc-border p-4">{data.friends.map(friend => <li key={friend.id}><Link href={`/players/${friend.id}`} className="flex items-center gap-2 py-3 text-pc-text hover:text-pc-accent"><PlatformIcon platform={friend.platform} /><span className="min-w-0 break-words">{friend.name}</span></Link></li>)}</ul>}
      </>}
    </section>
  </div>;
}
