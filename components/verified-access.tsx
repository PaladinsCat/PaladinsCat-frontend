/** Enforces verified-account access for gated detail routes. */
"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RouteSkeleton } from "@/components/route-skeleton";
import { useAuth } from "@/lib/auth-context";
import { isVerifiedOnlyPath, verifiedDestination } from "@/lib/verified-access";
import { localPreviewAccessEnabled, useLocalPreviewAccess } from "@/lib/use-local-preview-access";

/** Keep public directory portals visible while routing detail-page visitors by account state. */
export function VerifiedAccess({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const localPreview = useLocalPreviewAccess();
  const protectedPath = isVerifiedOnlyPath(pathname) && !localPreview;
  const destination = verifiedDestination(pathname, user, isLoading);

  useEffect(() => {
    if (localPreviewAccessEnabled()) return;
    if (!protectedPath || destination == null || destination === pathname) return;
    const requestedPath = `${window.location.pathname}${window.location.search}`;
    router.replace(verifiedDestination(requestedPath, user, false) ?? destination);
  }, [destination, pathname, protectedPath, router, user]);

  if (!protectedPath) return children;
  if (destination == null || destination !== pathname) return <RouteSkeleton variant="dashboard" />;
  return children;
}
