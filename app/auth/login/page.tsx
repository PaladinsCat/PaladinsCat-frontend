"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

export default function LoginPage() {
  return <Suspense fallback={<LoadingPanel className="min-h-[60vh]" />}><CentralLogin /></Suspense>;
}

function CentralLogin() {
  const { t } = useLocalization();
  const returnPath = useSearchParams().get("redirect") || "/";
  return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-full max-w-md bg-pc-bg-elevated rounded-lg border border-pc-border p-6 text-center">
    <h1 className="text-3xl font-bold text-pc-accent">{t("generated.auth.welcomeBack")}</h1>
    <p className="text-pc-text-secondary mt-2 mb-6">{t("generated.auth.signInToYourAccount")}</p>
    <form action="/api/auth/oidc/login" method="post"><input type="hidden" name="return" value={returnPath} /><button type="submit" className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors">{t("generated.auth.oidc.continue")}</button></form>
    <Link href="/auth/register" className="mt-4 block text-center text-sm text-pc-accent hover:text-pc-accent-light">{t("generated.auth.createAccount")}</Link>
    <p className="mt-4 text-center text-xs text-pc-text-muted">{t("generated.auth.oidc.migrationNotice")}</p>
    <a href="https://translate.paladinscat.com/accounts/login/" className="mt-3 block text-center text-xs text-pc-accent hover:text-pc-accent-light">{t("generated.auth.oidc.translationPortal")}</a>
  </div></div>;
}
