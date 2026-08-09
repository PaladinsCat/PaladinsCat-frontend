"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchActivityBanner, type ActivityBanner as ActivityBannerData } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

const DISMISSED_KEY = "paladinscat:site-banner:dismissed";
const REFRESH_MS = 60_000;

function readDismissedBanner(): string | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

export default function SiteBanner() {
  const { t } = useLocalization();
  const [banner, setBanner] = useState<ActivityBannerData | null>(null);
  const [dismissedMessage, setDismissedMessage] = useState<string | null | undefined>(readDismissedBanner);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const next = await fetchActivityBanner();
      if (!cancelled) setBanner(next);
    }

    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (
    dismissedMessage === undefined ||
    !banner?.enabled ||
    !banner.message.trim() ||
    dismissedMessage === banner.message
  ) {
    return null;
  }

  const message = banner.message;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, message);
    } catch {
      // Dismiss for the current render even when storage is unavailable.
    }
    setDismissedMessage(message);
  }

  return (
    <section
      role="status"
      aria-label={t("siteBanner.title")}
      className="relative z-40 border-b border-pc-accent/30 bg-pc-bg-elevated text-pc-text shadow-lg"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <p className="min-w-0 flex-1 text-sm leading-5">{message}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("siteBanner.dismiss")}
          className="shrink-0 rounded-md p-1 text-pc-text-muted transition-colors hover:bg-pc-bg hover:text-pc-text"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
