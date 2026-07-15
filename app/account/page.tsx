"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTimeZone } from "@/lib/time-zone-context";
import { formatLocalDate, formatLocalDateTime } from "@/lib/time-format";
import { fixedUtcOffsetFromTimeZone, fixedUtcOffsetToTimeZone, getFixedUtcOffsetOptions, getSupportedTimeZones } from "@/lib/time-zone";
import { useLobbyTier } from "@/lib/lobby-tier-context";
import { LOBBY_TIER_OPTIONS, type LobbyTierFilter } from "@/lib/lobby-tier";
import { LoadingIndicator, LoadingPanel } from "@/components/async-state";
import PlayerLinkCard from "@/components/player-link-card";
import {
  getAccountDetails,
  changePassword,
  updateProfile,
  type AccountDetails,
  getAccountNotifications,
  markAccountNotificationRead,
  type AccountNotification,
} from "@/lib/api-client";
import {
  clearCustomWallpaper,
  addCustomWallpaperFiles,
  addCustomWallpaperUrl,
  removeCustomWallpaper,
  resolveCustomWallpapers,
  setWallpaperEnabled,
  type ResolvedCustomWallpaper,
} from "@/lib/wallpaper-preference";
import { useLocalization } from "@/lib/localization-context";

export default function AccountPage() {
  const { t } = useLocalization();
  const { user: authUser, refresh } = useAuth();
  const { timeZone, setTimeZone } = useTimeZone();
  const { filter: lobbyTierFilter, definition: lobbyTierDefinition, setFilter: setLobbyTierFilter } = useLobbyTier();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customWallpapers, setCustomWallpapersState] = useState<ResolvedCustomWallpaper[]>([]);
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [wallpaperError, setWallpaperError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<AccountNotification[]>([]);

  // ── Password change state ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

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
      const [data, inbox] = await Promise.all([
        getAccountDetails(),
        getAccountNotifications().catch(() => []),
      ]);
      setAccount(data);
      setBio(data.user.bio ?? "");
      setNotifications(inbox);
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
    if (!authUser) {
      router.push("/auth/login");
      return;
    }
    loadAccount();
  }, [authUser, router, loadAccount]);

  const refreshCustomWallpaper = useCallback(async () => {
    setCustomWallpapersState(await resolveCustomWallpapers().catch(() => []));
  }, []);

  useEffect(() => {
    void refreshCustomWallpaper();
  }, [refreshCustomWallpaper]);

  useEffect(() => () => {
    customWallpapers.forEach((wallpaper) => {
      if (wallpaper.revoke) URL.revokeObjectURL(wallpaper.source);
    });
  }, [customWallpapers]);

  // ── Password change ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setSuccess(null);

    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }

    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setSuccess(t("generated.account.passwordChangedSuccessfully"));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwError(null);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setChangingPw(false);
    }
  };

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

  const handleNotificationOpen = (notification: AccountNotification) => {
    if (notification.readAt) return;
    setNotifications((current) => current.map((entry) => entry.id === notification.id ? { ...entry, readAt: new Date().toISOString() } : entry));
    void markAccountNotificationRead(notification.id).catch(() => {
      setNotifications((current) => current.map((entry) => entry.id === notification.id ? { ...entry, readAt: null } : entry));
    });
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

  if (loading) {
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
    <div className="max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pc-accent">{t("generated.account.accountSettings")}</h1>
        <p className="text-pc-text-secondary mt-1">
          {t("generated.account.manageYourProfileLinkYourPaladinsPlayerAndChangeYour")}</p>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-3 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* ── Community notifications ── */}
      <div className="mb-6 rounded-lg border border-pc-border bg-pc-bg-elevated p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-pc-text">{t("generated.account.notifications")}</h2>
            <p className="text-sm text-pc-text-secondary">{t("generated.account.repliesToYourCommunityPostsAppearHere")}</p>
          </div>
          {notifications.some((notification) => !notification.readAt) && <span className="rounded-full bg-pc-accent/15 px-2 py-1 text-xs font-semibold text-pc-accent">{notifications.filter((notification) => !notification.readAt).length} {t("generated.account.new")}</span>}
        </div>
        {notifications.length === 0 ? <p className="rounded-lg bg-pc-bg-secondary px-3 py-4 text-sm text-pc-text-muted">{t("generated.account.noCommunityNotificationsYet")}</p> : (
          <div className="divide-y divide-pc-border overflow-hidden rounded-lg border border-pc-border/70">
            {notifications.map((notification) => {
              const href = notification.postId ? `/community/${notification.postId}` : "/community";
              return <Link key={notification.id} href={href} onClick={() => handleNotificationOpen(notification)} className={`block px-4 py-3 transition-colors hover:bg-pc-bg-secondary ${notification.readAt ? "text-pc-text-secondary" : "bg-pc-accent/5 text-pc-text"}`}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-sm"><span className="font-semibold">{notification.actorUsername}</span> {t("generated.account.repliedTo")}{" "}<span className="font-medium">{notification.postTitle ?? t("generated.account.yourPost")}</span></div>{notification.commentContent && <div className="mt-1 line-clamp-1 text-xs text-pc-text-muted">{notification.commentContent}</div>}</div><time className="shrink-0 text-[10px] text-pc-text-muted">{formatLocalDateTime(notification.createdAt)}</time></div>
              </Link>;
            })}
          </div>
        )}
      </div>

      {/* ── Time Zone ── */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-pc-text mb-2">{t("generated.account.timeZone")}</h2>
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
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
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
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            >
              <option value="">{t("generated.account.useIanaTimeZone")}</option>
              {utcOffsetOptions.map((offset) => <option key={offset.value} value={offset.value}>{offset.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleSaveTimeZone}
            disabled={savingTimeZone || selectedTimeZone === timeZone}
            className="px-4 py-2 lg:self-end bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {savingTimeZone ? <LoadingIndicator className="gap-2" /> : t("generated.account.saveTimeZone")}
          </button>
        </div>
      </div>

      {/* ── Global ranked lobby preference ── */}
      <div className="mb-6 rounded-lg border border-pc-border bg-pc-bg-elevated p-6">
        <h2 className="mb-2 text-lg font-semibold text-pc-text">{t("generated.account.rankedLobbyScope")}</h2>
        <p className="mb-4 text-sm text-pc-text-secondary">
          {t("generated.account.chooseTheRankedLobbyRangeUsedByTierAwareStatistics")}</p>
        <label className="block text-xs text-pc-text-muted">
          {t("generated.account.lobbyTier")}<select
            value={lobbyTierFilter}
            onChange={(event) => setLobbyTierFilter(event.target.value as LobbyTierFilter)}
            className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
          >
            {LOBBY_TIER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs text-pc-text-muted">{lobbyTierDefinition.description}</p>
      </div>

      {/* ── Custom wallpaper ── */}
      <div className="mb-6 rounded-lg border border-pc-border bg-pc-bg-elevated p-6">
        <h2 className="mb-2 text-lg font-semibold text-pc-text">{t("generated.account.customWallpaper")}</h2>
        <p className="mb-4 text-sm text-pc-text-secondary">
          {t("generated.account.useYourOwnImageBehindEveryPageImagesAndLinks")}</p>

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
                className="min-w-0 flex-1 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              />
              <button
                type="button"
                onClick={() => void applyCustomWallpaperUrl()}
                disabled={!wallpaperUrl.trim()}
                className="rounded-lg bg-pc-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>

      {/* ── Profile Info ── */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-pc-text mb-4">{t("generated.account.profile")}</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.username")}</label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {user.username}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.email")}</label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {user.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.memberSince")}</label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {formatLocalDate(user.createdAt)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.lastLogin")}</label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {formatLocalDate(user.lastLogin)}
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
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50 resize-y min-h-[80px]"
            placeholder={t("generated.account.tellUsAboutYourself")}
            rows={3}
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {savingProfile ? <LoadingIndicator className="gap-2" /> : t("generated.account.saveProfile")}
        </button>
      </div>

      {/* ── Player Linking ── */}
      <div className="mb-6">
        <PlayerLinkCard
          linkedPlayer={linkedPlayer}
          onChanged={async () => {
            await loadAccount();
            await refresh();
          }}
        />
      </div>

      {/* ── Password Change ── */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-pc-text mb-4">
          {t("generated.account.changePassword")}</h2>

        {pwError && (
          <div className="mb-3 bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label htmlFor="currentPw" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.currentPassword")}</label>
            <input
              id="currentPw"
              type="password"
              value={currentPw}
              onChange={(e) => {
                setCurrentPw(e.target.value);
                setPwError(null);
              }}
              required
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.account.enterCurrentPassword")}
            />
          </div>

          <div>
            <label htmlFor="newPw" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.newPassword")}</label>
            <input
              id="newPw"
              type="password"
              value={newPw}
              onChange={(e) => {
                setNewPw(e.target.value);
                setPwError(null);
              }}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.account.text6Characters")}
            />
          </div>

          <div>
            <label htmlFor="confirmPw" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.account.confirmNewPassword")}</label>
            <input
              id="confirmPw"
              type="password"
              value={confirmPw}
              onChange={(e) => {
                setConfirmPw(e.target.value);
                setPwError(null);
              }}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.account.reEnterNewPassword")}
            />
          </div>

          <button
            type="submit"
            disabled={changingPw}
            className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPw ? t("generated.account.changing") : t("generated.account.changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
