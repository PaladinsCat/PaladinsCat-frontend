"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getAccountDetails,
  linkPlayerId,
  unlinkPlayer,
  changePassword,
  fetchPlayerSearch,
  updateProfile,
  type AccountDetails,
  type PlayerSearchResult,
} from "@/lib/api-client";

export default function AccountPage() {
  const { user: authUser, refresh } = useAuth();
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

  // ── Password change state ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // ── Profile update state ──
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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

  const handleLinkPlayer = async (result: PlayerSearchResult) => {
    if (!result.id) return;
    setLinking(true);
    setError(null);
    setSuccess(null);
    try {
      const numericId = parseInt(result.id, 10);
      await linkPlayerId(numericId);
      setSuccess(`Linked to ${result.name}`);
      setSearchResults([]);
      setSearchQuery("");
      await loadAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link player");
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
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pc-text-secondary mb-1">
              Last Login
            </label>
            <div className="px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}
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
              <div className="font-semibold text-pc-text text-lg mb-1">
                {linkedPlayer.name}
              </div>
              {linkedPlayer.platform_name && (
                <div className="text-pc-text-secondary text-sm">{linkedPlayer.platform_name}</div>
              )}
              {linkedPlayer.kbm_tier && (
                <div className="text-pc-text-secondary text-sm mt-1">
                  Tier: {linkedPlayer.kbm_tier}
                  {linkedPlayer.kbm_points !== null && ` · ${linkedPlayer.kbm_points} pts`}
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
          </div>
        ) : (
          /* ── Player search ── */
          <div>
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
                    onClick={() => handleLinkPlayer(result)}
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
