"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatLocalTime } from "@/lib/time-format";
import {
  cancelPlayerLinkVerification,
  fetchPlayerSearch,
  getPlayerLinkVerification,
  isApiErrorKey,
  startPlayerLinkVerification,
  unlinkPlayer,
  verifyPlayerLink,
  type AccountDetails,
  type PlayerLinkVerification,
  type PlayerSearchResult,
} from "@/lib/api-client";
import { LoadingIndicator } from "@/components/async-state";
import PlayerName from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";

type Props = {
  linkedPlayer: AccountDetails["linkedPlayer"];
  onChanged: () => Promise<void> | void;
};

export default function PlayerLinkCard({ linkedPlayer, onChanged }: Props) {
  const { t , formatTime} = useLocalization();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [verification, setVerification] = useState<PlayerLinkVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const query = searchQuery.trim();
      if (query.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const results = await fetchPlayerSearch(query);
        if (active) setSearchResults(results);
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [searchQuery]);

  useEffect(() => {
    if (linkedPlayer) return;
    getPlayerLinkVerification().then(setVerification).catch(() => setVerification(null));
  }, [linkedPlayer]);

  const startVerification = useCallback(async (result: PlayerSearchResult) => {
    setLinking(true); setError(null); setSuccess(null);
    try {
      const next = await startPlayerLinkVerification(Number(result.id));
      setVerification(next); setSearchResults([]); setSearchQuery("");
      setSuccess(t("generated.players.verificationPinGeneratedForValue1", { value1: result.name }));
    } catch (err) { setError(err instanceof Error ? err.message : t("generated.account.linkPinFailed")); }
    finally { setLinking(false); }
  }, []);

  const verify = useCallback(async () => {
    setLinking(true); setError(null); setSuccess(null);
    try {
      const result = await verifyPlayerLink();
      setVerification(null); setSuccess(t("generated.players.linkedToValue1", { value1: result.player.name }));
      await onChanged();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("generated.account.linkVerifyFailed");
      setError(isApiErrorKey(message) ? t(message) : message);
    }
    finally { setLinking(false); }
  }, [onChanged]);

  const unlink = useCallback(async () => {
    setLinking(true); setError(null); setSuccess(null);
    try { await unlinkPlayer(); setSuccess(t("generated.players.playerLinkRemoved")); await onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : t("generated.account.unlinkFailed")); }
    finally { setLinking(false); }
  }, [onChanged]);

  const cancel = useCallback(async () => {
    try { await cancelPlayerLinkVerification(); setVerification(null); }
    catch (err) { setError(err instanceof Error ? err.message : t("generated.account.cancelVerifyFailed")); }
  }, []);

  return <section className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
    <h2 className="text-lg font-semibold text-pc-text mb-2">{t("generated.players.linkPaladinsAccount")}</h2>
    <p className="text-pc-text-secondary text-sm mb-4">{t("generated.players.linkYourPaladinsInGameAccountToYourPaladinscatProfile")}</p>
    {error && <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400">{error}</div>}
    {success && <div className="mb-4 rounded-lg border border-emerald-700/50 bg-emerald-900/30 p-3 text-sm text-emerald-400">{success}</div>}
    {linkedPlayer ? <div>
      <div className="mb-4 rounded-lg border border-pc-border bg-pc-bg-secondary p-4"><div className="mb-2 flex items-center justify-between"><span className="text-sm text-pc-text-secondary">{t("generated.players.linkedPlayer")}</span><span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-400">{t("generated.players.connected")}</span></div><Link href={`/players/${linkedPlayer.id}`} className="mb-1 block text-lg font-semibold text-pc-text hover:text-pc-accent"><PlayerName playerId={linkedPlayer.id}>{linkedPlayer.name}</PlayerName></Link>{linkedPlayer.platform_name && <div className="text-sm text-pc-text-secondary">{linkedPlayer.platform_name}</div>}</div>
      <button onClick={unlink} disabled={linking} className="rounded-lg border border-red-700/50 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50">{t("generated.players.unlinkPlayer")}</button><Link href={`/players/${linkedPlayer.id}`} className="ml-3 text-sm text-pc-accent hover:underline">{t("generated.players.openPlayerProfile")}</Link>
    </div> : verification ? <div className="rounded-lg border border-pc-border bg-pc-bg-secondary p-4"><div className="font-medium text-pc-text">{t("generated.players.verify")}{" "}<PlayerName playerId={verification.player.id}>{verification.player.name}</PlayerName></div><ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-pc-text-secondary"><li>{t("generated.players.inPaladinsRenameAnySavedLoadoutToThisSixDigit")}</li><li>{t("generated.players.saveTheLoadoutThenReturnHereAndVerifyIt")}</li></ol><div className="mt-3 rounded-lg border border-pc-accent/40 bg-pc-bg px-4 py-3 text-center font-mono text-lg font-bold tracking-wider text-pc-accent">{verification.code}</div><div className="mt-2 text-xs text-pc-text-muted">{t("generated.players.expires")}{" "}{formatTime(verification.expiresAt)}</div><div className="mt-4 flex gap-2"><button onClick={verify} disabled={linking} className="flex-1 rounded-lg bg-pc-accent px-3 py-2 text-sm font-semibold text-pc-bg hover:bg-pc-accent-secondary disabled:opacity-50">{linking ? <LoadingIndicator className="gap-2" /> : t("generated.players.verifyLink")}</button><button onClick={cancel} disabled={linking} className="rounded-lg border border-pc-border px-3 py-2 text-sm text-pc-text-secondary hover:bg-pc-bg-elevated disabled:opacity-50">{t("generated.players.chooseAnother")}</button></div></div> : <div>
      <ol className="mb-4 grid gap-2 text-sm text-pc-text-secondary sm:grid-cols-3"><li className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2"><span className="font-semibold text-pc-accent">1.</span> {t("generated.players.searchByYourInGameNameOrPlayerId")}</li><li className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2"><span className="font-semibold text-pc-accent">2.</span> {t("generated.players.selectThePlayerProfileYouOwn")}</li><li className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2"><span className="font-semibold text-pc-accent">3.</span> {t("generated.players.proveOwnershipWithATemporaryLoadoutName")}</li></ol>
      <div className="relative mb-4"><input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t("generated.players.searchByInGameNameOrPlayerId")} className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50" />{searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pc-text-muted"><LoadingIndicator className="gap-2" /></span>}</div>
      {searchResults.length > 0 && <div className="max-h-60 overflow-y-auto rounded-lg border border-pc-border bg-pc-bg-secondary">{searchResults.map((result) => <button key={result.id} onClick={() => startVerification(result)} disabled={linking} className="flex w-full items-center justify-between border-b border-pc-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-pc-bg-elevated disabled:opacity-50"><div><div className="font-medium text-pc-text"><PlayerName playerId={result.id}>{result.name}</PlayerName></div>{result.platform && <div className="text-sm text-pc-text-secondary">{result.platform}</div>}</div>{result.kbmTier && <span className="text-sm text-pc-accent">{result.kbmTier}</span>}</button>)}</div>}
      {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && <div className="py-2 text-center text-sm text-pc-text-muted">{t("generated.players.noPlayersFound")}</div>}
    </div>}
  </section>;
}
