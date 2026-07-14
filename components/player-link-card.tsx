"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatLocalTime } from "@/lib/time-format";
import {
  cancelPlayerLinkVerification,
  fetchPlayerSearch,
  getPlayerLinkVerification,
  startPlayerLinkVerification,
  unlinkPlayer,
  verifyPlayerLink,
  type AccountDetails,
  type PlayerLinkVerification,
  type PlayerSearchResult,
} from "@/lib/api-client";
import { LoadingIndicator } from "@/components/async-state";
import PlayerName from "@/components/player-name";

type Props = {
  linkedPlayer: AccountDetails["linkedPlayer"];
  onChanged: () => Promise<void> | void;
};

export default function PlayerLinkCard({ linkedPlayer, onChanged }: Props) {
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
      setSuccess(`Verification PIN generated for ${result.name}.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to generate verification PIN"); }
    finally { setLinking(false); }
  }, []);

  const verify = useCallback(async () => {
    setLinking(true); setError(null); setSuccess(null);
    try {
      const result = await verifyPlayerLink();
      setVerification(null); setSuccess(`Linked to ${result.player.name}.`);
      await onChanged();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to verify player ownership"); }
    finally { setLinking(false); }
  }, [onChanged]);

  const unlink = useCallback(async () => {
    setLinking(true); setError(null); setSuccess(null);
    try { await unlinkPlayer(); setSuccess("Player link removed."); await onChanged(); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to unlink player"); }
    finally { setLinking(false); }
  }, [onChanged]);

  const cancel = useCallback(async () => {
    try { await cancelPlayerLinkVerification(); setVerification(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to cancel verification"); }
  }, []);

  return <section className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
    <h2 className="text-lg font-semibold text-pc-text mb-2">Link Paladins Account</h2>
    <p className="text-pc-text-secondary text-sm mb-4">Link your Paladins in-game account to your PaladinsCat profile. This verifies your account and allows premium features.</p>
    {error && <div className="mb-4 rounded-lg border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400">{error}</div>}
    {success && <div className="mb-4 rounded-lg border border-emerald-700/50 bg-emerald-900/30 p-3 text-sm text-emerald-400">{success}</div>}
    {linkedPlayer ? <div>
      <div className="mb-4 rounded-lg border border-pc-border bg-pc-bg-secondary p-4"><div className="mb-2 flex items-center justify-between"><span className="text-sm text-pc-text-secondary">Linked Player</span><span className="inline-flex items-center rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-400">Connected</span></div><Link href={`/players/${linkedPlayer.id}`} className="mb-1 block text-lg font-semibold text-pc-text hover:text-pc-accent"><PlayerName playerId={linkedPlayer.id}>{linkedPlayer.name}</PlayerName></Link>{linkedPlayer.platform_name && <div className="text-sm text-pc-text-secondary">{linkedPlayer.platform_name}</div>}</div>
      <button onClick={unlink} disabled={linking} className="rounded-lg border border-red-700/50 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-900/30 disabled:opacity-50">Unlink Player</button><Link href={`/players/${linkedPlayer.id}`} className="ml-3 text-sm text-pc-accent hover:underline">Open player profile →</Link>
    </div> : verification ? <div className="rounded-lg border border-pc-border bg-pc-bg-secondary p-4"><div className="font-medium text-pc-text">Verify <PlayerName playerId={verification.player.id}>{verification.player.name}</PlayerName></div><ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-pc-text-secondary"><li>In Paladins, rename any saved loadout to this six-digit PIN.</li><li>Save the loadout, then return here and verify it.</li></ol><div className="mt-3 rounded-lg border border-pc-accent/40 bg-pc-bg px-4 py-3 text-center font-mono text-lg font-bold tracking-wider text-pc-accent">{verification.code}</div><div className="mt-2 text-xs text-pc-text-muted">Expires {formatLocalTime(verification.expiresAt)}</div><div className="mt-4 flex gap-2"><button onClick={verify} disabled={linking} className="flex-1 rounded-lg bg-pc-accent px-3 py-2 text-sm font-semibold text-pc-bg hover:bg-pc-accent-secondary disabled:opacity-50">{linking ? <LoadingIndicator className="gap-2" /> : "Verify & Link"}</button><button onClick={cancel} disabled={linking} className="rounded-lg border border-pc-border px-3 py-2 text-sm text-pc-text-secondary hover:bg-pc-bg-elevated disabled:opacity-50">Choose another</button></div></div> : <div>
      <ol className="mb-4 grid gap-2 text-sm text-pc-text-secondary sm:grid-cols-3"><li className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2"><span className="font-semibold text-pc-accent">1.</span> Search by your in-game name or player ID.</li><li className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2"><span className="font-semibold text-pc-accent">2.</span> Select the player profile you own.</li><li className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2"><span className="font-semibold text-pc-accent">3.</span> Prove ownership with a temporary loadout name.</li></ol>
      <div className="relative mb-4"><input type="text" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by in-game name or player ID..." className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50" />{searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pc-text-muted"><LoadingIndicator className="gap-2" /></span>}</div>
      {searchResults.length > 0 && <div className="max-h-60 overflow-y-auto rounded-lg border border-pc-border bg-pc-bg-secondary">{searchResults.map((result) => <button key={result.id} onClick={() => startVerification(result)} disabled={linking} className="flex w-full items-center justify-between border-b border-pc-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-pc-bg-elevated disabled:opacity-50"><div><div className="font-medium text-pc-text"><PlayerName playerId={result.id}>{result.name}</PlayerName></div>{result.platform && <div className="text-sm text-pc-text-secondary">{result.platform}</div>}</div>{result.kbmTier && <span className="text-sm text-pc-accent">{result.kbmTier}</span>}</button>)}</div>}
      {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && <div className="py-2 text-center text-sm text-pc-text-muted">No players found</div>}
    </div>}
  </section>;
}
