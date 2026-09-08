/**
 * Render page layout with `RouteSettledProvider`.
 * refs: documents/06-reference/frontend-design-system.md#title-motion
 */
"use client";

import { usePathname } from "next/navigation";
import { RouteSettledProvider } from "@/lib/route-transition-context";

/**
 * Render page layout with `RouteSettledProvider`.
 * Contract: wraps every route, including the root route, in the shared entry-fade stage.
 * refs: documents/06-reference/frontend-design-system.md#title-motion
 * I/O types: `{ children }: { children: React.ReactNode } -> JSX.Element`.
 */
export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RouteSettledProvider value>
      <div key={pathname} className="pc-route-stage">
        {children}
      </div>
    </RouteSettledProvider>
  );
}
