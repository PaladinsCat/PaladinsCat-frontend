/** DeploymentUpdateBanner component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect, useState } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { useLocalization, type TranslationKey } from "@/lib/localization-context";

type DeploymentPhase = "idle" | "announced" | "draining" | "switching" | "warming" | "complete" | "failed";

interface DeploymentState {
  id: string;
  phase: DeploymentPhase;
  message: string | null;
  startedAt: string | null;
  updatedAt: string;
  expiresAt: string | null;
}

const POLL_MS = 3_000;
const PENDING_KEY = "paladinscat:deployment:pending";
const RELOADED_KEY = "paladinscat:deployment:last-reloaded";
const BLOCKING_PHASES = new Set<DeploymentPhase>(["draining", "switching", "warming"]);

let nativeFetch: typeof window.fetch | null = null;
let clientRequestsBlocked = false;

function isBlockedApiRequest(input: RequestInfo | URL): boolean {
  const raw = input instanceof Request ? input.url : String(input);
  const url = new URL(raw, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === "/api/deployment/status") return false;
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/_pc/");
}

function installFetchGate(): void {
  if (nativeFetch) return;
  nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (clientRequestsBlocked && isBlockedApiRequest(input)) {
      return new Response(JSON.stringify({
        error: {
          code: "DEPLOYMENT_DRAIN",
          message: String("DEPLOYMENT_DRAIN"),
        },
      }), {
        status: 503,
        headers: { "Content-Type": "application/json", "Retry-After": "5" },
      });
    }
    return nativeFetch!(input, init);
  };
}

function deploymentFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return (nativeFetch || window.fetch.bind(window))(input, init);
}

const PHASE_COPY: Partial<Record<DeploymentPhase, { titleKey: TranslationKey; bodyKey: TranslationKey }>> = {
  announced: { titleKey: "status.updateQueued", bodyKey: "status.updateQueuedMessage" },
  draining: { titleKey: "status.updateDraining", bodyKey: "status.updateDrainingMessage" },
  switching: { titleKey: "status.updateSwitching", bodyKey: "status.updateSwitchingMessage" },
  warming: { titleKey: "status.updateWarming", bodyKey: "status.updateWarmingMessage" },
  failed: { titleKey: "status.updateFailed", bodyKey: "status.updateFailedMessage" },
};

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function DeploymentUpdateBanner() {
  const { t } = useLocalization();
  const [state, setState] = useState<DeploymentState | null>(null);

  useEffect(() => {
    installFetchGate();
    let cancelled = false;

    async function poll() {
      try {
        const response = await deploymentFetch("/api/deployment/status", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const next = await response.json() as DeploymentState;
        if (cancelled) return;

        const blocking = BLOCKING_PHASES.has(next.phase);
        clientRequestsBlocked = blocking;
        setState(next);

        if (next.id && (next.phase === "announced" || blocking)) {
          window.localStorage.setItem(PENDING_KEY, next.id);
        }

        if (next.phase === "complete" || next.phase === "idle") {
          const pendingId = window.localStorage.getItem(PENDING_KEY);
          const reloadedId = window.localStorage.getItem(RELOADED_KEY);
          const completedId = next.phase === "complete" ? next.id : pendingId;
          if (completedId && pendingId === completedId && reloadedId !== completedId) {
            window.localStorage.setItem(RELOADED_KEY, completedId);
            window.localStorage.removeItem(PENDING_KEY);
            window.location.reload();
            return;
          }
        }

        if (next.phase === "failed" || next.phase === "idle") {
          clientRequestsBlocked = false;
          window.localStorage.removeItem(PENDING_KEY);
        }
      } catch {
        // Keep the last known blocking state while the frontend/backend swaps.
        // The next poll will reconcile it once the new containers are ready.
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!state || state.phase === "idle" || state.phase === "complete") return null;
  const copy = PHASE_COPY[state.phase];
  if (!copy) return null;
  const blocking = BLOCKING_PHASES.has(state.phase);

  return (
    <section
      aria-live="assertive"
      className={`sticky top-16 z-40 border-b backdrop-blur-[30px] ${
        state.phase === "failed"
          ? "border-red-400/40 bg-red-950/90 text-red-50"
          : "border-amber-300/40 bg-amber-950/90 text-amber-50"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          {blocking ? (
            <RefreshCw className="mt-0.5 h-5 w-5 flex-none animate-spin" aria-hidden="true" />
          ) : (
            <Clock className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold uppercase tracking-wide">{t(copy.titleKey)}</div>
            <p className="mt-0.5 text-sm leading-5 text-current/90">
              {state.message || t(copy.bodyKey)}
            </p>
          </div>
        </div>
        {blocking && (
          <span className="w-fit rounded border border-current/20 bg-black/20 px-2.5 py-1 text-xs font-medium">
            {t("status.requestsPaused")}
          </span>
        )}
      </div>
    </section>
  );
}
