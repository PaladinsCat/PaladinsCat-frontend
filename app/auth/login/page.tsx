"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

export default function LoginPage() {
  return <Suspense fallback={<LoadingPanel className="min-h-[60vh]" />}><LoginRedirect /></Suspense>;
}

function LoginRedirect() {
  const { t } = useLocalization();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const returnPath = searchParams.get("redirect") || "/";
  const hasOidcError = searchParams.get("oidc_error") === "1";

  useEffect(() => {
    if (!hasOidcError) formRef.current?.requestSubmit();
  }, [hasOidcError]);

  return <div className="min-h-[60vh] flex items-center justify-center px-4">
    <form ref={formRef} action="/api/auth/oidc/login" method="post" className="w-full max-w-sm text-center">
      <input type="hidden" name="return" value={returnPath} />
      {hasOidcError ? <>
        <p className="mb-4 text-sm text-red-400">{t("generated.auth.login.page.loginfailed")}</p>
        <button type="submit" className="pc-btn-primary w-full">{t("generated.auth.oidc.continue")}</button>
      </> : <LoadingPanel />}
    </form>
  </div>;
}
