"use client";

import { useLocalization } from "@/lib/localization-context";

export function LoginFailure({ href }: { href: string }) {
  const { t } = useLocalization();
  return <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="w-full max-w-sm text-center">
      <p className="mb-4 text-sm text-red-400">{t("generated.auth.login.page.loginfailed")}</p>
      <a href={href} className="pc-btn-primary block w-full">{t("generated.auth.oidc.continue")}</a>
    </div>
  </div>;
}
