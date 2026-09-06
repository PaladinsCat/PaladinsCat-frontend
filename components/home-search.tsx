/** Provide the homepage search control and lightweight result overlay. · refs: none */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

/** Search across public entities and route submitted blank queries to the search page.  Returns: `React.JSX.Element`. · refs: none */
export default function HomeSearch({ onSearchActiveChange }: HomeSearchProps) {
  const { t } = useLocalization();
  const router = useRouter();
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
    <div className="mx-auto mb-16 max-w-md">
      <form
        action="/search"
        method="GET"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onSubmit={(event) => {
          const formData = new FormData(event.currentTarget);
          if (String(formData.get("q") ?? "").trim() === "") {
            event.preventDefault();
            router.push("/search");
          }
        }}
        className="group flex items-center gap-2"
      >
        <div
          data-active={hovered || focused ? "true" : undefined}
          className={`pc-glass pc-home-search-shell relative flex-1 rounded-lg border transition-[border-color,box-shadow] duration-200 ease-out hover:border-pc-accent-mid focus-within:border-pc-accent-mid focus-within:ring-1 focus-within:ring-pc-accent/30 ${hovered || focused ? "border-pc-accent-mid" : "border-white/5"}`}
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
          {value.length > 0 && (
              <button
                type="button"
                aria-label={t("search.clear")}
                title={t("search.clear")}
                onClick={() => {
                  setValue("");
                  setResults([]);
                  setLoading(false);
                }}
                className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-pc-text-muted transition-colors hover:text-pc-accent"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          {showRelatedResults && (
              <div
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 origin-top overflow-hidden rounded-lg border border-pc-border bg-pc-bg-elevated shadow-md"
              >
                  {loading ? (
                    <div
                      className="flex items-center gap-2.5 px-3 py-3 text-sm text-pc-text-muted"
                      role="status"
                      aria-live="polite"
                    >
                      <LoaderCircle className="h-4 w-4 animate-spin text-pc-accent" aria-hidden="true" />
                      <span>{t("generated.search.searching")}</span>
                      <span className="pc-skeleton ml-auto h-2 w-16 rounded-full" aria-hidden="true" />
                    </div>
                  ) : results.length > 0 ? (
                    <div className="home-search-results max-h-80 overflow-y-auto py-1">
                      {results.map((result) => (
                        <div
                          key={`${result.type}-${result.id}-${result.href}`}
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-sm text-pc-text-muted">
                      {t("generated.search.noRelatedResults")}
                    </div>
                  )}
                <Link
                  href={`/search?q=${encodeURIComponent(value.trim())}`}
                  className="block border-t border-pc-border px-3 py-2 text-sm font-medium text-pc-accent transition-colors hover:bg-pc-bg"
                >
                  {t("generated.search.viewAllResults")}
                </Link>
              </div>
            )}
        </div>
        <button
          type="submit"
          aria-label={t("search.submit")}
          className="pc-glass pc-accent-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/5 text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
        >
          <Search className={`h-4 w-4 transition-colors ${hovered || focused ? "text-pc-accent" : "text-pc-text-muted group-hover:text-pc-accent group-focus-within:text-pc-accent"}`} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
