"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { clearAuth, getAuthToken, getMe, login, logout, type AuthUser } from "./api-client";

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      clearAuth();
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      // A cached user without a confirmed token is only a display ghost. Clear
      // it so protected UI does not stay unlocked after the server rejects the
      // session or the browser loses the token.
      clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    const session = await login(username, password);
    setUser(session.user);
  }, []);

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
