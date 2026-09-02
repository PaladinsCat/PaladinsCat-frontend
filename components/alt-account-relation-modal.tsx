/** alt-account-relation-modal component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Trash2, UserRoundCheck, X } from "lucide-react";
import {
  clearMyAltAccountRelation,
  fetchMyAltAccountRelations,
  fetchPlayerSearch,
  voteAltAccountRelation,
  type MyAltAccountRelation,
  type PlayerSearchResult,
} from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

type OtherRole = "main" | "alt";

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function AltAccountRelationModal({
  playerId,
  playerName,
  onClose,
  onSuccess,
}: {
  playerId: string | number;
  playerName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLocalization();
  const overlayRef = useRef<HTMLDivElement>(null);
  const currentPlayerId = String(playerId);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [selected, setSelected] = useState<PlayerSearchResult | null>(null);
  const [otherRole, setOtherRole] = useState<OtherRole | null>(null);
  const [relations, setRelations] = useState<MyAltAccountRelation[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingRelations, setLoadingRelations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clearingId, setClearingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRelations = async () => {
    setLoadingRelations(true);
    try {
      setRelations(await fetchMyAltAccountRelations(playerId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("moderation.altRelationLoadFailed"));
    } finally {
      setLoadingRelations(false);
    }
  };

  useEffect(() => {
    void loadRelations();
  }, [playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2 || selected?.name === normalized) {
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      fetchPlayerSearch(normalized)
        .then((rows) => {
          if (active) setResults(rows.filter((row) => String(row.id) !== currentPlayerId).slice(0, 8));
        })
        .catch(() => { if (active) setResults([]); })
        .finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [currentPlayerId, query, selected?.name]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === t("generated.components.altAccountRelationModal.escape")) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const selectedRelation = useMemo(() => {
    if (!selected) return null;
    return relations.find((relation) => {
      const ids = [relation.mainPlayerId, relation.altPlayerId];
      return ids.includes(currentPlayerId) && ids.includes(String(selected.id));
    }) ?? null;
  }, [currentPlayerId, relations, selected]);

  const selectPlayer = (player: PlayerSearchResult) => {
    setSelected(player);
    setQuery(player.name);
    setResults([]);
    setError(null);
    const existing = relations.find((relation) => {
      const ids = [relation.mainPlayerId, relation.altPlayerId];
      return ids.includes(currentPlayerId) && ids.includes(String(player.id));
    });
    if (existing) setOtherRole(existing.mainPlayerId === String(player.id) ? "main" : "alt");
    else setOtherRole(null);
  };

  const submit = async () => {
    if (!selected || !otherRole) {
      setError(t("moderation.altRelationSelectionRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await voteAltAccountRelation(playerId, selected.id, otherRole);
      await loadRelations();
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("moderation.altRelationSaveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const clearRelation = async (relation: MyAltAccountRelation) => {
    const otherPlayerId = relation.mainPlayerId === currentPlayerId ? relation.altPlayerId : relation.mainPlayerId;
    setClearingId(relation.id);
    setError(null);
    try {
      await clearMyAltAccountRelation(playerId, otherPlayerId);
      await loadRelations();
      if (selected && String(selected.id) === otherPlayerId) {
        setSelected(null);
        setQuery("");
        setOtherRole(null);
      }
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("moderation.altRelationClearFailed"));
    } finally {
      setClearingId(null);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(event) => { if (event.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center pc-glass-dark"
    >
      <section className="max-h-[min(90vh,48rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-fuchsia-400/25 bg-pc-bg-elevated p-5 shadow-lg">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-pc-text">{t("moderation.altRelationTitle")}</h2>
            <p className="mt-1 text-sm leading-6 text-pc-text-secondary">{t("moderation.altRelationDescription")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-pc-text-muted hover:bg-pc-bg-secondary hover:text-pc-text" aria-label={t("generated.components.close")}>
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="mt-5 space-y-2">
          <label htmlFor="alt-account-search" className="text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{t("moderation.searchLinkedAccount")}</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pc-text-muted" />
            <input
              id="alt-account-search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setSelected(null); setOtherRole(null); }}
              placeholder={t("moderation.searchLinkedAccountPlaceholder")}
              className="w-full rounded-xl border border-pc-border bg-pc-bg-secondary py-2.5 pl-9 pr-3 text-sm text-pc-text outline-none placeholder:text-pc-text-muted focus:border-fuchsia-400/60"
              autoFocus
            />
          </div>
          {(searching || results.length > 0) && !selected && (
            <div className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-secondary">
              {searching && <div className="px-3 py-2 text-xs text-pc-text-muted">{t("generated.players.loading")}</div>}
              {!searching && results.map((player) => (
                <button key={player.id} type="button" onClick={() => selectPlayer(player)} className="flex w-full items-center justify-between gap-3 border-b border-pc-border/60 px-3 py-2.5 text-left last:border-b-0 hover:bg-pc-bg">
                  <span className="min-w-0 truncate text-sm font-semibold text-pc-text">{player.name}</span>
                  <span className="shrink-0 text-xs text-pc-text-muted">{player.region} · {player.platform}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-200">
              <UserRoundCheck aria-hidden="true" className="h-5 w-5" />
              {selected.name}
              {selectedRelation && <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-2 py-0.5 text-xs uppercase tracking-wider">{t("moderation.existingVote")}</span>}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{t("moderation.chooseRelationshipDirection")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setOtherRole("main")} className={`rounded-xl border p-3 text-left transition-colors ${otherRole === "main" ? "border-fuchsia-400/60 bg-fuchsia-400/15" : "border-pc-border bg-pc-bg-secondary hover:border-fuchsia-400/35"}`}>
                <span className="block text-sm font-bold text-pc-text">{t("moderation.selectedIsMain")}</span>
                <span className="mt-1 block text-xs leading-5 text-pc-text-muted">{t("moderation.currentBecomesAlt", { value1: playerName })}</span>
              </button>
              <button type="button" onClick={() => setOtherRole("alt")} className={`rounded-xl border p-3 text-left transition-colors ${otherRole === "alt" ? "border-fuchsia-400/60 bg-fuchsia-400/15" : "border-pc-border bg-pc-bg-secondary hover:border-fuchsia-400/35"}`}>
                <span className="block text-sm font-bold text-pc-text">{t("moderation.selectedIsAlt")}</span>
                <span className="mt-1 block text-xs leading-5 text-pc-text-muted">{t("moderation.currentRemainsMain", { value1: playerName })}</span>
              </button>
            </div>
            <button type="button" onClick={() => void submit()} disabled={submitting || !otherRole} className="w-full rounded-xl bg-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-45">
              {submitting ? t("generated.components.submitting") : selectedRelation ? t("moderation.updateRelationshipVote") : t("moderation.saveRelationshipVote")}
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-pc-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-pc-text-muted">{t("moderation.yourAltRelationshipVotes")}</h3>
          {loadingRelations ? (
            <p className="mt-3 text-sm text-pc-text-muted">{t("generated.players.loading")}</p>
          ) : relations.length === 0 ? (
            <p className="mt-3 text-sm text-pc-text-muted">{t("moderation.noAltRelationshipVotes")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {relations.map((relation) => (
                <div key={relation.id} className="flex items-center justify-between gap-3 rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5">
                  <div className="min-w-0 text-sm">
                    <span className="font-semibold text-pc-text">{relation.mainPlayerName}</span>
                    <span className="mx-2 text-fuchsia-300">→</span>
                    <span className="font-semibold text-pc-text">{relation.altPlayerName}</span>
                  </div>
                  <button type="button" disabled={clearingId === relation.id} onClick={() => void clearRelation(relation)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-red-400/20 px-2 py-1.5 text-xs font-semibold text-red-300 hover:border-red-400/45 hover:bg-red-400/10 disabled:opacity-45">
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    {t("moderation.clearYourVote")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
      </section>
    </div>
  );
}
