"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useTimeZone } from "@/lib/time-zone-context";
import { formatLocalDate, formatLocalDateTime, formatLocalTime } from "@/lib/time-format";
import { fixedUtcOffsetFromTimeZone, fixedUtcOffsetToTimeZone, getFixedUtcOffsetOptions, getSupportedTimeZones } from "@/lib/time-zone";
import {
  getAccountDetails,
  unlinkPlayer,
  changePassword,
  fetchPlayerSearch,
  updateProfile,
  type AccountDetails,
  type PlayerSearchResult,
  getPlayerLinkVerification,
  startPlayerLinkVerification,
  verifyPlayerLink,
  cancelPlayerLinkVerification,
  getAccountNotifications,
  markAccountNotificationRead,
  type PlayerLinkVerification,
  type AccountNotification,
} from "@/lib/api-client";

export default function AccountPage() {
  const { user: authUser, refresh } = useAuth();
  const { timeZone, setTimeZone } = useTimeZone();
  const router = useRouter();
  const [account, setAccount] = useState<AccountDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Player linking state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [verification, setVerification] = useState<PlayerLinkVerification | null>(null);
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
      const [data, pendingVerification, inbox] = await Promise.all([
        getAccountDetails(),
        getPlayerLinkVerification(),
        getAccountNotifications().catch(() => []),
      ]);
      setAccount(data);
      setBio(data.user.bio ?? "");
      setVerification(pendingVerification);
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

  // ── Player search ──
  const debouncedSearch = useCallback(
    (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const timer = setTimeout(async () => {
        try {
          const results = await fetchPlayerSearch(query);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    },
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    debouncedSearch(val);
  };

  const handleStartLinkVerification = async (result: PlayerSearchResult) => {
    if (!result.id) return;
    setLinking(true);
    setError(null);
    setSuccess(null);
    try {
      const nextVerification = await startPlayerLinkVerification(parseInt(result.id, 10));
      setVerification(nextVerification);
      setSuccess(`Verification code generated for ${result.name}`);
      setSearchResults([]);
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate verification code");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkPlayer = async () => {
    setError(null);
    setSuccess(null);
    try {
      await unlinkPlayer();
      setSuccess("Player link removed");
      await loadAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink player");
    }
  };

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

  const handleVerifyPlayerLink = async () => {
    setLinking(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await verifyPlayerLink();
      setVerification(null);
      setSuccess(`Linked to ${result.player.name}`);
      await loadAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify player ownership");
    } finally {
      setLinking(false);
    }
  };

  const handleCancelVerification = async () => {
    try {
      await cancelPlayerLinkVerification();
      setVerification(null);
      setSuccess(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel verification");
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
      setSuccess("Time zone updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update time zone");
    } finally {
      setSavingTimeZone(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-pc-text-secondary">Loading account...</div>
      </div>
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
            {savingTimeZone ? "Saving..." : "Save Time Zone"}
          </button>
        </div>
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
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* ── Player Linking ── */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-pc-text mb-2">
          Link Paladins Player
        </h2>
        <p className="text-pc-text-secondary text-sm mb-4">
          Link your Paladins in-game player profile to your PaladinsCat account.
          This connects your stats and ranked data.
        </p>

        {linkedPlayer ? (
          /* ── Player is linked ── */
          <div>
            <div className="bg-pc-bg-secondary border border-pc-border rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-pc-text-secondary">Linked Player</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400">
                  Connected
                </span>
              </div>
              <Link href={`/players/${linkedPlayer.id}`} className="mb-1 block text-lg font-semibold text-pc-text hover:text-pc-accent">
                {linkedPlayer.name}
              </Link>
              {linkedPlayer.platform_name && (
                <div className="text-pc-text-secondary text-sm">{linkedPlayer.platform_name}</div>
              )}
              {linkedPlayer.kbm_tier && (
                <div className="text-pc-text-secondary text-sm mt-1">
                  Tier: {linkedPlayer.kbm_tier}
                  {linkedPlayer.kbm_points !== null && ` · ${linkedPlayer.kbm_points} TP`}
                </div>
              )}
              {linkedPlayer.wins !== null && (
                <div className="text-pc-text-secondary text-sm mt-1">
                  {linkedPlayer.wins}W / {linkedPlayer.losses ?? "—"}L
                </div>
              )}
            </div>

            <button
              onClick={handleUnlinkPlayer}
              className="px-3 py-1.5 border border-red-700/50 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors text-sm"
            >
              Unlink Player
            </button>
            <Link href={`/players/${linkedPlayer.id}`} className="ml-3 text-sm text-pc-accent hover:underline">Open player profile →</Link>
          </div>
        ) : (
          /* ── Player search ── */
          <div>
            {verification ? (
              <div className="bg-pc-bg-secondary border border-pc-border rounded-lg p-4 mb-4">
                <div className="text-pc-text font-medium">Verify {verification.player.name}</div>
                <ol className="mt-3 space-y-1.5 text-sm text-pc-text-secondary list-decimal list-inside">
                  <li>In Paladins, rename any saved loadout to this exact code.</li>
                  <li>Save the loadout, then return here and verify it.</li>
                </ol>
                <div className="mt-3 rounded-lg border border-pc-accent/40 bg-pc-bg px-4 py-3 font-mono text-center text-lg font-bold tracking-wider text-pc-accent">
                  {verification.code}
                </div>
                <div className="mt-2 text-xs text-pc-text-muted">Expires {formatLocalTime(verification.expiresAt)}</div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleVerifyPlayerLink}
                    disabled={linking}
                    className="flex-1 px-3 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm hover:bg-pc-accent-secondary disabled:opacity-50"
                  >
                    {linking ? "Checking..." : "Verify & Link"}
                  </button>
                  <button
                    onClick={handleCancelVerification}
                    disabled={linking}
                    className="px-3 py-2 rounded-lg border border-pc-border text-pc-text-secondary text-sm hover:bg-pc-bg-elevated disabled:opacity-50"
                  >
                    Choose another
                  </button>
                </div>
              </div>
            ) : (
            <>
              <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by in-game name..."
                className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-pc-text-muted text-sm">
                  Searching...
                </span>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="bg-pc-bg-secondary border border-pc-border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleStartLinkVerification(result)}
                    disabled={linking}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-pc-border last:border-b-0 hover:bg-pc-bg-elevated transition-colors disabled:opacity-50"
                  >
                    <div className="text-left">
                      <div className="text-pc-text font-medium">{result.name}</div>
                      {result.platform && (
                        <div className="text-pc-text-secondary text-sm">{result.platform}</div>
                      )}
                    </div>
                    {result.kbmTier && (
                      <span className="text-pc-accent text-sm">{result.kbmTier}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <div className="text-pc-text-muted text-sm text-center py-2">
                No players found
              </div>
              )}
            </>
            )}
          </div>
        )}
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
