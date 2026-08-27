"use client";

import { createContext, useContext } from "react";

// Keep the transition perceptible without making content wait behind an
// animation. Data readiness is governed by the request itself, not by the
// decorative route motion.
export const ROUTE_ENTER_DURATION_MS = 120;
export const ROUTE_CONTENT_SETTLE_MS = 0;

const RouteSettledContext = createContext(true);

export const RouteSettledProvider = RouteSettledContext.Provider;

export function useRouteSettled() {
  return useContext(RouteSettledContext);
}

export function useRouteSettledLoading(loading: boolean) {
  const routeSettled = useRouteSettled();
  return loading || !routeSettled;
}
