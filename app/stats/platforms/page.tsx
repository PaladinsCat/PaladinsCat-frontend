/**
 * Define the stats platforms page route boundary.
 * Coordinates this module's route data flow and rendered output.
 */
import { getInitialPlatforms } from "@/lib/server-platforms";
import PlatformsClient from "./platforms-client";

/**
 * Selects request-fresh rendering for statistics data.
 * Returns: `Promise<React.JSX.Element>`
 */
export const dynamic = "force-dynamic";

/** Render platform statistics, falling back to the browser when server loading fails. */
export default async function PlatformsPage() {
  const initialPlatforms = await getInitialPlatforms().catch((error) => {
    console.error("[stats/platforms] Server platform fetch failed; using browser fallback", error);
    return null;
  });

  return <PlatformsClient initialPlatforms={initialPlatforms} />;
}
