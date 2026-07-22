"use client";

import { memo, Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchUniversalSearch,
  fetchReferenceChampions,
  type UniversalSearchResult,
  type UniversalSearchResponse,
  type UniversalSearchRemoteTarget,
  type UniversalSearchType,
} from "@/lib/api-client";
import { getChampionIconSafe } from "@/lib/champion-icons";
import { AsyncButton, EmptyState, ErrorState, LoadingPanel } from "@/components/async-state";
import { RouteSkeleton } from "@/components/route-skeleton";
import { PlayerSearchSubtitle } from "@/components/player-search-result";
import ScrambleText from "@/components/ScrambleText";
import { useLocalization } from "@/lib/localization-context";

const TYPE_LABEL: Record<UniversalSearchType, string> = {
  player: "Player",
  match: "Match",
  champion: "Champion",
  item: "Item",
  card: "Card",
  talent: "Talent",
};

const TYPE_STYLE: Record<UniversalSearchType, string> = {
  player: "border-pc-accent/30 bg-pc-accent/10 text-pc-accent",
  match: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  champion: "border-pc-accent-alt/30 bg-pc-accent-alt/10 text-pc-accent-alt",
  item: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  card: "border-pc-accent-third/30 bg-pc-accent-third/10 text-pc-accent-third",
  talent: "border-rose-400/30 bg-rose-400/10 text-rose-300",
};

type StaticReferenceRow = {
  id: number;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  championId?: number | null;
  championName?: string | null;
  itemType?: string | null;
};

type StaticReferenceIndex = {
  items: StaticReferenceRow[];
  cards: StaticReferenceRow[];
  talents: StaticReferenceRow[];
  championNames: Map<number, string>;
};

let staticReferencePromise: Promise<StaticReferenceIndex> | null = null;

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function slug(name: string | null | undefined) {
  return String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rankStaticName(name: string, q: string, base: number) {
  const n = normalize(name);
  const query = normalize(q);
  if (n === query) return base + 30;
  if (n.startsWith(query)) return base + 18;
  if (n.includes(query)) return base + 8;
  return base;
}

function uniqueByName(rows: StaticReferenceRow[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${normalize(row.name)}:${row.championId ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadStaticReferenceIndex(): Promise<StaticReferenceIndex> {
  if (!staticReferencePromise) {
    staticReferencePromise = Promise.all([
      fetch("/data/paladins-items-reference.json").then((res) => res.ok ? res.json() : []),
      fetch("/data/paladins-card-reference.json").then((res) => res.ok ? res.json() : []),
      fetch("/data/paladins-talent-reference.json").then((res) => res.ok ? res.json() : []),
      fetchReferenceChampions().catch(() => []),
    ]).then(([items, cards, talents, champions]) => {
      const championNames = new Map<number, string>(
        champions.map((champion) => [Number(champion.id), champion.name])
      );
      return {
        // The item reference file also carries champion cards/talents from the
        // Hi-Rez item endpoint. Universal item search should keep the vendor
        // item lane focused on buyable match items; card/talent lanes below use
        // their dedicated local reference files.
        items: uniqueByName((items as StaticReferenceRow[]).filter((item) => Number(item.championId ?? 0) === 0)),
        cards: uniqueByName(cards as StaticReferenceRow[]),
        talents: uniqueByName(talents as StaticReferenceRow[]),
        championNames,
      };
    });
  }
  return staticReferencePromise;
}

function staticReferenceResults(q: string, index: StaticReferenceIndex): UniversalSearchResult[] {
  const query = normalize(q);
  if (query.length < 2) return [];

  const matches = (row: StaticReferenceRow) => normalize(row.name).includes(query);
  const championName = (row: StaticReferenceRow) => row.championName || index.championNames.get(Number(row.championId ?? 0)) || null;

  const itemResults: UniversalSearchResult[] = index.items
    .filter(matches)
    .slice(0, 8)
    .map((row) => ({
      type: "item",
      id: String(row.id),
      title: row.name,
      subtitle: row.itemType || "Item",
      href: `/game/items/${row.id}`,
      score: rankStaticName(row.name, q, 74),
      meta: { itemType: row.itemType },
    }));

  const cardResults: UniversalSearchResult[] = index.cards
    .filter(matches)
    .slice(0, 10)
    .map((row) => {
      const champ = championName(row);
      return {
        type: "card",
        id: String(row.id),
        title: row.name,
        subtitle: champ ? `${champ} loadout card` : "Loadout card",
        href: champ ? `/champions/${slug(champ)}` : "/stats/loadouts",
        score: rankStaticName(row.name, q, 78),
        meta: { championId: row.championId, championName: champ },
      };
    });

  const talentResults: UniversalSearchResult[] = index.talents
    .filter(matches)
    .slice(0, 10)
    .map((row) => {
      const champ = championName(row);
      return {
        type: "talent",
        id: String(row.id),
        title: row.name,
        subtitle: champ ? `${champ} talent` : "Champion talent",
        href: champ ? `/champions/${slug(champ)}` : "/stats/talents",
        score: rankStaticName(row.name, q, 80),
        meta: { championId: row.championId, championName: champ },
      };
    });

  return [...talentResults, ...cardResults, ...itemResults];
}

function mergeResults(results: UniversalSearchResult[]) {
  const seen = new Set<string>();
  return results
    .filter((result) => {
      const key = `${result.type}:${normalize(result.title)}:${result.meta?.championId ?? ""}:${result.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || typeSort(a.type) - typeSort(b.type) || a.title.localeCompare(b.title));
}

function resultInitial(type: UniversalSearchType) {
  return TYPE_LABEL[type].slice(0, 1);
}

function typeSort(type: UniversalSearchType) {
  return ["player", "match", "champion", "talent", "card", "item"].indexOf(type);
}

function isNumericQuery(value: string) {
  return /^\d{2,}$/.test(value.trim());
}

function isLikelyMatchId(value: string) {
  const q = value.trim();
  return /^\d{10,13}$/.test(q) && Number(q) >= 1_000_000_000;
}

function canRemotePlayerNameLookup(value: string) {
  const q = value.trim();
  if (/^(xbox|xbl|psn|ps|playstation|switch|nintendo)[:/].{2,64}$/i.test(q)) {
    return !/[,%*?]/.test(q);
  }
  return q.length >= 3 && q.length <= 32 && !/^\d+$/.test(q) && !/[,%*?]/.test(q);
}

function ResultIcon({ result }: { result: UniversalSearchResult }) {
  if (result.type === "champion") {
    return (
      <img
        src={getChampionIconSafe(result.title)}
        alt=""
        className="h-10 w-10 rounded-lg object-contain bg-pc-bg border border-pc-border"
        loading="lazy"
      />
    );
  }

  const championName = typeof result.meta?.championName === "string" ? result.meta.championName : null;
  if ((result.type === "card" || result.type === "talent") && championName) {
    return (
      <img
        src={getChampionIconSafe(championName)}
        alt=""
        className="h-10 w-10 rounded-lg object-contain bg-pc-bg border border-pc-border"
        loading="lazy"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-lg bg-pc-bg border border-pc-border flex items-center justify-center text-xs font-bold text-pc-accent">
      {resultInitial(result.type)}
    </div>
  );
}

function remoteLookupNotice(target: UniversalSearchRemoteTarget, remote: UniversalSearchResponse["remote"]) {
  if (!remote) return null;
  if (remote.skipped) {
    return null;
  }
  if (remote.status === "hit") {
    if (target === "match-id") {
      return "Match found.";
    }
    return "Result found.";
  }
  if (remote.status === "miss") {
    if (target === "match-id") {
      return "No match found for this ID.";
    }
    return "No result found.";
  }
  if (remote.status === "error") {
    return "Search is temporarily unavailable.";
  }
  return null;
}

const SearchResultGroups = memo(function SearchResultGroups({
  grouped,
}: {
  grouped: Array<[UniversalSearchType, UniversalSearchResult[]]>;
}) {
  const { t } = useLocalization();
  if (grouped.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      {grouped.map(([type, rows]) => (
        <section key={type} className="space-y-2.5">
          <div className="flex items-center gap-2 px-1.5">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-pc-text-secondary">{TYPE_LABEL[type]}</h2>
            <span className="rounded-full border border-pc-border/70 bg-pc-bg-elevated/80 px-2 py-0.5 text-xs tabular-nums text-pc-text-muted">{rows.length}</span>
          </div>
          <div className="space-y-2.5">
            {rows.map((result) => (
              <Link
                key={`${result.type}-${result.id}-${result.href}`}
                href={result.href}
                className="pc-search-result group relative flex items-center gap-3 overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated/90 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-pc-accent-mid"
              >
                <ResultIcon result={result} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-pc-text group-hover:text-pc-accent transition-colors">
                      {result.title}
                    </span>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full border ${TYPE_STYLE[result.type]}`}>
                      {TYPE_LABEL[result.type]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-pc-text-muted mt-1">
                    <PlayerSearchSubtitle result={result} />
                  </p>
                </div>
                <span className="shrink-0 text-lg text-pc-text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-pc-accent" aria-hidden="true">→</span>
                <span className="sr-only">{t("generated.search.view")}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});

function SearchPageBody() {
  const { t } = useLocalization();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<UniversalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(initialQuery.trim().length > 0);
  const [error, setError] = useState<string | null>(null);
  const [remoteLoadingTarget, setRemoteLoadingTarget] = useState<UniversalSearchRemoteTarget | null>(null);
  const [remoteNotice, setRemoteNotice] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const q = deferredQuery.trim();
    setError(null);
    setRemoteNotice(null);
    if (q.length < 2 && !/^\d+$/.test(q)) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      setSearched(true);
      Promise.all([
        fetchUniversalSearch(q, 36).catch((): UniversalSearchResponse => ({
          query: q,
          total: 0,
          data: [],
        })),
        loadStaticReferenceIndex().then((index) => staticReferenceResults(q, index)).catch(() => [] as UniversalSearchResult[]),
      ])
        .then(([response, staticResults]) => {
          setResults(mergeResults([...response.data, ...staticResults]).slice(0, 48));
          if (isLikelyMatchId(q)) {
            setRemoteNotice(remoteLookupNotice("match-id", response.remote));
          }
          const params = new URLSearchParams(window.location.search);
          params.set("q", q);
          window.history.replaceState(null, "", `/search?${params.toString()}`);
        })
        .catch(() => {
          setError(t("generated.search.searchUnavailable"));
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 180);

    return () => window.clearTimeout(timer);
  }, [deferredQuery]);

  const grouped = useMemo(() => {
    const byType = new Map<UniversalSearchType, UniversalSearchResult[]>();
    for (const result of results) {
      const list = byType.get(result.type) ?? [];
      list.push(result);
      byType.set(result.type, list);
    }
    return Array.from(byType.entries()).sort(([a], [b]) => typeSort(a) - typeSort(b));
  }, [results]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    window.history.replaceState(null, "", `/search?q=${encodeURIComponent(q)}`);
  };

  const runRemoteLookup = async (target: UniversalSearchRemoteTarget) => {
    const q = query.trim();
    if (!q || remoteLoadingTarget) return;

    setRemoteLoadingTarget(target);
    setRemoteNotice(null);
    setError(null);
    try {
      const response = await fetchUniversalSearch(q, 36, {
        remote: true,
        remoteTarget: target,
        refresh: target === "match-id",
      });
      setResults((current) => mergeResults([...current, ...response.data]).slice(0, 48));
      setRemoteNotice(remoteLookupNotice(target, response.remote));
    } catch {
      setError(t("generated.search.remoteLookupUnavailable"));
    } finally {
      setRemoteLoadingTarget(null);
    }
  };

  const q = query.trim();
  // Keep explicit Hi-Rez fallback actions visible even after local search finds
  // nearby results. A fuzzy/local player hit is not proof that the desired
  // account exists locally. Match-ID shaped numeric queries are handled
  // automatically by the backend through the same DB-first `fetchMatches`
  // path as the match detail page. The manual match button stays available for
  // match-shaped IDs so a user can retry a recent miss; that click bypasses
  // only the short miss cache and still cannot spend a call for an existing DB
  // row because the backend preflight wins first.
  const remoteActions: Array<{ target: UniversalSearchRemoteTarget; label: string; show: boolean }> = [
    { target: "player-id", label: t("generated.search.lookUpPlayerId"), show: isNumericQuery(q) && !isLikelyMatchId(q) },
    { target: "match-id", label: t("generated.search.lookUpMatchId"), show: isLikelyMatchId(q) },
    { target: "player-name", label: t("generated.search.searchHiRezExactPlayerName"), show: canRemotePlayerNameLookup(q) },
  ];
  const visibleRemoteActions = remoteActions.filter((action) => action.show);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-2 sm:py-6">
      <section className="px-4 py-6 text-center sm:px-8 sm:py-8">
        <h1 className="pc-heading pc-heading-lg text-pc-accent drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)]">
          <ScrambleText text={t("generated.search.search")} speed={30} iterations={15} delayFromCenter={false} />
        </h1>
        <form onSubmit={submit} className="mx-auto mt-6 flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t("generated.search.searchPlayersMatchesChampionsItemsCardsTalents")}
              placeholder={t("generated.search.searchPlayersMatchesChampionsItemsCardsTalents")}
              autoFocus
              className="pc-input pc-search-page-input h-11 w-full rounded-lg pr-10 text-sm"
            />
            {query && (
              <button
                type="button"
                aria-label={t("generated.search.clearSearch")}
                title={t("generated.search.clearSearch")}
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearched(false);
                  window.history.replaceState(null, "", "/search");
                }}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-pc-text-muted transition-colors hover:bg-pc-bg hover:text-pc-accent"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
                  <path
                    d="M5.6 5.6 10 10m0 0 4.4 4.4M10 10l4.4-4.4M10 10l-4.4 4.4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label={t("generated.search.search")}
            title={t("generated.search.search")}
            className="pc-glass pc-accent-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-pc-border text-pc-text-muted transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </section>

      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
        {(["player", "match", "champion", "talent", "card", "item"] as UniversalSearchType[]).map((type) => {
          const count = results.filter((result) => result.type === type).length;
          return (
            <span key={type} className={`text-xs px-2 py-1 rounded-full border ${TYPE_STYLE[type]}`}>
              {TYPE_LABEL[type]} {count}
            </span>
          );
        })}
      </div>

      {searched && visibleRemoteActions.length > 0 && (
        <div className="pc-glass mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-pc-border px-4 py-2.5">
          <span className="text-xs text-pc-text-muted">{t("generated.search.exactLookupLocalDbIsCheckedFirst")}</span>
          {visibleRemoteActions.map((action) => (
            <AsyncButton
              key={action.target}
              type="button"
              onClick={() => runRemoteLookup(action.target)}
              disabled={remoteLoadingTarget !== null}
              loading={remoteLoadingTarget === action.target}
              className="px-3 py-1.5 rounded-md border border-pc-accent/30 bg-pc-accent/10 text-xs font-semibold text-pc-accent hover:bg-pc-accent/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {action.label}
            </AsyncButton>
          ))}
        </div>
      )}

      {remoteNotice && (
        <div className="pc-card mx-auto max-w-3xl text-xs text-pc-text-muted">{remoteNotice}</div>
      )}

      {loading && results.length === 0 && (
        <div className="mx-auto max-w-3xl"><LoadingPanel /></div>
      )}

      {error && (
        <div className="mx-auto max-w-3xl"><ErrorState title={t("generated.search.searchUnavailable")} message={error} /></div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="mx-auto max-w-3xl"><EmptyState title={t("generated.search.noResultsFound")} description={t("generated.search.tryABroaderNamePlayerIdMatchIdChampionItem")} /></div>
      )}

      <SearchResultGroups grouped={grouped} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<RouteSkeleton variant="list" />}>
      <SearchPageBody />
    </Suspense>
  );
}
