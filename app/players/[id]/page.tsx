import { fetchServerJson } from "@/lib/server-api";
import PlayerProfileClient, { type PlayerResponse } from "./player-profile-client";

export const dynamic = "force-dynamic";

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
