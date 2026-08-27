import { getInitialPlatforms } from "@/lib/server-platforms";
import PlatformsClient from "./platforms-client";

export const dynamic = "force-dynamic";

export default async function PlatformsPage() {
  const initialPlatforms = await getInitialPlatforms().catch((error) => {
    console.error("[stats/platforms] Server platform fetch failed; using browser fallback", error);
    return null;
  });

  return <PlatformsClient initialPlatforms={initialPlatforms} />;
}
