/** Published cheater evidence viewer and approved-submitter form. */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileImage, Link2, Send } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import PlayersPageHeader from "@/components/ui/players-page-header";
import SmartImage from "@/components/SmartImage";
import { fetchCheaterEvidence, submitCheaterEvidence, type CheaterEvidence } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useLocalization } from "@/lib/localization-context";

const PAGE_SIZE = 12;

function EvidenceCard({ item, formatDateTime }: { item: CheaterEvidence; formatDateTime: (value: string | null | undefined) => string }) {
  return (
    <article className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
      {item.imageUrl && <div className="aspect-video bg-pc-bg"><SmartImage src={item.imageUrl} alt={`Evidence image for ${item.subjectName}`} className="h-full w-full object-contain" /></div>}
      {item.embedUrl && <div className="aspect-video bg-black"><iframe src={item.embedUrl} title={`${item.provider || "Video"} evidence for ${item.subjectName}`} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-pc-text">{item.title}</h2>
            <p className="mt-0.5 truncate text-xs font-medium text-amber-200">{item.subjectName}</p>
          </div>
          {item.provider && <span className="shrink-0 rounded-full border border-pc-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pc-text-muted">{item.provider}</span>}
        </div>
        {item.description && <p className="text-sm leading-6 text-pc-text-secondary">{item.description}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-pc-text-muted">
          <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
          {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-pc-accent hover:text-pc-accent-secondary"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Open original source</a>}
        </div>
      </div>
    </article>
  );
}

export default function CheaterEvidencePage() {
  const { isAdmin, isApproved } = useAuth();
  const { formatDateTime, formatNumber } = useLocalization();
  const [page, setPage] = usePersistentDirectoryPage();
  const [items, setItems] = useState<CheaterEvidence[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadEvidence = useCallback(
    () => fetchCheaterEvidence({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    [page],
  );

  useEffect(() => {
    let active = true;
    loadEvidence()
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setTotal(result.total);
        setError(null);
      })
      .catch(() => {
        if (active) setError("The evidence portal could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadEvidence]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitted(false);
    setError(null);
    const form = new FormData();
    form.set("subject_name", subjectName);
    form.set("title", title);
    form.set("description", description);
    if (playerId.trim()) form.set("player_id", playerId.trim());
    if (sourceUrl.trim()) form.set("source_url", sourceUrl.trim());
    if (file) form.set("file", file, file.name);
    try {
      await submitCheaterEvidence(form);
      setSubjectName(""); setPlayerId(""); setTitle(""); setDescription(""); setSourceUrl(""); setFile(null);
      const input = document.getElementById("cheater-evidence-file") as HTMLInputElement | null;
      if (input) input.value = "";
      setSubmitted(true);
      const result = await loadEvidence();
      setItems(result.items);
      setTotal(result.total);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Evidence could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PlayersPageHeader title="Evidence portal" />
      <p className="text-sm leading-6 text-pc-text-secondary">Review published images and video links. YouTube and Twitch clips play here directly; every supported item also keeps its original source link.</p>
      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {submitted && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Evidence submitted successfully.</div>}

      {(isAdmin || isApproved) ? (
        <form onSubmit={submit} className="rounded-xl border border-amber-400/25 bg-pc-bg-elevated p-4">
          <div className="flex items-start gap-3">
            <Send className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <div><h2 className="text-base font-semibold text-pc-text">Submit evidence</h2><p className="mt-1 text-xs leading-5 text-pc-text-muted">Images are retained in the external evidence store and converted to AVIF automatically.</p></div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-semibold text-pc-text-secondary">Subject name<input required value={subjectName} onChange={(event) => setSubjectName(event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal text-pc-text outline-none focus:border-pc-accent-mid" /></label>
            <label className="space-y-1 text-xs font-semibold text-pc-text-secondary">Public player ID (optional)<input inputMode="numeric" value={playerId} onChange={(event) => setPlayerId(event.target.value)} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal text-pc-text outline-none focus:border-pc-accent-mid" /></label>
            <label className="space-y-1 text-xs font-semibold text-pc-text-secondary md:col-span-2">Title<input required value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal text-pc-text outline-none focus:border-pc-accent-mid" /></label>
            <label className="space-y-1 text-xs font-semibold text-pc-text-secondary md:col-span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={4000} rows={3} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal text-pc-text outline-none focus:border-pc-accent-mid" /></label>
            <label className="space-y-1 text-xs font-semibold text-pc-text-secondary">Source URL (optional)<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal text-pc-text outline-none focus:border-pc-accent-mid" /><span className="block font-normal text-pc-text-muted">HTTPS links; YouTube/Twitch clips embed automatically.</span></label>
            <label className="space-y-1 text-xs font-semibold text-pc-text-secondary">Image (optional)<input id="cheater-evidence-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-1.5 text-sm font-normal text-pc-text file:mr-3 file:rounded file:border-0 file:bg-pc-bg-secondary file:px-2 file:py-1 file:text-xs file:text-pc-text" /><span className="block font-normal text-pc-text-muted">PNG, JPEG, or WebP up to 12 MB.</span></label>
          </div>
          <button type="submit" disabled={submitting} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition-opacity disabled:cursor-wait disabled:opacity-50">{submitting ? "Submitting…" : "Submit evidence"}</button>
        </form>
      ) : (
        <div className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4 text-sm text-pc-text-secondary">Evidence submission is available to approved accounts and administrators. <Link href="/auth/login?redirect=%2Fplayers%2Fcheaters%2Fevidence" className="font-semibold text-pc-accent hover:text-pc-accent-secondary">Sign in</Link> to continue.</div>
      )}

      <div className="flex items-center justify-between gap-3 text-xs text-pc-text-muted">
        <span className="inline-flex items-center gap-1.5"><FileImage className="h-4 w-4" aria-hidden="true" />{formatNumber(total)} published items</span>
        <span className="inline-flex items-center gap-1.5"><Link2 className="h-4 w-4" aria-hidden="true" />Source links remain available</span>
      </div>
      {loading && items.length === 0 ? <LoadingPanel compact /> : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pc-border bg-pc-bg-elevated px-4 py-12 text-center text-sm text-pc-text-muted">No published evidence yet.</div>
      ) : (
        <div className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${loading ? "opacity-60" : ""}`}>
          {items.map((item) => <EvidenceCard key={item.id} item={item} formatDateTime={formatDateTime} />)}
        </div>
      )}
      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
