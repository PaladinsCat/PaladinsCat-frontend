/**
 * Define the stats activity page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { unstable_cache } from "next/cache";
import PlayerActivityPanel, { type PlayerActivityInitialData } from "@/components/player-activity-panel";

const getInitialActivityData = unstable_cache(
  async (): Promise<PlayerActivityInitialData> => {
    const apiBase = (
      process.env.NEXT_SERVER_API_URL
      || process.env.NEXT_PUBLIC_API_URL
      || "http://localhost:3304"
    ).replace(/\/+$/, "");

    const load = async <T,>(path: string): Promise<T | null> => {
      const response = await fetch(`${apiBase}${path}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      }).catch(() => null);
      return response?.ok ? response.json() as Promise<T> : null;
    };

    const [overview, presence, presenceHourly] = await Promise.all([
      load<PlayerActivityInitialData["overview"]>("/matches/overview?view=activity-v3"),
      load<PlayerActivityInitialData["presence"]>("/stats/presence?view=activity-v4"),
      load<PlayerActivityInitialData["presenceHourly"]>("/stats/presence/hourly?view=activity-v3"),
    ]);
    if (!overview?.hourly) throw new Error("activity overview unavailable");
    return { overview, presence, presenceHourly };
  },
  ["activity-page-initial-v1"],
  { revalidate: 60, tags: ["activity"] },
);

// Render the data-bearing activity page on the first response. The browser
// retains its minute refreshes, but a cold visitor no longer waits for JS
// hydration before the charts become visible.
/**
 * Selects request-fresh rendering for statistics data.
 * Returns: `Promise<React.JSX.Element>`
 */
export const dynamic = "force-dynamic";

/** Render player activity statistics, seeding the client view with server data when available. */
export default async function PlayerActivityPage() {
  const initialData = await getInitialActivityData().catch(() => null);
  return (
    <div className="pc-player-activity-page">
      <PlayerActivityPanel showStatements={false} initialData={initialData} />
    </div>
  );
}
