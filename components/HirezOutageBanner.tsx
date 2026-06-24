"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { fetchHirezServiceStatus, type HirezServiceStatus } from "@/lib/api-client";

const REFRESH_MS = 60_000;

function formatUtc(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime())) return null;
  return timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default function HirezOutageBanner() {
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
  const nextProbe = useMemo(() => formatUtc(primary?.nextProbeAt), [primary?.nextProbeAt]);

  if (!status || status.status === "ok") return null;

  const isOutage = status.status === "outage";
  const title = primary?.title ?? (isOutage ? "Hi-Rez API outage" : "Hi-Rez API degraded");

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
              {status.pendingVendorDebt} held matches
            </span>
          )}
          {status.affectedHours > 0 && (
            <span className="rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
              {status.affectedHours} affected hours
            </span>
          )}
          {nextProbe && (
            <span className="inline-flex items-center gap-1 rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {primary?.probeDue ? "Probe due" : `Next probe ${nextProbe}`}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded border border-red-300/30 bg-red-900/40 px-2.5 py-1">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Live
          </span>
        </div>
      </div>
    </section>
  );
}
