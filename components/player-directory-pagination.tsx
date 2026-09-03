/** player-directory-pagination component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";
import { useLocalization } from "@/lib/localization-context";
import { cn } from "@/lib/utils";

function readPage(param: string, storageKey: string) {
  if (typeof window === "undefined") return 1;
  const page = Number(new URLSearchParams(window.location.search).get(param));
  if (Number.isInteger(page) && page > 0) return page;
  try {
    const storedPage = Number(window.sessionStorage.getItem(storageKey));
    return Number.isInteger(storedPage) && storedPage > 0 ? storedPage : 1;
  } catch {
    return 1;
  }
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `Array`
 * refs: none
 */
export function usePersistentDirectoryPage(param = "page") {
  const pathname = usePathname();
  const storageKey = `pc:directory-page:${pathname}:${param}`;
  const [page, setPageState] = useState(1);

  useEffect(() => {
    const syncPage = () => setPageState(readPage(param, storageKey));
    syncPage();
    window.addEventListener("popstate", syncPage);
    return () => window.removeEventListener("popstate", syncPage);
  }, [param, storageKey]);

  const setPage = useCallback((nextPage: SetStateAction<number>) => {
    setPageState((currentPage) => {
      const resolvedPage = typeof nextPage === "function" ? nextPage(currentPage) : nextPage;
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        try {
          if (resolvedPage <= 1) window.sessionStorage.removeItem(storageKey);
          else window.sessionStorage.setItem(storageKey, String(resolvedPage));
        } catch {
          // URL persistence below still preserves browser-back restoration.
        }
        if (resolvedPage <= 1) url.searchParams.delete(param);
        else url.searchParams.set(param, String(resolvedPage));
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      }
      return resolvedPage;
    });
  }, [param, storageKey]);

  return [page, setPage] as const;
}

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  embedded?: boolean;
  className?: string;
}

/** Provide this exported item.
 * Returns: `React.JSX.Element`
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * refs: none
 */
export default function PlayerDirectoryPagination({ page, totalPages, onPageChange, embedded = false, className }: Props) {
  const { t , formatNumber} = useLocalization();
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={t("generated.players.directoryPages")}
      className={cn(
        "items-center justify-between gap-4 px-3 py-2",
        embedded ? "border-t border-pc-border" : "rounded-xl border border-pc-border bg-pc-bg-elevated",
        className ?? "flex",
      )}
    >
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
