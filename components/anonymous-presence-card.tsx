"use client";

import { useEffect, useState } from "react";
import { fetchAnonymousPresence, type AnonymousPresence } from "@/lib/anonymous-presence";
import { useLocalization } from "@/lib/localization-context";

/** Display the coarse, completed-minute estimate separately from cached catalog totals. */
export function AnonymousPresenceCard() {
  const { t, formatNumber } = useLocalization();
  const [presence, setPresence] = useState<AnonymousPresence | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      void fetchAnonymousPresence().then((value) => { if (active) setPresence(value); })
        .catch(() => { if (active) setPresence(null); });
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const value = presence?.status === "available" && presence.estimated_active_pages != null
    ? t("operations.presenceEstimate", { count: formatNumber(presence.estimated_active_pages) })
    : t(presence?.status === "suppressed" ? "operations.presenceSuppressed"
      : presence?.status === "warming_up" ? "operations.presenceWarming" : "operations.presenceUnavailable");
  return <div className="mt-3 rounded-xl border border-pc-border bg-pc-bg-elevated p-4">
    <div className="text-xs text-pc-text-muted">{t("operations.presenceTitle")}</div>
    <div className="mt-1 text-2xl font-bold text-pc-text" aria-live="polite">{value}</div>
    <p className="mt-2 text-xs text-pc-text-muted">{t("operations.presenceDetail")}</p>
  </div>;
}
