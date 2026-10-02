/**
 * Render the PlayerRelationshipsPage view for the player id relationships page route.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
"use client";
import { formatApiErrorMessage } from "@/lib/api-errors";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ErrorState, LoadingPanel } from "@/components/async-state";
import PlayerRelationshipsView from "@/components/player-relationships-view";
import { fetchPlayerRelationshipSummary, type PlayerRelationshipSummary } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

/**
 * Render the PlayerRelationshipsPage view for the player id relationships page route.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function PlayerRelationshipsPage() {
  const { t } = useLocalization();
  const params = useParams<{ id: string }>();
  const playerId = String(params.id ?? "");
  const [summary, setSummary] = useState<PlayerRelationshipSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    let active = true;
    setError(null);
    fetchPlayerRelationshipSummary(playerId, 50).then((value) => {
      if (active) setSummary(value);
    }).catch((cause) => {
      if (active) setError(formatApiErrorMessage(cause, t, t("common.relationships.loadFailed")));
    });
    return () => { active = false; };
  }, [playerId, t]);

  if (!summary && !error) return <LoadingPanel />;
  if (!summary) return <ErrorState title={t("common.relationships.loadFailed")} message={error ?? t("common.relationships.loadFailed")} />;

  return <PlayerRelationshipsView summary={summary} />;
}
