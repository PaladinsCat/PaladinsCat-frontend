"use client";

import { useLocalization } from "@/lib/localization-context";

export default function RegisterPage() {
  const { t } = useLocalization();
  return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-full max-w-md bg-pc-bg-elevated rounded-lg border border-pc-border p-6 text-center">
    <h1 className="text-3xl font-bold text-pc-accent">{t("generated.auth.createAccount")}</h1><p className="text-pc-text-secondary mt-2 mb-6">{t("generated.auth.joinThePaladinscatCommunity")}</p>
    <form action="/api/auth/oidc/login" method="post"><input type="hidden" name="intent" value="create" /><button type="submit" className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors">{t("generated.auth.createAccount")}</button></form>
  </div></div>;
}
