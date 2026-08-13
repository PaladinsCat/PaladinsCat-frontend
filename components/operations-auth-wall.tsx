"use client";

import { LockKeyhole } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocalization } from "@/lib/localization-context";

export function OperationsAuthWall() {
  const { t } = useLocalization();
  const pathname = usePathname();
  return (
    <div className="mx-auto max-w-xl pc-card p-7 text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-pc-accent" />
      <h1 className="mt-3 text-xl font-bold text-pc-text">{t("generated.operations.tickets")}</h1>
      <p className="mt-2 text-sm text-pc-text-secondary">{t("generated.auth.signInToYourAccount")}</p>
      <form action="/api/auth/oidc/login" method="post" className="mt-5">
        <input type="hidden" name="return" value={pathname} />
        <button type="submit" className="pc-btn-primary text-sm">{t("generated.auth.signIn")}</button>
      </form>
    </div>
  );
}
