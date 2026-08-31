/**
 * Define the player route surface for id page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import { fetchServerJson } from "@/lib/server-api";
import PlayerProfileClient, { type PlayerResponse } from "./player-profile-client";

/**
 * Select dynamic rendering for the player id page route.
 * Returns the framework rendering mode constant used by this route.
 */
export const dynamic = "force-dynamic";

/**
 * Render the PlayerProfilePage view for the player id page route.
 * Returns the React tree for the route and its declared inputs.
 */
export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialResponse: PlayerResponse | null = null;

  try {
    initialResponse = await fetchServerJson<PlayerResponse>(
      `/players/${encodeURIComponent(id)}`,
      { timeoutMs: 8_000 },
    );
  } catch (error) {
    console.error(`[players/${id}] Server profile fetch failed; using browser fallback`, error);
  }

  return (
    <PlayerProfileClient
      key={id}
      id={id}
      initialResponse={initialResponse}
    />
  );
}
