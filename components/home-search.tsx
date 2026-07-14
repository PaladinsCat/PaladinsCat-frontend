"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchUniversalSearch, type UniversalSearchResult, type UniversalSearchType } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import PlayerName from "@/components/player-name";
import { PlayerSearchSubtitle } from "@/components/player-search-result";

const RESULT_TYPE_LABEL: Record<UniversalSearchType, string> = {
  player: "Player",
  match: "Match",
  champion: "Champion",
  item: "Item",
  card: "Card",
  talent: "Talent",
};

type HomeSearchProps = {
  onSearchActiveChange?: (active: boolean) => void;
};

export default function HomeSearch({ onSearchActiveChange }: HomeSearchProps) {
  const { t } = useLocalization();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetchUniversalSearch(query, 6);
        if (active) setResults(response.data);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [value]);

  const showRelatedResults = focused && value.trim().length >= 2;

  useEffect(() => {
    onSearchActiveChange?.(focused && value.trim().length > 0);
  }, [focused, onSearchActiveChange, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-auto mb-16 max-w-md"
    >
      <style>{`
        .home-search-results {
          scrollbar-color: var(--pc-accent-secondary) var(--pc-bg-elevated);
          scrollbar-width: thin;
        }

        .home-search-results::-webkit-scrollbar {
          width: 0.5rem;
        }

        .home-search-results::-webkit-scrollbar-track {
          background: var(--pc-bg-elevated);
          box-shadow: inset 1px 0 var(--pc-border);
        }

        .home-search-results::-webkit-scrollbar-thumb {
          background: var(--pc-accent-secondary);
          border-radius: 999px;
        }

        .home-search-results::-webkit-scrollbar-thumb:hover {
          background: var(--pc-accent);
        }

        .home-search-results::-webkit-scrollbar-button {
          display: none;
          height: 0;
        }
      `}</style>
      <form
        action="/search"
        method="GET"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);
          if (String(formData.get("q") ?? "").trim() === "") event.preventDefault();
        }}
        className="group flex items-center gap-2"
      >
        <div
          className={`pc-glass relative flex-1 rounded-lg border transition-all duration-200 ease-out hover:scale-[1.02] hover:border-pc-accent-mid hover:shadow-[0_10px_26px_rgba(51,182,177,0.14)] focus-within:scale-[1.02] focus-within:border-pc-accent-mid focus-within:shadow-[0_10px_26px_rgba(51,182,177,0.14)] ${hovered || focused ? "scale-[1.02] border-pc-accent-mid shadow-[0_10px_26px_rgba(51,182,177,0.14)]" : "border-white/5"}`}
        >
          <input
            type="text"
            name="q"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            aria-label={t("search.homeInputLabel")}
            className="w-full rounded-lg bg-transparent px-4 py-2 pr-10 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted"
          />
          {value.length > 0 && (
            <button
              type="button"
              aria-label={t("search.clear")}
              title={t("search.clear")}
              onClick={() => setValue("")}
              className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-pc-text-muted transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
          {showRelatedResults && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated shadow-xl">
              {loading ? (
                <div className="px-3 py-3 text-sm text-pc-text-muted">Searching…</div>
              ) : results.length > 0 ? (
                <div className="home-search-results max-h-80 overflow-y-auto py-1">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}-${result.href}`}
                      href={result.href}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-pc-bg"
                    >
                      <span className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-pc-accent">
                        {RESULT_TYPE_LABEL[result.type]}
                      </span>
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="block truncate text-sm font-medium text-pc-text">
                          {result.type === "player" ? <PlayerName playerId={result.id}>{result.title}</PlayerName> : result.title}
                        </span>
                        <span className="block truncate text-xs text-pc-text-muted">
                          <PlayerSearchSubtitle result={result} />
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-3 text-sm text-pc-text-muted">No related results</div>
              )}
              <Link
                href={`/search?q=${encodeURIComponent(value.trim())}`}
                className="block border-t border-pc-border px-3 py-2 text-sm font-medium text-pc-accent transition-colors hover:bg-pc-bg"
              >
                View all results
              </Link>
            </div>
          )}
        </div>
        <button
          type="submit"
          aria-label={t("search.submit")}
          className="pc-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${hovered || focused ? "text-pc-accent" : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"}`}><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </button>
      </form>
    </motion.div>
  );
}
