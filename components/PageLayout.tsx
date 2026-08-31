"use client";

import { usePathname } from "next/navigation";
import { RouteSettledProvider } from "@/lib/route-transition-context";

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
