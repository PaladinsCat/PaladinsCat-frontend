"use client";

import { createContext, useContext } from "react";

export const ROUTE_ENTER_DURATION_MS = 460;
export const ROUTE_CONTENT_SETTLE_MS = ROUTE_ENTER_DURATION_MS + 40;

const RouteSettledContext = createContext(true);

export const RouteSettledProvider = RouteSettledContext.Provider;

export function useRouteSettled() {
  return useContext(RouteSettledContext);
}

export function useRouteSettledLoading(loading: boolean) {
  return loading || !useRouteSettled();
}
