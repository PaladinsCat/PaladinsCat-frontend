/**
 * Define the account page responsibility boundary.
 * Coordinates account page data loading, authorization, and presentation.
 */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock3, ImageIcon, UserRound, UserRoundCog } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTimeZone } from "@/lib/time-zone-context";
import { fixedUtcOffsetFromTimeZone, fixedUtcOffsetToTimeZone, getFixedUtcOffsetOptions, getSupportedTimeZones } from "@/lib/time-zone";
import { LoadingIndicator, LoadingPanel } from "@/components/async-state";
import PlayerLinkCard from "@/components/player-link-card";
import {
  getAccountDetails,
  updateProfile,
  type AccountDetails,
} from "@/lib/api-client";
import {
  clearCustomWallpaper,
  addCustomWallpaperFiles,
  addCustomWallpaperUrl,
  getWallpaperEnabled,
  removeCustomWallpaper,
  resolveCustomWallpapers,
  setWallpaperEnabled,
  WALLPAPER_CHANGE_EVENT,
  type ResolvedCustomWallpaper,
} from "@/lib/wallpaper-preference";
import { useLocalization } from "@/lib/localization-context";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function AccountPage() {
  const { t, formatDate } = useLocalization();
  const { user: authUser, isLoading: authLoading, refresh } = useAuth();
  const { timeZone, setTimeZone } = useTimeZone();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customWallpapers, setCustomWallpapersState] = useState<ResolvedCustomWallpaper[]>([]);
  const [wallpaperEnabled, setWallpaperEnabledState] = useState(true);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [wallpaperError, setWallpaperError] = useState<string | null>(null);

  // ── Profile update state ──
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingTimeZone, setSavingTimeZone] = useState(false);
  const [selectedTimeZone, setSelectedTimeZone] = useState(timeZone);
  const [selectedUtcOffset, setSelectedUtcOffset] = useState(fixedUtcOffsetFromTimeZone(timeZone));
  const timeZones = getSupportedTimeZones();
  const utcOffsetOptions = getFixedUtcOffsetOptions();

  useEffect(() => {
    setSelectedTimeZone(timeZone);
    setSelectedUtcOffset(fixedUtcOffsetFromTimeZone(timeZone));
  }, [timeZone]);

  const loadAccount = useCallback(async () => {
    try {
      const data = await getAccountDetails();
      setAccount(data);
      setBio(data.user.bio ?? "");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "Not authenticated" || err.message.includes("401")) {
          router.push("/auth/login");
          return;
        }
        setError(err.message);
      } else {
        setError(t("generated.account.failedToLoadAccountDetails"));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.push("/auth/login");
      return;
    }
    loadAccount();
  }, [authLoading, authUser, router, loadAccount]);

  const refreshCustomWallpaper = useCallback(async () => {
    setCustomWallpapersState(await resolveCustomWallpapers().catch(() => []));
  }, []);

  useEffect(() => {
    void refreshCustomWallpaper();
  }, [refreshCustomWallpaper]);

  useEffect(() => {
    const syncWallpaperPreference = () => setWallpaperEnabledState(getWallpaperEnabled());
    syncWallpaperPreference();
    window.addEventListener(WALLPAPER_CHANGE_EVENT, syncWallpaperPreference);
    window.addEventListener("storage", syncWallpaperPreference);
    return () => {
      window.removeEventListener(WALLPAPER_CHANGE_EVENT, syncWallpaperPreference);
      window.removeEventListener("storage", syncWallpaperPreference);
    };
  }, []);

  useEffect(() => () => {
    customWallpapers.forEach((wallpaper) => {
      if (wallpaper.revoke) URL.revokeObjectURL(wallpaper.source);
    });
  }, [customWallpapers]);

  // ── Profile save ──
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile({ bio });
      setSuccess(t("generated.account.profileUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveTimeZone = async () => {
    setSavingTimeZone(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile({ time_zone: selectedTimeZone });
      setTimeZone(selectedTimeZone);
      await refresh();
      setSuccess(t("generated.account.timeZoneUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update time zone");
    } finally {
      setSavingTimeZone(false);
    }
  };

  const applyCustomWallpaperUrl = async () => {
    try {
      await addCustomWallpaperUrl(wallpaperUrl);
      setWallpaperEnabled(true);
      setWallpaperUrl("");
      setWallpaperError(null);
      setSuccess(t("generated.account.customWallpaperSavedForThisBrowser"));
      await refreshCustomWallpaper();
    } catch (err) {
      setWallpaperError(err instanceof Error ? err.message : "Unable to save this wallpaper.");
    }
  };

  const handleWallpaperToggle = () => {
    const next = !wallpaperEnabled;
    setWallpaperEnabledState(next);
    setWallpaperEnabled(next);
  };

  const handleWallpaperFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    try {
      await addCustomWallpaperFiles(files);
      setWallpaperEnabled(true);
      setWallpaperError(null);
      setSuccess(t("generated.account.customWallpaperSavedForThisBrowser"));
      await refreshCustomWallpaper();
    } catch (err) {
      setWallpaperError(err instanceof Error ? err.message : "Unable to save this wallpaper.");
    }
  };

  const handleRemoveCustomWallpaper = async (wallpaper: ResolvedCustomWallpaper) => {
    try {
      await removeCustomWallpaper(wallpaper.wallpaper);
      setWallpaperError(null);
      setSuccess(t("generated.account.customWallpaperRemoved"));
      await refreshCustomWallpaper();
    } catch (err) {
      setWallpaperError(err instanceof Error ? err.message : "Unable to remove this wallpaper.");
    }
  };

  const handleClearCustomWallpaper = async () => {
    try {
      await clearCustomWallpaper();
      setWallpaperUrl("");
      setWallpaperError(null);
      setSuccess(t("generated.account.customWallpaperRemovedMapWallpapersAreActiveAgain"));
      await refreshCustomWallpaper();
    } catch (err) {
      setWallpaperError(err instanceof Error ? err.message : "Unable to remove this wallpaper.");
    }
  };

  if (authLoading || loading) {
    return (
      <LoadingPanel className="min-h-[50vh]" />
    );
  }

  if (!account) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-pc-text-secondary">{t("generated.account.accountNotFound")}</div>
      </div>
    );
  }

  const { user, linkedPlayer } = account;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-2xl border border-pc-border bg-pc-bg-elevated/95 px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pc-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-pc-accent-alt/15 blur-3xl" />
        <div className="relative flex items-start gap-4 sm:items-center">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pc-accent/25 bg-pc-accent/10 text-pc-accent shadow-pc-accent/10">
            <UserRoundCog className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="pc-heading pc-heading-lg">{t("generated.account.accountSettings")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-pc-text-secondary sm:text-base">
              {t("generated.account.manageYourProfileLinkYourPaladinsPlayerAndChangeYour")}</p>
          </div>
        </div>
      </section>

      {/* ── Alerts ── */}
      {(error || success) && <div className="mt-4 space-y-3">
        {error && <div className="rounded-xl border border-red-700/50 bg-red-900/30 p-4 text-sm text-red-300">{error}</div>}
        {success && <div className="rounded-xl border border-emerald-700/50 bg-emerald-900/30 p-4 text-sm text-emerald-300">{success}</div>}
      </div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">

      {/* ── Time Zone ── */}
      <section className="rounded-2xl border border-white/5 pc-glass p-6 lg:col-span-2">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-pc-accent/20 bg-pc-accent/10 text-pc-accent">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-pc-text">{t("generated.account.timeZone")}</h2>
        </div>
        <p className="text-pc-text-secondary text-sm mb-4">
          {t("generated.account.allTimestampsAndMatchSearchHourWindowsUseThisTime")}</p>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-pc-text-muted mb-1">{t("generated.account.ianaTimeZone")}</label>
            <select
              value={selectedUtcOffset ? "" : selectedTimeZone}
              onChange={(event) => {
                setSelectedUtcOffset("");
                setSelectedTimeZone(event.target.value);
              }}
              className="w-full rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            >
              <option value="" disabled>{t("generated.account.selectATimeZone")}</option>
              {timeZones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-pc-text-muted mb-1">{t("generated.account.fixedUtcOffset")}</label>
            <select
              value={selectedUtcOffset}
              onChange={(event) => {
                setSelectedUtcOffset(event.target.value);
                if (event.target.value) setSelectedTimeZone(fixedUtcOffsetToTimeZone(Number(event.target.value)));
              }}
              className="w-full rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            >
              <option value="">{t("generated.account.useIanaTimeZone")}</option>
              {utcOffsetOptions.map((offset) => <option key={offset.value} value={offset.value}>{offset.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleSaveTimeZone}
            disabled={savingTimeZone || selectedTimeZone === timeZone}
            className="rounded-xl bg-pc-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50 lg:self-end"
          >
            {savingTimeZone ? <LoadingIndicator className="gap-2" /> : t("generated.account.saveTimeZone")}
          </button>
        </div>
      </section>

      {/* ── Custom wallpaper ── */}
      <section className="rounded-2xl border border-white/5 pc-glass p-6 lg:col-span-2">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-pc-accent-alt/20 bg-pc-accent-alt/10 text-pc-accent-alt">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-pc-text">{t("generated.account.customWallpaper")}</h2>
        </div>
        <p className="mb-4 text-sm text-pc-text-secondary">
          {t("generated.account.useYourOwnImageBehindEveryPageImagesAndLinks")}</p>

        <button
          type="button"
          onClick={handleWallpaperToggle}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-pc-border bg-pc-bg-secondary/90 px-4 py-3 text-left transition-colors hover:border-pc-accent-mid"
          aria-pressed={wallpaperEnabled}
        >
          <span>
            <span className="block text-sm font-semibold text-pc-text">{t("menu.mapWallpaper")}</span>
            <span className="mt-0.5 block text-xs text-pc-text-muted">{wallpaperEnabled ? t("menu.enabled") : t("menu.darkGreyOnly")}</span>
          </span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${wallpaperEnabled ? "bg-pc-accent" : "bg-pc-bg"}`} aria-hidden="true">
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${wallpaperEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </span>
        </button>

        {customWallpapers.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {customWallpapers.map((wallpaper, index) => (
              <div key={`${wallpaper.source}-${index}`} className="group relative h-24 overflow-hidden rounded-lg border border-pc-border bg-pc-bg-secondary">
                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: `url(${JSON.stringify(wallpaper.source)})`, backgroundPosition: "center", backgroundSize: "cover" }}
                  role="img"
                  aria-label={t("generated.account.customWallpaperValue1Preview", { value1: index + 1 })}
                />
                <button
                  type="button"
                  onClick={() => void handleRemoveCustomWallpaper(wallpaper)}
                  className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white opacity-100 transition-opacity hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  aria-label={t("generated.account.removeCustomWallpaperValue1", { value1: index + 1 })}
                >
                  {t("generated.account.remove")}</button>
              </div>
            ))}
          </div>
        )}

        {customWallpapers.length > 1 && <p className="mb-3 text-xs text-pc-text-muted">{customWallpapers.length} {t("generated.account.imagesCycleEvery10SecondsWithTheMapWallpaperCrossfade")}</p>}
        {customWallpapers.length === 1 && <p className="mb-3 text-xs text-pc-text-muted">{t("generated.account.oneImageIsShownAsAStaticWallpaper")}</p>}

        {wallpaperError && <p className="mb-3 rounded-lg border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400">{wallpaperError}</p>}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-pc-text-secondary">
            {t("generated.account.imageLink")}<div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={wallpaperUrl}
                onChange={(event) => setWallpaperUrl(event.target.value)}
                placeholder={t("generated.account.httpsExampleComWallpaperJpg")}
                className="min-w-0 flex-1 rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-sm text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              />
              <button
                type="button"
                onClick={() => void applyCustomWallpaperUrl()}
                disabled={!wallpaperUrl.trim()}
                className="rounded-xl bg-pc-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("generated.account.addLink")}</button>
            </div>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-pc-border bg-pc-bg-secondary px-4 py-2 text-sm font-semibold text-pc-text transition-colors hover:border-pc-accent hover:text-pc-accent">
              {t("generated.account.uploadImages")}<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={handleWallpaperFileChange} className="sr-only" />
            </label>
            {customWallpapers.length > 0 && <button type="button" onClick={() => void handleClearCustomWallpaper()} className="w-fit text-sm text-pc-text-muted transition-colors hover:text-red-400">{t("generated.account.removeAllCustomWallpapers")}</button>}
          </div>
          <p className="text-xs text-pc-text-muted">{t("generated.account.selectOneOrMoreImagesEachUploadedImageCanBe")}</p>
        </div>
      </section>

      {/* ── Profile Info ── */}
      <section className="rounded-2xl border border-white/5 pc-glass p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-pc-accent-secondary/20 bg-pc-accent-secondary/10 text-pc-accent-secondary">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-pc-text">{t("generated.account.profile")}</h2>
        </div>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.username")}</label>
            <div className="rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text">
              {user.username}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.email")}</label>
            <div className="rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text">
              {user.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.memberSince")}</label>
            <div className="rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text">
              {formatDate(user.createdAt)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.lastLogin")}</label>
            <div className="rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text">
              {formatDate(user.lastLogin)}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-pc-text-secondary mb-1">
            {t("generated.account.bio")}</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[96px] w-full resize-y rounded-xl border border-pc-border bg-pc-bg-secondary px-3 py-2.5 text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            placeholder={t("generated.account.tellUsAboutYourself")}
            rows={3}
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="rounded-xl bg-pc-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingProfile ? <LoadingIndicator className="gap-2" /> : t("generated.account.saveProfile")}
        </button>
      </section>

      {/* ── Player Linking ── */}
      <div className="min-w-0">
        <PlayerLinkCard
          linkedPlayer={linkedPlayer}
          onChanged={async () => {
            await loadAccount();
            await refresh();
          }}
        />
      </div>

      {/* Identity credentials are exclusively managed by Keycloak. */}
      <section className="rounded-2xl border border-white/5 pc-glass p-6 lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-pc-text">{t("generated.common.account")}</h2>
        <form action="/api/auth/oidc/account" method="post">
          <button type="submit" className="rounded-xl bg-pc-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary">
            {t("generated.account.changePassword")}
          </button>
        </form>
      </section>
      </div>
    </div>
  );
}
