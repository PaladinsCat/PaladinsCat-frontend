import type {
  UniversalSearchResult,
  UniversalSearchRemoteTarget,
  UniversalSearchType,
} from "./api-client";

export function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function typeSort(type: UniversalSearchType) {
  return ["player", "match", "champion", "talent", "card", "item"].indexOf(type);
}

export function mergeResults(results: UniversalSearchResult[]) {
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

export type SearchState = {
  query: string;
  results: UniversalSearchResult[];
  loading: boolean;
  searched: boolean;
  error: string | null;
  remoteLoadingTarget: UniversalSearchRemoteTarget | null;
  remoteNotice: string | null;
  /**
   * Monotonic guard. Bumped on every query change, clear, or empty search so a
   * stale async response (results, loading, notices, errors) from an earlier
   * query is discarded instead of overwriting the current one.
   */
  generation: number;
};

export type SearchAction =
  | { type: "set-query"; query: string }
  | { type: "clear" }
  | { type: "search-empty" }
  | { type: "search-start"; generation: number }
  | { type: "search-result"; generation: number; results: UniversalSearchResult[]; remoteNotice: string | null }
  | { type: "search-error"; generation: number; error: string }
  | { type: "remote-start"; target: UniversalSearchRemoteTarget }
  | { type: "remote-result"; results: UniversalSearchResult[]; remoteNotice: string | null }
  | { type: "remote-error"; error: string };

export function createInitialSearchState(initialQuery: string): SearchState {
  const hasInitialQuery = initialQuery.trim().length > 0;
  return {
    query: initialQuery,
    results: [],
    loading: hasInitialQuery,
    searched: hasInitialQuery,
    error: null,
    remoteLoadingTarget: null,
    remoteNotice: null,
    generation: 0,
  };
}

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "set-query":
      return {
        ...state,
        query: action.query,
        loading: action.query.trim().length > 0,
        error: null,
        remoteNotice: null,
        generation: state.generation + 1,
      };
    case "clear":
      return {
        ...state,
        query: "",
        results: [],
        loading: false,
        searched: false,
        error: null,
        remoteNotice: null,
        remoteLoadingTarget: null,
        generation: state.generation + 1,
      };
    case "search-empty":
      return {
        ...state,
        results: [],
        loading: false,
        searched: false,
        error: null,
        remoteNotice: null,
        generation: state.generation + 1,
      };
    case "search-start":
      if (action.generation !== state.generation) return state;
      return { ...state, loading: true, searched: true };
    case "search-result":
      if (action.generation !== state.generation) return state;
      return {
        ...state,
        results: action.results,
        loading: false,
        error: null,
        remoteNotice: action.remoteNotice,
      };
    case "search-error":
      if (action.generation !== state.generation) return state;
      return { ...state, results: [], loading: false, error: action.error };
    case "remote-start":
      return { ...state, remoteLoadingTarget: action.target, remoteNotice: null, error: null };
    case "remote-result":
      return {
        ...state,
        results: mergeResults([...state.results, ...action.results]).slice(0, 48),
        remoteNotice: action.remoteNotice,
        remoteLoadingTarget: null,
      };
    case "remote-error":
      return { ...state, error: action.error, remoteLoadingTarget: null };
  }
}
