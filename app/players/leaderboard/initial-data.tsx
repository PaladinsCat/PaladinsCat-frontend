"use client";

import { createContext, useContext } from "react";
import type { RankedPlayer } from "@/lib/api-client";

const InitialLeaderboardContext = createContext<RankedPlayer[] | null>(null);

export function InitialLeaderboardProvider({
  players,
  children,
}: {
  players: RankedPlayer[] | null;
  children: React.ReactNode;
}) {
  return <InitialLeaderboardContext.Provider value={players}>{children}</InitialLeaderboardContext.Provider>;
}

export function useInitialLeaderboard(): RankedPlayer[] | null {
  return useContext(InitialLeaderboardContext);
}
