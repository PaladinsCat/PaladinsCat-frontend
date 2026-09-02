/**
 * Define the player route surface for profile data and rendering.
 * The route delegates typed server loading to the shared profile boundary.
 */
import { getServerPlayerProfile } from "@/lib/player-profile-server";
import type { PlayerResponse } from "@/lib/player-profile-types";
import PlayerProfileClient from "./player-profile-client";

/**
 * Select dynamic rendering for the player id page route.
 * Returns the framework rendering mode constant used by this route.
 */
export const dynamic = "force-dynamic";

/**
 * Render the PlayerProfilePage view for the player id page route.
 * Returns: `Promise<React.JSX.Element>`
 */
export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialResponse: PlayerResponse | null = null;

  try {
    initialResponse = await getServerPlayerProfile(id);
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
