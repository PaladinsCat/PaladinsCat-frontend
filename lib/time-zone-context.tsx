/**
 * Share the authenticated user's preferred time zone with client components.
 *
 * The provider validates and persists selections locally; it does not fetch or mutate API data.
 * refs: none
 */
"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { getPreferredTimeZone, isValidTimeZone, savePreferredTimeZone } from "@/lib/time-zone";

interface TimeZoneContextValue {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
}

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

/**
 * Read the current time-zone value and its validated setter from context.
 *
 * Returns the provider contract; throws when called outside TimeZoneProvider and performs no network request.
 * refs: none
 */
export function useTimeZone(): TimeZoneContextValue {
  const context = useContext(TimeZoneContext);
  if (!context) throw new Error("useTimeZone must be used within TimeZoneProvider");
  return context;
}

/**
 * Expose validated time-zone state, seeded from the user or browser preference.
 *
 * Accepts children; returns a context provider and persists valid changes locally without API side effects.
 * refs: none
 */
export function TimeZoneProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [timeZone, setTimeZoneState] = useState("UTC");

  useEffect(() => {
    const preferred = user?.timeZone;
    const next = isValidTimeZone(preferred) ? preferred : getPreferredTimeZone();
    savePreferredTimeZone(next);
    setTimeZoneState(next);
  }, [user?.timeZone]);

  const setTimeZone = useCallback((next: string) => {
    if (!isValidTimeZone(next)) return;
    savePreferredTimeZone(next);
    setTimeZoneState(next);
  }, []);

  const value = useMemo(() => ({ timeZone, setTimeZone }), [timeZone, setTimeZone]);

  return (
    <TimeZoneContext.Provider value={value}>
      <Fragment key={timeZone}>{children}</Fragment>
    </TimeZoneContext.Provider>
  );
}
