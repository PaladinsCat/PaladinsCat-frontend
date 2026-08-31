/** PageLayout component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import { usePathname } from "next/navigation";
import { RouteSettledProvider } from "@/lib/route-transition-context";

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function PageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <RouteSettledProvider value><div>{children}</div></RouteSettledProvider>;
  }

  return (
    <RouteSettledProvider value>
      <div key={pathname} className="pc-route-stage">
        {children}
      </div>
    </RouteSettledProvider>
  );
}
