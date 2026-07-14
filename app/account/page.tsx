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

export default function AccountPage() {
  const { user: authUser, refresh } = useAuth();
  const { timeZone, setTimeZone } = useTimeZone();
  const { filter: lobbyTierFilter, definition: lobbyTierDefinition, setFilter: setLobbyTierFilter } = useLobbyTier();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        setError("Failed to load account details");
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
      setSuccess("Password changed successfully");
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
      setSuccess("Profile updated");
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
      setSuccess("Time zone updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update time zone");
    } finally {
      setSavingTimeZone(false);
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
        <div className="text-pc-text-secondary">Account not found</div>
      </div>
    );
  }

  const { user, linkedPlayer } = account;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-pc-accent">Account Settings</h1>
        <p className="text-pc-text-secondary mt-1">
          Manage your profile, link your Paladins player, and change your password.
        </p>
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
            <h2 className="text-lg font-semibold text-pc-text">Notifications</h2>
            <p className="text-sm text-pc-text-secondary">Replies to your community posts appear here.</p>
          </div>
          {notifications.some((notification) => !notification.readAt) && <span className="rounded-full bg-pc-accent/15 px-2 py-1 text-xs font-semibold text-pc-accent">{notifications.filter((notification) => !notification.readAt).length} new</span>}
        </div>
        {notifications.length === 0 ? <p className="rounded-lg bg-pc-bg-secondary px-3 py-4 text-sm text-pc-text-muted">No community notifications yet.</p> : (
          <div className="divide-y divide-pc-border overflow-hidden rounded-lg border border-pc-border/70">
            {notifications.map((notification) => {
              const href = notification.postId ? `/community/${notification.postId}` : "/community";
              return <Link key={notification.id} href={href} onClick={() => handleNotificationOpen(notification)} className={`block px-4 py-3 transition-colors hover:bg-pc-bg-secondary ${notification.readAt ? "text-pc-text-secondary" : "bg-pc-accent/5 text-pc-text"}`}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-sm"><span className="font-semibold">{notification.actorUsername}</span> replied to <span className="font-medium">{notification.postTitle ?? "your post"}</span></div>{notification.commentContent && <div className="mt-1 line-clamp-1 text-xs text-pc-text-muted">{notification.commentContent}</div>}</div><time className="shrink-0 text-[10px] text-pc-text-muted">{formatLocalDateTime(notification.createdAt)}</time></div>
              </Link>;
            })}
          </div>
        )}
      </div>

      {/* ── Time Zone ── */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-pc-text mb-2">Time Zone</h2>
        <p className="text-pc-text-secondary text-sm mb-4">
          All timestamps and match-search hour windows use this time zone. Choose an IANA zone for daylight saving time, or a fixed UTC offset.
        </p>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-pc-text-muted mb-1">IANA time zone</label>
            <select
              value={selectedUtcOffset ? "" : selectedTimeZone}
              onChange={(event) => {
                setSelectedUtcOffset("");
                setSelectedTimeZone(event.target.value);
              }}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            >
              <option value="" disabled>Select a time zone</option>
              {timeZones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-pc-text-muted mb-1">Fixed UTC offset</label>
            <select
              value={selectedUtcOffset}
              onChange={(event) => {
                setSelectedUtcOffset(event.target.value);
                if (event.target.value) setSelectedTimeZone(fixedUtcOffsetToTimeZone(Number(event.target.value)));
              }}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            >
              <option value="">Use IANA time zone</option>
              {utcOffsetOptions.map((offset) => <option key={offset.value} value={offset.value}>{offset.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleSaveTimeZone}
            disabled={savingTimeZone || selectedTimeZone === timeZone}
            className="px-4 py-2 lg:self-end bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {savingTimeZone ? <LoadingIndicator className="gap-2" /> : "Save Time Zone"}
          </button>
        </div>
      </div>

      {/* ── Global ranked lobby preference ── */}
      <div className="mb-6 rounded-lg border border-pc-border bg-pc-bg-elevated p-6">
        <h2 className="mb-2 text-lg font-semibold text-pc-text">Ranked Lobby Scope</h2>
        <p className="mb-4 text-sm text-pc-text-secondary">
          Choose the ranked lobby range used by tier-aware statistics throughout PaladinsCat. This preference is stored in this browser.
        </p>
        <label className="block text-xs text-pc-text-muted">
          Lobby tier
          <select
            value={lobbyTierFilter}
            onChange={(event) => setLobbyTierFilter(event.target.value as LobbyTierFilter)}
            className="mt-1.5 w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
          >
            {LOBBY_TIER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <p className="mt-2 text-xs text-pc-text-muted">{lobbyTierDefinition.description}</p>
      </div>

      {/* ── Profile Info ── */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-pc-text mb-4">Profile</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              Username
            </label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {user.username}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              Email
            </label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {user.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              Member Since
            </label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {formatLocalDate(user.createdAt)}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              Last Login
            </label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {formatLocalDate(user.lastLogin)}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-pc-text-secondary mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50 resize-y min-h-[80px]"
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {savingProfile ? <LoadingIndicator className="gap-2" /> : "Save Profile"}
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
          Change Password
        </h2>

        {pwError && (
          <div className="mb-3 bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
            {pwError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label htmlFor="currentPw" className="block text-sm font-medium text-pc-text-secondary mb-1">
              Current Password
            </label>
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
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label htmlFor="newPw" className="block text-sm font-medium text-pc-text-secondary mb-1">
              New Password
            </label>
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
              placeholder="6+ characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPw" className="block text-sm font-medium text-pc-text-secondary mb-1">
              Confirm New Password
            </label>
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
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="submit"
            disabled={changingPw}
            className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changingPw ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
