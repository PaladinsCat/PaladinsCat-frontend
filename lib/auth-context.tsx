/** Maintains browser authentication state and refreshes the current session.
 * This context tracks the signed-in browser session and refresh state.
 * refs: none
 */
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { cacheAuthUser, clearAuth, getAuthUser, getMe, isAuthenticationRejection, login, logout, type AuthUser } from "./api-client";

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

  const refresh = useCallback(async () => {
    try {
      const me = await getMe();
      cacheAuthUser(me);
      setUser(me);
    } catch (error) {
      // A cached user without a confirmed token is only a display ghost. Clear
      // it so protected UI does not stay unlocked after the server rejects the
      // session or the browser loses the token.
      if (isAuthenticationRejection(error)) {
        clearAuth();
        setUser(null);
      } else {
        setUser((previous) => previous ? { ...previous, invitationActive: false, invitationRequired: true } : null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restore the cached session after mount so the nav shows the signed-in
    // user immediately (client-only; safe because this runs after hydration).
    // The async refresh below then confirms or clears it against the server.
    const cached = getAuthUser();
    setUser(cached ? { ...cached, invitationActive: false, invitationRequired: true } : null);
    void refresh();
    const syncSession = () => void refresh();
    const syncVisibleSession = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("storage", syncSession);
    window.addEventListener("focus", syncSession);
    document.addEventListener("visibilitychange", syncVisibleSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", syncVisibleSession);
    };
  }, [refresh]);

  useEffect(() => {
    if (!user?.invitationActive || !user.invitationExpiresAt) return;
    const remaining = Date.parse(user.invitationExpiresAt) - Date.now();
    if (!Number.isFinite(remaining)) return;
    // Timers longer than the browser's signed 32-bit bound are capped and rechecked.
    const timer = window.setTimeout(() => {
      if (Date.parse(user.invitationExpiresAt!) <= Date.now()) setUser((previous) => previous ? { ...previous, invitationActive: false } : null);
      void refresh();
    }, Math.max(0, Math.min(remaining, 2_147_483_647)));
    return () => window.clearTimeout(timer);
  }, [refresh, user]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    const session = await login(username, password);
    setUser(session.user);
    await refresh();
  }, [refresh]);

  const handleLogout = useCallback(async () => {
    await logout();
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
