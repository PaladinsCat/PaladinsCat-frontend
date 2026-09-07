/** Published evidence detail with retained isolated-provider fixtures. */
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Heart,
  MessageCircle,
  Share2,
  ShieldAlert,
} from "lucide-react";
import { useLocalization } from "@/lib/localization-context";
import { LoadingPanel } from "@/components/async-state";
import CheaterEvidencePost from "@/components/cheater-evidence-post";
import { fetchCheaterEvidenceDetail, type CheaterEvidence } from "@/lib/api-client";

const DISCORD_MEDIA_URL = "https://cdn.discordapp.com/attachments/704760850178637895/1544034230839803994/0831.mp4?ex=6a9da0ef&is=6a9c4f6f&hm=f89c8c6c833c02a7b12443a52ecab626e365fc9f1f8a886015827c401c4f7dce&";
const TWITCH_SOURCE_URL = "https://www.twitch.tv/solairee2707/clip/HappyAlluringDogJKanStyle-ZpoDzHVJLTxOcc4q";
const TWITCH_EMBED_URL = "https://clips.twitch.tv/embed?clip=HappyAlluringDogJKanStyle-ZpoDzHVJLTxOcc4q&parent=127.0.0.1";

const MOCK_EVIDENCE = {
  subjectName: "AetherFox",
  playerId: 900001,
  title: "Input pattern review",
  body: "A community-submitted review of repeated input timing observed across several matches. The evidence is presented for moderation review and discussion.",
  reason: "Input pattern review",
  author: "PaladinsCat Moderation",
  createdAt: "2026-09-06T13:15:00Z",
  sourceUrl: DISCORD_MEDIA_URL,
  mediaUrl: DISCORD_MEDIA_URL,
  likes: 42,
  comments: [
    { author: "NightWatch", body: "The timeline comparison is clear enough to review.", createdAt: "2026-09-06T14:02:00Z" },
    { author: "CobaltPaw", body: "Adding the original source keeps the report easy to audit.", createdAt: "2026-09-06T14:18:00Z" },
  ],
};

export default function MockEvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { formatDateTime, formatNumber } = useLocalization();
  const isFixture = id.startsWith("mock-");
  const [evidence, setEvidence] = useState<CheaterEvidence | null>(null);
  const [loading, setLoading] = useState(!isFixture);

  useEffect(() => {
    if (isFixture) return;
    let active = true;
    setLoading(true);
    fetchCheaterEvidenceDetail(id).then((result) => { if (active) setEvidence(result); }).catch(() => { if (active) setEvidence(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, isFixture]);

  if (!isFixture) {
    if (loading) return <LoadingPanel compact />;
    if (!evidence) return <div className="space-y-6"><Link href="/players/cheaters/evidence" className="inline-flex items-center gap-2 text-sm text-pc-text-secondary hover:text-pc-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Evidence portal</Link><div className="pc-card text-sm text-pc-text-secondary">This evidence record could not be found.</div></div>;
    return <div className="mx-auto max-w-5xl space-y-6 px-4 py-8" data-testid="evidence-detail"><Link href="/players/cheaters/evidence" className="inline-flex items-center gap-2 text-sm text-pc-text-secondary hover:text-pc-accent"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Evidence portal</Link><CheaterEvidencePost item={evidence} formatDateTime={formatDateTime} /></div>;
  }

  const isTwitch = id === "mock-twitch";
  const sourceUrl = isTwitch ? TWITCH_SOURCE_URL : MOCK_EVIDENCE.sourceUrl;
  const mediaUrl = isTwitch ? TWITCH_EMBED_URL : MOCK_EVIDENCE.mediaUrl;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8" data-testid="mock-evidence-detail">
      <Link href="/players/cheaters/evidence" className="inline-flex items-center gap-2 text-sm text-pc-text-secondary transition-colors hover:text-pc-accent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Evidence portal
      </Link>

      <article className="overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-400/35 bg-red-500/10 text-red-200">
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold text-pc-text">{MOCK_EVIDENCE.author}</span>
                  <span className="text-pc-text-muted">·</span>
                  <time className="text-pc-text-muted" dateTime={MOCK_EVIDENCE.createdAt}>{formatDateTime(MOCK_EVIDENCE.createdAt)}</time>
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-red-200">Cheater evidence</span>
          </div>

          <div className="mt-6 space-y-3">
            <h1 className="text-2xl font-bold text-pc-text">{MOCK_EVIDENCE.title}</h1>
            <p className="text-sm leading-6 text-pc-text-secondary">{MOCK_EVIDENCE.body}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pc-text-muted">
              <span className="font-semibold text-pc-text">{MOCK_EVIDENCE.subjectName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">ID {formatNumber(MOCK_EVIDENCE.playerId)}</span>
              <span aria-hidden="true">·</span>
              <span>{MOCK_EVIDENCE.reason}</span>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-pc-border bg-pc-bg" data-testid={isTwitch ? "twitch-embed-test" : "discord-media-test"}>
            {isTwitch ? (
              <iframe
                src={mediaUrl}
                title={`Twitch evidence clip for ${MOCK_EVIDENCE.subjectName}`}
                className="aspect-video w-full bg-black"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <video
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full bg-black object-contain"
                title={`Discord evidence video for ${MOCK_EVIDENCE.subjectName}`}
              >
                <source src={mediaUrl} type="video/mp4" />
                Your browser does not support embedded video. Use the original source link below.
              </video>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-pc-border pt-4 text-sm text-pc-text-secondary">
            <div className="flex items-center gap-5" aria-label="Evidence reactions">
              <span className="inline-flex items-center gap-2"><Heart className="h-4 w-4" aria-hidden="true" />{formatNumber(MOCK_EVIDENCE.likes)}</span>
              <span className="inline-flex items-center gap-2"><MessageCircle className="h-4 w-4" aria-hidden="true" />{formatNumber(MOCK_EVIDENCE.comments.length)}</span>
              <span className="inline-flex items-center gap-2"><Share2 className="h-4 w-4" aria-hidden="true" />Share</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2"><Bookmark className="h-4 w-4" aria-hidden="true" />Save</span>
              <a href={sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 font-semibold text-pc-accent transition-colors hover:text-pc-accent-secondary">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Original source
              </a>
            </div>
          </div>
        </div>
      </article>

      <section className="rounded-lg border border-pc-border bg-pc-bg-elevated p-6" aria-labelledby="mock-evidence-comments">
        <h2 id="mock-evidence-comments" className="pc-card-title mb-4">Comments ({formatNumber(MOCK_EVIDENCE.comments.length)})</h2>
        <div className="space-y-3">
          {MOCK_EVIDENCE.comments.map((comment) => (
            <article key={comment.author} className="rounded-lg bg-pc-bg-secondary p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-medium text-pc-text">{comment.author}</span>
                <span className="text-pc-text-muted">·</span>
                <time className="text-pc-text-muted" dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
              </div>
              <p className="mt-2 text-sm leading-6 text-pc-text-secondary">{comment.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
