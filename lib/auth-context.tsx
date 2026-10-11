/** Maintains browser authentication state and refreshes the current session.
 * This context tracks the signed-in browser session and refresh state.
 * refs: none
 */
"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { cacheAuthUser, clearAuth, getAuthUser, getMe, isAuthenticationRejection, login, logout, type AuthUser } from "./api-client";
import { shouldRevalidateStoredSession } from "./auth-session-sync";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Read the authentication context; throw when called outside AuthProvider.
 * refs: none
 * I/O types: `none -> AuthContextValue`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * Provide account state and login/logout/refresh actions to descendants. Start unauthenticated for SSR/hydration, restore cached display state after mount, and confirm it with getMe. Refresh on storage, focus, and visibility events; clear rejected sessions and remove listeners on unmount.
 * refs: none
 * I/O types: `{ children }: { children: ReactNode } -> JSX.Element`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start unauthenticated on the server and on the first client render
  // so the hydration tree matches. Reading localStorage here (as getAuthUser does
  // on the client but not on the server) produced a React hydration mismatch
  // (error #418). The cached session is restored after mount instead.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const confirmedUserId = useRef<number | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const sessionRevision = useRef(0);

  const refresh = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const revision = sessionRevision.current;
    const request = (async () => {
      try {
        const me = await getMe();
        if (revision !== sessionRevision.current) return;
        confirmedUserId.current = me.id;
        cacheAuthUser(me);
        setUser((previous) => JSON.stringify(previous) === JSON.stringify(me) ? previous : me);
      } catch (error) {
        if (revision !== sessionRevision.current) return;
        // A cached user without a confirmed token is only a display ghost. Clear
        // it so protected UI does not stay unlocked after the server rejects the
        // session or the browser loses the token.
        if (isAuthenticationRejection(error)) {
          confirmedUserId.current = null;
          clearAuth();
          setUser(null);
        } else {
          setUser((previous) => previous ? { ...previous, invitationActive: false, invitationRequired: true } : null);
        }
      } finally {
        if (revision === sessionRevision.current) setIsLoading(false);
      }
    })();
    refreshInFlight.current = request;
    void request.finally(() => {
      if (refreshInFlight.current === request) refreshInFlight.current = null;
    });
    return request;
  }, []);

  useEffect(() => {
    // Restore the cached session after mount so the nav shows the signed-in
    // user immediately (client-only; safe because this runs after hydration).
    // The async refresh below then confirms or clears it against the server.
    const cached = getAuthUser();
    setUser(cached ? { ...cached, invitationActive: false, invitationRequired: true } : null);
    void refresh();
    const syncSession = () => void refresh();
    const syncStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage
        || !shouldRevalidateStoredSession(event, confirmedUserId.current)) return;
      // A display-cache update is not a session transition. Different release
      // bundles serialize different fields; fetching and rewriting each other's
      // cache would keep old and new tabs in an endless refresh exchange.
      sessionRevision.current += 1;
      refreshInFlight.current = null;
      if (event.key === null || event.newValue === null) {
        confirmedUserId.current = null;
        setUser(null);
      }
      void refresh();
    };
    const syncVisibleSession = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("storage", syncStorage);
    window.addEventListener("focus", syncSession);
    document.addEventListener("visibilitychange", syncVisibleSession);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", syncVisibleSession);
    };
  }, [refresh]);

  useEffect(() => {
    if (!user?.invitationActive || !user.invitationExpiresAt) return;
    const remaining = Date.parse(user.invitationExpiresAt) - Date.now();
    if (!Number.isFinite(remaining)) return;
    // Timers longer than the browser's signed 32-bit bound are capped and rechecked.
    let timer: number;
    const scheduleExpiry = () => {
      timer = window.setTimeout(() => {
        const timeLeft = Date.parse(user.invitationExpiresAt!) - Date.now();
        if (timeLeft <= 0) setUser((previous) => previous ? { ...previous, invitationActive: false } : null);
        void refresh();
        // An unchanged refresh retains user identity. The capped checkpoint
        // must explicitly rearm instead of relying on a React state change.
        if (timeLeft > 0) scheduleExpiry();
      }, Math.max(0, Math.min(Date.parse(user.invitationExpiresAt!) - Date.now(), 2_147_483_647)));
    };
    scheduleExpiry();
    return () => window.clearTimeout(timer);
  }, [refresh, user]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    sessionRevision.current += 1;
    refreshInFlight.current = null;
    const session = await login(username, password);
    setUser(session.user);
    await refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    sessionRevision.current += 1;
    refreshInFlight.current = null;
    confirmedUserId.current = null;
    await logout();
    sessionRevision.current += 1;
    refreshInFlight.current = null;
    confirmedUserId.current = null;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      isAdmin: user?.isAdmin ?? false,
      isApproved: user?.isApproved ?? false,
      login: handleLogin,
      logout: handleLogout,
      refresh,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
