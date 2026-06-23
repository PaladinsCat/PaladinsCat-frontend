"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchChangelog, type ChangelogPage } from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";

const PER_PAGE = 10;

export default function ChangelogPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ChangelogPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchChangelog({ page, perPage: PER_PAGE }).then((result) => {
      if (!cancelled) setData(result);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = data?.totalPages ?? 1;

  // Generate page numbers to show (with ellipsis for large ranges)
  const pageNumbers = (() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/" className="text-pc-text-muted hover:text-pc-accent transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <h1 className="text-2xl font-semibold text-pc-text">Changelog</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-pc-bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-pc-bg-secondary rounded w-2/3 mb-1" />
              <div className="h-3 bg-pc-bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.data.length ?? 0 === 0 ? (
        <div className="bg-pc-bg-elevated border border-pc-border rounded-xl p-8 text-center">
          <p className="text-pc-text-muted text-sm">No changelog entries yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.data.map((entry) => (
              <div
                key={entry.id}
                className="bg-pc-bg-elevated border border-pc-border rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-pc-text truncate">
                      {entry.version}
                      {entry.gitCommitShort && (
                        <span className="text-pc-text-muted font-mono ml-2 text-xs">
                          {entry.gitCommitShort}
                        </span>
                      )}
                    </h2>
                    {entry.deployedAt && (
                      <span className="text-pc-text-muted text-[10px]">
                        {formatLocalDateTime(entry.deployedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-pc-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.changelog}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm text-pc-text-muted hover:text-pc-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &larr; Prev
              </button>

              <div className="flex items-center gap-1 mx-2">
                {pageNumbers.map((pn, i) =>
                  pn === "..." ? (
                    <span key={`e-${i}`} className="px-1 text-pc-text-muted text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={pn}
                      onClick={() => setPage(pn as number)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                        page === pn
                          ? "bg-pc-accent text-pc-bg font-bold"
                          : "text-pc-text-muted hover:text-pc-accent"
                      }`}
                    >
                      {pn}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm text-pc-text-muted hover:text-pc-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
