/**
 * Provide the server-loaded ranked-player array, or null when unavailable, to descendant components through React context.
 * refs: none
 */
"use client";

import { createContext, useContext } from "react";
import type { RankedPlayer } from "@/lib/api-client";

const InitialLeaderboardContext = createContext<RankedPlayer[] | null>(null);

/**
 * Provide the server-loaded ranked-player array, or null when unavailable, to descendant components through React context.
 * I/O types: `{ players, children, }: { players: RankedPlayer[] | null; children: React.ReactNode; } -> JSX.Element`.
 * refs: none
 */
export function InitialLeaderboardProvider({
  players,
  children,
}: {
  players: RankedPlayer[] | null;
  children: React.ReactNode;
}) {
  return <InitialLeaderboardContext.Provider value={players}>{children}</InitialLeaderboardContext.Provider>;
}

/**
 * Read the server-loaded ranked-player context; return null when no initial leaderboard was provided.
 * I/O types: `none -> RankedPlayer[] | null`.
 * refs: none
 */
export function useInitialLeaderboard(): RankedPlayer[] | null {
  return useContext(InitialLeaderboardContext);
}
