/**
 * Render the matches id page and its data composition.
 * Assemble the page content exposed at this location.
 */
import { notFound } from "next/navigation";
import { deriveMissingMatchCreditRates, type MatchDetailWithBans } from "@/lib/api-client";
import { fetchServerJson } from "@/lib/server-api";
import MatchDetailClient from "./match-detail-client";

type MatchResponse = {
  matches?: MatchDetailWithBans[];
  storageStatus?: MatchDetailWithBans["storageStatus"];
  storage_status?: MatchDetailWithBans["storage_status"];
  dataStatus?: MatchDetailWithBans["dataStatus"];
  dataHash?: string;
};

// Match documents are public but contain a request-specific path and may read
// hot or cold storage. Keep the response dynamic and never share it at the
// HTML layer; the backend owns the safe data cache for this read.
/**
 * Select dynamic rendering for matches id page.
 * Return the framework rendering mode constant used by this page.
 */
export const dynamic = "force-dynamic";

/**
 * Render the MatchDetailPage view for matches id page.
 * Return the React tree for the declared inputs and page data.
 * Returns: `Promise<React.JSX.Element>`
 */
export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number.parseInt(id, 10);
  if (!Number.isSafeInteger(matchId) || matchId <= 0) notFound();

  let initialMatch: MatchDetailWithBans | null = null;
  try {
    const raw = await fetchServerJson<MatchResponse>(`/matches/${matchId}`, {
      cache: "no-store",
      timeoutMs: 5_000,
    });
    const detail = raw.matches?.[0];
    if (detail) {
      initialMatch = deriveMissingMatchCreditRates({
        ...detail,
        storageStatus: detail.storageStatus ?? raw.storageStatus ?? raw.storage_status,
        dataStatus: detail.dataStatus ?? raw.dataStatus,
        dataHash: detail.dataHash ?? raw.dataHash,
      });
    }
  } catch (error) {
    // The client retains its retry/error path when the server-side read is
    // unavailable. A transient API failure must not turn the document into a
    // hard 500 response.
    console.error(`[matches/${matchId}] server detail fetch failed`, error);
  }

  return <MatchDetailClient initialMatch={initialMatch} />;
}
