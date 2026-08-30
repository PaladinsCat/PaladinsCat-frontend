import { getServerPlayerProfile } from "@/lib/player-profile-server";
import type { PlayerResponse } from "@/lib/player-profile-types";
import PlayerProfileClient from "./player-profile-client";

export const dynamic = "force-dynamic";

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
