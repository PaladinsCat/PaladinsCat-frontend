/** PageLayout component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: documents/06-reference/frontend-design-system.md#title-motion
 */
"use client";

import { usePathname } from "next/navigation";
import { RouteSettledProvider } from "@/lib/route-transition-context";

/** Provide this exported item.
 * Contract: wraps every route, including the root route, in the shared entry-fade stage.
 * Returns: `React.JSX.Element`
 * refs: documents/06-reference/frontend-design-system.md#title-motion
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
