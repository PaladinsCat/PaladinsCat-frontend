"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocalization } from "@/lib/localization-context";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PlayerDirectoryPagination({ page, totalPages, onPageChange }: Props) {
  const { t , formatNumber} = useLocalization();
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={t("generated.players.directoryPages")} className="flex items-center justify-between gap-4 rounded-xl border border-pc-border bg-pc-bg-elevated px-3 py-2">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-pc-text-secondary transition-colors hover:bg-pc-bg-secondary hover:text-pc-accent disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        {t("generated.players.previous")}</button>
      <span className="text-xs text-pc-text-muted">{t("generated.players.page")}{" "}<strong className="text-pc-text">{formatNumber(page)}</strong> {t("generated.players.of")}{" "}{formatNumber(totalPages)}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-pc-text-secondary transition-colors hover:bg-pc-bg-secondary hover:text-pc-accent disabled:pointer-events-none disabled:opacity-35"
      >
        {t("generated.players.next")}<ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </nav>
  );
}
