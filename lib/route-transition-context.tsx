/**
 * Defines route-transition-context's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 */
"use client";

import { createContext, useContext } from "react";

// Keep the transition perceptible without making content wait behind an
// animation. Data readiness is governed by the request itself, not by the
// decorative route motion.
/**
 * Defines the  r o u t e_ e n t e r_ d u r a t i o n_ m s contract used by this module.
 */
export const ROUTE_ENTER_DURATION_MS = 120;
/**
 * Defines the  r o u t e_ c o n t e n t_ s e t t l e_ m s contract used by this module.
 */
export const ROUTE_CONTENT_SETTLE_MS = 0;

const RouteSettledContext = createContext(true);

/**
 * Names the route-settled context value used by this module.
 */
export const RouteSettledProvider = RouteSettledContext.Provider;

/**
 * Exposes route-settled state to React consumers.
 */
export function useRouteSettled() {
  return useContext(RouteSettledContext);
}

/**
 * Exposes route-settled loading state to React consumers.
 */
export function useRouteSettledLoading(loading: boolean) {
  const routeSettled = useRouteSettled();
  return loading || !routeSettled;
}
