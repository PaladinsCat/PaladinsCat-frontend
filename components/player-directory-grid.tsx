"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import PlayerDirectoryPagination from "@/components/player-directory-pagination";

const PLAYER_DIRECTORY_PAGE_SIZE = 24;

export default function PlayerDirectoryGrid<T>({
  items,
  getKey,
  children,
  loading = false,
}: {
  items: T[];
  getKey: (item: T) => string;
  children: (item: T, index: number) => ReactNode;
  loading?: boolean;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PLAYER_DIRECTORY_PAGE_SIZE));
  const visibleItems = useMemo(
    () => items.slice((page - 1) * PLAYER_DIRECTORY_PAGE_SIZE, page * PLAYER_DIRECTORY_PAGE_SIZE),
    [items, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
        {visibleItems.map((item, index) => (
          <div key={getKey(item)} className="min-w-0">
            {children(item, (page - 1) * PLAYER_DIRECTORY_PAGE_SIZE + index)}
          </div>
        ))}
      </div>
      <PlayerDirectoryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
