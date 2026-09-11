/** Fetch validated player profiles through the server-only API boundary. · refs: none */
import "server-only";

import { cache } from "react";
import { fetchAccountServerJson } from "@/lib/server-api";
import { isPublicPlayerId } from "@/lib/seo";
import type { PlayerResponse } from "@/lib/player-profile-types";

/**
 * Resolve a public player profile while deduplicating requests within a render.
 * Reject invalid public player IDs; request the encoded player endpoint with an eight-second timeout and propagate request failures.
 * I/O types: `id: string -> Promise<PlayerResponse>`.
 * refs: endpoints: GET /players/{id}
 */
export const getServerPlayerProfile = cache(async (id: string): Promise<PlayerResponse> => {
  if (!isPublicPlayerId(id)) throw new Error("Invalid public player ID");
  return fetchAccountServerJson<PlayerResponse>(`/players/${encodeURIComponent(id)}`, { timeoutMs: 8_000 });
});
