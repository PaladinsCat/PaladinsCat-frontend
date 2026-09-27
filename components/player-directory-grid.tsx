/**
 * Render player directory grid with `PlayerDirectoryPagination`.
 * refs: none
 */
"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import PlayerDirectoryPagination, { usePersistentDirectoryPage } from "@/components/player-directory-pagination";

const PLAYER_DIRECTORY_PAGE_SIZE = 32;
/**
 * Share the rounded surface, border, and background across player-directory cards.
 * refs: none
 */
export const PLAYER_DIRECTORY_CARD_SURFACE_CLASS = "min-w-0 overflow-hidden rounded-xl border bg-pc-bg-elevated transition-colors";
/**
 * Share the compact 4rem directory-card dimensions and padding.
 * refs: none
 */
export const PLAYER_DIRECTORY_CARD_CLASS = `flex h-16 min-h-16 ${PLAYER_DIRECTORY_CARD_SURFACE_CLASS} px-3 py-2`;

/**
 * Render player directory grid with `PlayerDirectoryPagination`.
 * refs: none
 * I/O types: `{ items, getKey, children, loading = false, pageSize = PLAYER_DIRECTORY_PAGE_SIZE, gridClassName = "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", }: { items: T[]; getKey: (item: T) => string; children: (item: T, index: number) => ReactNode; loading?: boolean; pageSize?: number; gridClassName?: string; } -> JSX.Element`.
 */
export default function PlayerDirectoryGrid<T>({
  items,
  getKey,
  children,
  loading = false,
  pageSize = PLAYER_DIRECTORY_PAGE_SIZE,
  gridClassName = "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}: {
  items: T[];
  getKey: (item: T) => string;
  children: (item: T, index: number) => ReactNode;
  loading?: boolean;
  pageSize?: number;
  gridClassName?: string;
}) {
  const [page, setPage] = usePersistentDirectoryPage("directoryPage");
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const visibleItems = useMemo(
    () => items.slice((page - 1) * safePageSize, page * safePageSize),
    [items, page, safePageSize],
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, setPage, totalPages]);

  return (
    <div className="space-y-4">
      <div className={`${gridClassName} ${loading ? "opacity-60" : ""}`}>
        {visibleItems.map((item, index) => (
          <div key={getKey(item)} className="min-w-0">
            {children(item, (page - 1) * safePageSize + index)}
          </div>
        ))}
      </div>
      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
