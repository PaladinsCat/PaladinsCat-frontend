/** Published evidence detail loaded from the moderated backend feed.
 * refs: endpoints: GET /cheaters/evidence/{id}
 */
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocalization } from "@/lib/localization-context";
import { LoadingPanel } from "@/components/async-state";
import CheaterEvidencePost from "@/components/cheater-evidence-post";
import { fetchCheaterEvidenceDetail, type CheaterEvidence } from "@/lib/api-client";

/**
 * Render a live evidence record fetched by the route ID, showing loading or missing-record states.
 * I/O types: `{ params }: { params: Promise<{ id: string }> } -> JSX.Element`.
 * refs: none
 */
export default function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, formatDateTime } = useLocalization();
  const [evidence, setEvidence] = useState<CheaterEvidence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchCheaterEvidenceDetail(id).then((result) => { if (active) setEvidence(result); }).catch(() => { if (active) setEvidence(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <LoadingPanel compact />;
  const backLink = <Link href="/players/cheaters/evidence" className="inline-flex items-center gap-2 text-sm text-pc-text-secondary hover:text-pc-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{t("moderation.evidencePortal")}</Link>;
  if (!evidence) return <div className="space-y-6">{backLink}<div className="pc-card text-sm text-pc-text-secondary">{t("moderation.evidenceNotFound")}</div></div>;
  return <div className="mx-auto max-w-5xl space-y-6 px-4 py-8" data-testid="evidence-detail">{backLink}<CheaterEvidencePost item={evidence} formatDateTime={formatDateTime} /></div>;
}
