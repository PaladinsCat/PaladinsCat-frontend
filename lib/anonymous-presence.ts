/** Presence scheduling only. Authenticated consent enforcement belongs to the account owner. */
export const PRESENCE_ENDPOINT = "/api/analytics/presence";
export const PULSE_INTERVAL_MS = 30_000;

export interface AnonymousPresence {
  status: "warming_up" | "suppressed" | "available" | "unavailable";
  estimated_active_pages: number | null;
  window_seconds: number;
  pulse_seconds: number;
}

const anonymousRequest: RequestInit = {
  credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store",
  mode: "same-origin", redirect: "error",
};

function maySend(): boolean {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (privacy.doNotTrack === "1" || privacy.globalPrivacyControl === true || document.visibilityState !== "visible") return false;
  // This check stays on the device; neither path nor category is transmitted.
  try {
    return !/^\/(auth|admin|account|settings|link-account)(\/|$)/i.test(decodeURIComponent(location.pathname));
  } catch { return false; }
}

/** One empty pulse per 30 seconds while visible. No arrival/departure events or retries. */
export function startAnonymousPresence(send: (signal: AbortSignal) => Promise<unknown>, hasConsent: () => boolean): () => void {
  let pending: AbortController | null = null;
  const pulse = () => {
    if (!hasConsent() || !maySend() || pending) return;
    const controller = new AbortController();
    pending = controller;
    const timeout = window.setTimeout(() => controller.abort(), 5_000);
    void send(controller.signal)
      .catch(() => {})
      .finally(() => {
        window.clearTimeout(timeout);
        if (pending === controller) pending = null;
      });
  };
  const stopHidden = () => { if (!hasConsent() || !maySend()) pending?.abort(); };
  const timer = window.setInterval(pulse, PULSE_INTERVAL_MS);
  document.addEventListener("visibilitychange", stopHidden);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", stopHidden);
    pending?.abort();
  };
}

/** Read only the aggregate owner contract. Failure is unavailable, never zero. */
export async function fetchAnonymousPresence(): Promise<AnonymousPresence> {
  const response = await fetch(PRESENCE_ENDPOINT, { ...anonymousRequest, signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error("Presence unavailable");
  return response.json() as Promise<AnonymousPresence>;
}
