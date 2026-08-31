/** Fetch validated player profiles through the server-only API boundary. */
import "server-only";

import { cache } from "react";
import { fetchServerJson } from "@/lib/server-api";
import { isPublicPlayerId } from "@/lib/seo";
import type { PlayerResponse } from "@/lib/player-profile-types";

/** Resolve a public player profile while deduplicating requests within a render. */
export const getServerPlayerProfile = cache(async (id: string): Promise<PlayerResponse> => {
  if (!isPublicPlayerId(id)) throw new Error("Invalid public player ID");
  return fetchServerJson<PlayerResponse>(`/players/${encodeURIComponent(id)}`, { timeoutMs: 8_000 });
});
