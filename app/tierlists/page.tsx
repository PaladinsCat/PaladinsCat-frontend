/**
 * Define the tierlists page responsibility boundary.
 * Coordinates tierlists page data loading, authorization, and presentation.
 * refs: none
 */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTierLists, type TierListSummary } from "@/lib/tierlists-api";
import TierListBoard from "@/components/tier-list-board";
import { EmptyState, ErrorState } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { formatLocalDateTime } from "@/lib/time-format";
import { VerifiedPlayerBadge } from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function TierListsPage() {
  const { t , formatDateTime} = useLocalization();
  const [lists, setLists] = useState<TierListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTierLists()
      .then(setLists)
      .catch((reason) => setError(reason instanceof Error ? reason.message : t("generated.tierlists.page.failedtoloadtierlists")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <RouteSkeleton variant="list" />;
  if (error) return <ErrorState title={t("tierLists.title")} message={error} />;

  return <div className="space-y-6">
    <div className="pc-section-heading items-end">
      <div><h1 className="pc-heading pc-heading-lg">{t("tierLists.title")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("tierLists.description")}</p></div>
      <Link href="/tierlists/create" className="pc-touch-target rounded-lg bg-pc-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary">{t("tierLists.create")}</Link>
    </div>
    {lists.length === 0 ? <EmptyState title={t("tierLists.empty")} description={t("tierLists.socialHint")} /> : <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">{lists.map((list) => <Link key={list.id} href={`/tierlists/${list.id}`} className="group min-w-0 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 transition-colors hover:border-pc-accent/50">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-semibold text-pc-text group-hover:text-pc-accent">{list.title}</h2><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-pc-text-muted"><span className="inline-flex items-center gap-1">{t("tierLists.createdBy", { name: list.username })}{list.linkedPlayerId != null && <VerifiedPlayerBadge />}</span><span>{formatDateTime(list.createdAt)}</span><span>❤ {list.likes}</span><span>💬 {list.commentCount}</span><span>👁 {list.viewCount}</span></div></div><span className="text-pc-text-muted group-hover:text-pc-accent">→</span></div>
      <TierListBoard entries={list.entries} compact />
    </Link>)}</div>}
  </div>;
}
