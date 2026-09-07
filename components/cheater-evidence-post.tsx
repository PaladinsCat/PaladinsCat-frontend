/**
 * Render the shared SNS-style presentation for approved cheater evidence.
 *
 * This component owns media capability selection and source links; routes own
 * fetch state, pagination, and moderation actions.
 *
 * refs: GET /cheaters/evidence · GET /cheaters/{id}
 */
"use client";

import Link from "next/link";
import { ExternalLink, FileImage, Link2 } from "lucide-react";
import type { CheaterEvidence } from "@/lib/api-client";

function evidenceImageUrl(url: string, format: "avif" | "original") {
  return `${url}${url.includes("?") ? "&" : "?"}format=${format}`;
}

function evidenceEmbedUrl(url: string, provider: CheaterEvidence["provider"]) {
  if (provider !== "twitch" || typeof window === "undefined") return url;
  const embedUrl = new URL(url);
  embedUrl.searchParams.set("parent", window.location.hostname);
  return embedUrl.toString();
}

/**
 * Render one approved evidence post with media, match reference, and source.
 *
 * Contract: inputs `CheaterEvidence` and a `(string) => string` date formatter
 * return `JSX.Element`; no network or storage side effects occur here.
 *
 * refs: GET /cheaters/evidence · GET /cheaters/evidence/{id}/media/{position}
 */
export default function CheaterEvidencePost({
  item,
  formatDateTime,
}: {
  item: CheaterEvidence;
  formatDateTime: (value: string | null | undefined) => string;
}) {
  const images = item.imageUrls.length > 0 ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
  return (
    <article className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
      {images.length > 0 && <div className={`grid gap-px bg-pc-border ${images.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {images.map((url, index) => <picture key={url} className="block aspect-video bg-pc-bg"><source srcSet={evidenceImageUrl(url, "avif")} type="image/avif" /><img src={evidenceImageUrl(url, "original")} alt={`Evidence image ${index + 1} for ${item.subjectName}`} loading="lazy" decoding="async" className="h-full w-full object-contain" /></picture>)}
      </div>}
      {item.embedUrl && (item.provider === "medal" || item.provider === "discord") ? (
        <div className="aspect-video bg-black"><video controls playsInline preload="metadata" src={item.embedUrl} title={`${item.provider === "discord" ? "Discord" : "Medal"} evidence clip for ${item.subjectName}`} className="h-full w-full object-contain" /></div>
      ) : item.embedUrl ? (
        <div className="aspect-video bg-black"><iframe src={evidenceEmbedUrl(item.embedUrl, item.provider)} title={`${item.provider || "Video"} evidence for ${item.subjectName}`} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
      ) : null}
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h2 className="truncate text-base font-semibold text-pc-text"><Link href={`/players/cheaters/evidence/${encodeURIComponent(item.id)}`} className="transition-colors hover:text-pc-accent">{item.title}</Link></h2><p className="mt-0.5 truncate text-xs font-medium text-amber-200">{item.subjectName}</p></div>
          {item.provider && <span className="shrink-0 rounded-full border border-pc-border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-pc-text-muted">{item.provider}</span>}
        </div>
        {item.description && <p className="text-sm leading-6 text-pc-text-secondary">{item.description}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-pc-border pt-3 text-xs text-pc-text-muted">
          <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
          <span className="flex flex-wrap items-center gap-3">
            {item.matchId && <Link href={`/matches/${encodeURIComponent(item.matchId)}`} className="inline-flex items-center gap-1 font-semibold text-pc-accent hover:text-pc-accent-secondary"><FileImage className="h-3.5 w-3.5" aria-hidden="true" />Match #{item.matchId}</Link>}
            {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-pc-accent hover:text-pc-accent-secondary"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open original source</a>}
            {!item.sourceUrl && <span className="inline-flex items-center gap-1"><Link2 className="h-3.5 w-3.5" aria-hidden="true" />Image evidence</span>}
          </span>
        </div>
      </div>
    </article>
  );
}
