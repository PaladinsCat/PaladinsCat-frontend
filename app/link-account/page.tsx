/**
 * Render the link-account page and its data composition.
 * Assemble the page content exposed at this location.
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getAccountDetails, type AccountDetails } from "@/lib/api-client";
import { LoadingPanel } from "@/components/async-state";
import PlayerLinkCard from "@/components/player-link-card";

/**
 * Render the LinkAccountPage view for link-account page.
 * Return the React tree for the declared inputs and page data.
 * Returns: `React.JSX.Element`
 */
export default function LinkAccountPage() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetails | null>(null);

  const loadAccount = useCallback(async () => {
    const next = await getAccountDetails();
    setAccount(next);
    return next;
  }, []);

  useEffect(() => {
    if (!user) { router.replace("/auth/login"); return; }
    loadAccount().then((next) => {
      if (next.linkedPlayer) router.replace(`/players/${next.linkedPlayer.id}`);
    }).catch(() => router.replace("/account"));
  }, [loadAccount, router, user]);

  if (!account || account.linkedPlayer) return <LoadingPanel className="min-h-[50vh]" />;

  return <div className="mx-auto max-w-2xl"><PlayerLinkCard linkedPlayer={null} onChanged={async () => { const next = await loadAccount(); await refresh(); if (next.linkedPlayer) router.replace(`/players/${next.linkedPlayer.id}`); }} /></div>;
}
