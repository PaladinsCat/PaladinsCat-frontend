import { unstable_cache } from "next/cache";
import {
  mapPlayersOverviewResponse,
  type PlayersOverview,
} from "@/lib/api-client";
import PlayersPageClient from "./players-page-client";


// User-facing error keys — resolved at the UI layer via t()
export const PLAYERS_ERROR_KEYS = {
  overviewConfigUnavailable: "generated.players.overviewConfigUnavailable",
  overviewUnavailable: "generated.players.overviewUnavailable",
} as const;

const getCachedPlayersOverview = unstable_cache(
  async (): Promise<PlayersOverview> => {
    const apiBase = (
      process.env.NEXT_SERVER_API_URL
      || process.env.NEXT_PUBLIC_API_URL
      || "http://localhost:3304"
    ).replace(/\/+$/, "");

    if (apiBase.startsWith("/")) {
      throw new Error(PLAYERS_ERROR_KEYS.overviewConfigUnavailable);
    }

    const response = await fetch(`${apiBase}/players/overview`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(PLAYERS_ERROR_KEYS.overviewUnavailable);
    }

    return mapPlayersOverviewResponse(await response.json());
  },
  ["players-overview-v2"],
  {
    revalidate: 300,
    tags: ["players-overview"],
  },
);

// Render HTML per request, but resolve the expensive data from Next's shared
// five-minute server cache. This avoids build-time API access and removes the
// client hydration fetch that previously caused the visible loading delay.
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  let initialOverview: PlayersOverview | null = null;
  try {
    initialOverview = await getCachedPlayersOverview();
  } catch (error) {
    console.error("[players] Server overview fetch failed; using browser fallback", error);
  }

  return <PlayersPageClient initialOverview={initialOverview} />;
}
