/**
 * Public evidence submission entry point (report flow).
 *
 * Wraps the client form in a Suspense boundary so `useSearchParams` can read
 * the `playerId` query param during static generation. After a successful
 * submission the client redirects back to the reported player's profile page.
 *
 * refs: endpoints: GET /players/search · endpoints: POST /cheaters/evidence
 */
import { Suspense } from "react";
import SubmitCheaterEvidencePage from "./submit-page-client";

export default function EvidenceSubmitPage() {
  return (
    <Suspense fallback={null}>
      <SubmitCheaterEvidencePage />
    </Suspense>
  );
}
