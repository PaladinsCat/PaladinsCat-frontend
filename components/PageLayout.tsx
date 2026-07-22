"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ROUTE_CONTENT_SETTLE_MS,
  ROUTE_ENTER_DURATION_MS,
  RouteSettledProvider,
} from "@/lib/route-transition-context";

const ROUTE_ENTER_EASE = [0.22, 1, 0.36, 1] as const;

export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [settledPath, setSettledPath] = useState<string | null>(() => pathname === "/" ? pathname : null);

  useEffect(() => {
    if (pathname === "/") return;

    const timer = window.setTimeout(
      () => setSettledPath(pathname),
      reduceMotion ? 0 : ROUTE_CONTENT_SETTLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pathname, reduceMotion]);

  const routeSettled = settledPath === pathname;

  if (pathname === "/") {
    return <RouteSettledProvider value><div>{children}</div></RouteSettledProvider>;
  }

  return (
    <RouteSettledProvider value={routeSettled}>
      <motion.div
        key={pathname}
        className="pc-route-stage"
        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.992 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : { duration: ROUTE_ENTER_DURATION_MS / 1000, ease: ROUTE_ENTER_EASE }}
      >
        {children}
      </motion.div>
    </RouteSettledProvider>
  );
}
