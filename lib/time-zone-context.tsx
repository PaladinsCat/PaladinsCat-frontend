"use client";

import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { getPreferredTimeZone, isValidTimeZone, savePreferredTimeZone } from "@/lib/time-zone";

interface TimeZoneContextValue {
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
}

const TimeZoneContext = createContext<TimeZoneContextValue | null>(null);

export function useTimeZone(): TimeZoneContextValue {
  const context = useContext(TimeZoneContext);
  if (!context) throw new Error("useTimeZone must be used within TimeZoneProvider");
  return context;
}

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
