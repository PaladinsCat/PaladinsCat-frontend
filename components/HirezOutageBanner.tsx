"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { fetchHirezServiceStatus, type HirezServiceStatus } from "@/lib/api-client";
import { formatLocalTime } from "@/lib/time-format";
import { useLocalization } from "@/lib/localization-context";

const REFRESH_MS = 60_000;

export default function HirezOutageBanner() {
  const { t , formatTime} = useLocalization();
  const [status, setStatus] = useState<HirezServiceStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const next = await fetchHirezServiceStatus();
      if (!cancelled) setStatus(next);
    }

    loadStatus();
    const timer = window.setInterval(loadStatus, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const primary = status?.activeOutages[0] ?? null;
  const nextProbe = useMemo(() => formatTime(primary?.nextProbeAt), [primary?.nextProbeAt]);

  if (!status || status.status === "ok") return null;

  const isOutage = status.status === "outage";
  const title = primary?.title ?? t(isOutage ? "status.apiOutage" : "status.apiDegraded");

  return (
    <section
      aria-live="polite"
      className="sticky top-16 z-40 border-b border-red-400/40 bg-red-950/80 text-red-50 shadow-lg shadow-red-950/20 backdrop-blur-[30px]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-200" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-sm font-semibold uppercase tracking-wide text-red-100">
              {title}
            </div>
            <p className="mt-0.5 text-sm leading-5 text-red-50/90">
              {status.message}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-red-50/85 lg:justify-end">
          {status.pendingVendorDebt > 0 && (
            <span className="rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
              {t("status.heldMatches", { count: status.pendingVendorDebt })}
            </span>
          )}
          {status.affectedHours > 0 && (
            <span className="rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
              {t("status.affectedHours", { count: status.affectedHours })}
            </span>
          )}
          {nextProbe && (
            <span className="inline-flex items-center gap-1 rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {primary?.probeDue ? t("status.probeDue") : t("status.nextProbe", { time: nextProbe })}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t("status.live")}
          </span>
        </div>
      </div>
    </section>
  );
}
