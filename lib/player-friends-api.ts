/** Fetch persisted player friends without creating a separate browser freshness cache.
 * refs: endpoints: GET /players/{id}/friends
 */

import { fetchJson } from "./api-client";

/**
 * Describe a friend snapshot and provider freshness. I/O: JSON object -> PlayerFriendsResponse.
 * refs: endpoints: GET /players/{id}/friends
 */
export type PlayerFriendsResponse = {
  friends: Array<{ id: string; name: string; platform: string | null }>;
  total: number;
  status: "ready" | "private" | "unavailable";
  freshness: { ttl_seconds: number; refreshed_at: string | null; expires_at: string | null; expired: boolean; remaining_seconds: number };
  refreshed: boolean;
  refresh_error: string | null;
};

/**
 * Load a player's saved friends with server-owned refresh policy.
 * I/O: id: string, signal?: AbortSignal -> Promise<PlayerFriendsResponse>; rejects failed HTTP responses.
 * refs: endpoints: GET /players/{id}/friends
 * I/O types: `id: string; signal?: AbortSignal -> Promise<PlayerFriendsResponse>`.
 */
export async function fetchPlayerFriends(id: string, signal?: AbortSignal): Promise<PlayerFriendsResponse> {
  return fetchJson<PlayerFriendsResponse>(`/players/${encodeURIComponent(id)}/friends`, { signal, cache: "no-store", retries: 0, timeoutMs: 30_000 });
}
