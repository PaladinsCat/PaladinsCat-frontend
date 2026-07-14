"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PlayerDirectoryPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Directory pages" className="flex items-center justify-between gap-4 rounded-xl border border-pc-border bg-pc-bg-elevated px-3 py-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-pc-text-secondary transition-colors hover:bg-pc-bg-secondary hover:text-pc-accent disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Previous
      </button>
      <span className="text-xs text-pc-text-muted">Page <strong className="text-pc-text">{page.toLocaleString()}</strong> of {totalPages.toLocaleString()}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-pc-text-secondary transition-colors hover:bg-pc-bg-secondary hover:text-pc-accent disabled:pointer-events-none disabled:opacity-35"
      >
        Next
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
