"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getAuthToken, getAuthUser, getMe, login, logout, type AuthUser } from "./api-client";

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
      setUser(getAuthUser());
      setIsLoading(false);
      return;
    }
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      // Token may be stale — fall back to localStorage
      setUser(getAuthUser());
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
