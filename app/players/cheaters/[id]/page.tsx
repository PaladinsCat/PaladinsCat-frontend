/**
 * Public cheater detail with approved evidence and supporting match rows.
 *
 * refs: migrations: 163, 166 · endpoint: GET /cheaters/{id}
 */
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import CheaterEvidencePost from "@/components/cheater-evidence-post";
import { fetchCheaterDetail, type CheaterDetail } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Render one confirmed cheater and the public records supporting that flag. */
export default function CheaterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { formatDateTime } = useLocalization();
  const [detail, setDetail] = useState<CheaterDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCheaterDetail(id).then((result) => { if (active) setDetail(result); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id]);

  if (error) return <div className="space-y-6"><Link href="/players/cheaters" className="inline-flex items-center gap-2 text-sm text-pc-text-secondary hover:text-pc-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Cheater portal</Link><div className="pc-card text-sm text-pc-text-secondary">This cheater record could not be found.</div></div>;
  if (!detail) return <LoadingPanel compact />;

  return (
    <div className="space-y-6">
      <Link href="/players/cheaters" className="inline-flex items-center gap-2 text-sm text-pc-text-secondary hover:text-pc-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Cheater portal</Link>
      <header className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/35 bg-red-500/10 text-red-200"><ShieldAlert className="h-5 w-5" aria-hidden="true" /></span><div><h1 className="text-2xl font-bold text-pc-text">{detail.player.name}</h1><p className="font-mono text-xs text-pc-text-muted">ID {detail.player.id}</p></div></header>
      <section className="space-y-4" aria-labelledby="evidence-heading"><h2 id="evidence-heading" className="text-lg font-semibold text-pc-text">Evidence</h2>{detail.evidence.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">No published evidence is available.</div> : <div className="grid gap-4 lg:grid-cols-2">{detail.evidence.map((item) => <CheaterEvidencePost key={item.id} item={item} formatDateTime={formatDateTime} />)}</div>}</section>
      <section className="space-y-4" aria-labelledby="matches-heading"><h2 id="matches-heading" className="text-lg font-semibold text-pc-text">Supporting matches</h2>{detail.supportingMatches.length === 0 ? <div className="pc-card text-sm text-pc-text-muted">No supporting match is linked to published evidence.</div> : <div className="overflow-hidden rounded-xl border border-pc-border"><table className="w-full text-left text-sm"><thead className="bg-pc-bg-elevated text-xs text-pc-text-muted"><tr><th className="px-4 py-3 font-medium">Match</th><th className="px-4 py-3 font-medium">Map</th><th className="px-4 py-3 font-medium">Region</th><th className="px-4 py-3 text-right font-medium">Duration</th><th className="px-4 py-3 text-right font-medium">Played</th></tr></thead><tbody className="divide-y divide-pc-border bg-pc-bg">{detail.supportingMatches.map((match) => <tr key={match.matchId}><td className="px-4 py-3 font-mono text-xs"><Link href={`/matches/${encodeURIComponent(match.matchId)}`} className="font-semibold text-pc-accent hover:text-pc-accent-secondary">#{match.matchId}</Link></td><td className="px-4 py-3 text-pc-text-secondary">{match.map || "—"}</td><td className="px-4 py-3 text-pc-text-secondary">{match.region || "—"}</td><td className="px-4 py-3 text-right font-mono tabular-nums text-pc-text-secondary">{formatDuration(match.durationSeconds)}</td><td className="px-4 py-3 text-right text-xs text-pc-text-muted">{formatDateTime(match.entryDatetime)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  );
}
