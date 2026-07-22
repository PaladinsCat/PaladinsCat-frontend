"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Search, X } from "lucide-react";
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
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
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
      initial={reduceMotion ? false : { opacity: 0, y: 15, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto mb-16 max-w-md"
    >
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
            onChange={(event) => {
              const nextValue = event.target.value;
              setValue(nextValue);
              if (nextValue.trim().length < 2) {
                setResults([]);
                setLoading(false);
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            aria-label={t("search.homeInputLabel")}
            className="w-full rounded-lg bg-transparent px-4 py-2 pr-10 text-sm text-pc-text outline-none transition-colors placeholder:text-pc-text-muted"
          />
          <AnimatePresence>
            {value.length > 0 && (
              <motion.button
                type="button"
                aria-label={t("search.clear")}
                title={t("search.clear")}
                onClick={() => {
                  setValue("");
                  setResults([]);
                  setLoading(false);
                }}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.65, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, rotate: 30 }}
                whileTap={reduceMotion ? undefined : { scale: 0.82 }}
                className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-pc-text-muted transition-colors hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showRelatedResults && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -5, scale: 0.99 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 origin-top overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated shadow-xl"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center gap-2.5 px-3 py-3 text-sm text-pc-text-muted"
                      role="status"
                      aria-live="polite"
                    >
                      <LoaderCircle className="h-4 w-4 animate-spin text-pc-accent" aria-hidden="true" />
                      <span>{t("generated.search.searching")}</span>
                      <span className="pc-skeleton ml-auto h-2 w-16 rounded-full" aria-hidden="true" />
                    </motion.div>
                  ) : results.length > 0 ? (
                    <motion.div
                      key="results"
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="home-search-results max-h-80 overflow-y-auto py-1"
                    >
                      {results.map((result, index) => (
                        <motion.div
                          key={`${result.type}-${result.id}-${result.href}`}
                          initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.15) }}
                        >
                          <Link
                            href={result.href}
                            className="group/result flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-pc-bg"
                          >
                            <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide text-pc-accent transition-transform duration-200 group-hover/result:translate-x-0.5">
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
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="px-3 py-3 text-sm text-pc-text-muted"
                    >
                      {t("generated.search.noRelatedResults")}
                    </motion.div>
                  )}
                </AnimatePresence>
                <Link
                  href={`/search?q=${encodeURIComponent(value.trim())}`}
                  className="block border-t border-pc-border px-3 py-2 text-sm font-medium text-pc-accent transition-colors hover:bg-pc-bg"
                >
                  {t("generated.search.viewAllResults")}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          type="submit"
          aria-label={t("search.submit")}
          whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: -3 }}
          whileTap={reduceMotion ? undefined : { scale: 0.9 }}
          transition={{ type: "spring", stiffness: 350, damping: 18 }}
          className="pc-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent hover:shadow-[0_0_22px_rgba(51,182,177,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
        >
          <Search className={`h-4 w-4 transition-colors ${hovered || focused ? "text-pc-accent" : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"}`} aria-hidden="true" />
        </motion.button>
      </form>
    </motion.div>
  );
}
