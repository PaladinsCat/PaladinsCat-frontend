/** Provides lobby-tier filter state and persistence for page contexts.
 * The module owns the existing URL, context, or locale-message boundary.
 */
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LOBBY_TIER_FILTERS,
  LOBBY_TIER_STORAGE_KEY,
  isLobbyTierFilter,
  type LobbyTierDefinition,
  type LobbyTierFilter,
} from "./lobby-tier";

type LobbyTierContextValue = {
  filter: LobbyTierFilter;
  definition: LobbyTierDefinition;
  ready: boolean;
  setFilter: (filter: LobbyTierFilter) => void;
};

const LobbyTierContext = createContext<LobbyTierContextValue | null>(null);

/** Apply useLobbyTier to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 */
export function useLobbyTier(): LobbyTierContextValue {
  const context = useContext(LobbyTierContext);
  if (!context) throw new Error("useLobbyTier must be used within LobbyTierProvider");
  return context;
}

/** Apply LobbyTierProvider to lobby-tier or localization inputs.
 * Contract: returns the normalized route, context state, or message value while preserving existing browser behavior.
 * Returns: `React.JSX.Element`
 */
export function LobbyTierProvider({ children }: { children: ReactNode }) {
  const [filter, setFilterState] = useState<LobbyTierFilter>("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOBBY_TIER_STORAGE_KEY);
    if (isLobbyTierFilter(stored)) setFilterState(stored);
    setReady(true);
  }, []);

  const setFilter = useCallback((next: LobbyTierFilter) => {
    setFilterState(next);
    window.localStorage.setItem(LOBBY_TIER_STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({
    filter,
    definition: LOBBY_TIER_FILTERS[filter],
    ready,
    setFilter,
  }), [filter, ready, setFilter]);

  return <LobbyTierContext.Provider value={value}>{children}</LobbyTierContext.Provider>;
}
