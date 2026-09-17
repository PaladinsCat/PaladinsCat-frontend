/**
 * Enforce account access policy at the application boundary.
 * Owns the neutral restriction surface and isolated prototype route bridge; policy evaluation remains in auth state.
 * refs:
 * - doc: documents/01-foundations/commenting-standard.md
 * - doc: documents/06-reference/design/frontend-design-system.md
 * - doc: documents/02-technical/security/auth.md
 */
"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocalization } from "@/lib/localization-context";

/**
 * Render the localized account-restriction surface without exposing policy details.
 * Contract: displays the enforced-access state, forwards sign-out intent to onLogout, and renders no route children.
 * refs:
 * - doc: documents/06-reference/design/frontend-design-system.md
 * - doc: documents/02-technical/security/auth.md
 * I/O types: `{ onLogout?: () => void; loggingOut?: boolean; } -> JSX.Element`.
 */
export function RestrictedAccountSurface({
  onLogout,
  loggingOut = false,
}: {
  onLogout?: () => void;
  loggingOut?: boolean;
}) {
  const { t } = useLocalization();
  const appealHref = `mailto:nabicook@proton.me?subject=${encodeURIComponent(t("common.access.appealSubject"))}`;

  return (
    <div className="flex min-h-[100svh] w-full items-center justify-center bg-pc-bg p-4 sm:p-12">
      <main className="pc-card w-full max-w-md" aria-labelledby="restricted-account-title">
        <h1 className="pc-heading pc-heading-lg" id="restricted-account-title">
          {t("common.access.restrictedTitle")}
        </h1>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a className="pc-btn-primary min-h-11 flex-1 no-underline" href={appealHref}>
            {t("common.access.contactModeration")}
          </a>
          <button className="pc-btn-secondary min-h-11 flex-1" type="button" onClick={onLogout} disabled={loggingOut}>
            {loggingOut ? t("common.access.signingOut") : t("common.access.signOut")}
          </button>
        </div>
      </main>
    </div>
  );
}

/**
 * Gate shell rendering behind the authenticated account restriction state.
 * Contract: renders children for unrestricted sessions, a neutral loading state while a cookie-backed session resolves, and the restriction surface for restricted sessions or the isolated prototype route.
 * refs:
 * - doc: documents/06-reference/design/frontend-design-system.md
 * - doc: documents/02-technical/security/auth.md
 * I/O types: `{ children: ReactNode; hasServerSession: boolean; } -> JSX.Element`.
 */
export default function RestrictedAccountGate({
  children,
  hasServerSession,
}: {
  children: ReactNode;
  hasServerSession: boolean;
}) {
  const { user, isLoading, logout } = useAuth();
  const { t } = useLocalization();
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  if (pathname === "/prototype/access-policy") {
    return <RestrictedAccountSurface />;
  }

  // Cookie-backed sessions are held behind this neutral state until /auth/me
  // confirms the account. This prevents server-rendered route content from
  // becoming visible before a restricted session is known to the client.
  if (isLoading && hasServerSession) {
    return <div className="min-h-[100svh] bg-pc-bg" aria-busy="true" aria-label={t("common.access.checkingAccount")} />;
  }

  const restriction = user?.accessRestriction;
  if (!restriction) {
    return <>{children}</>;
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return <RestrictedAccountSurface onLogout={() => void handleLogout()} loggingOut={loggingOut} />;
}
