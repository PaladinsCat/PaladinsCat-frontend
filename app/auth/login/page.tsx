"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AsyncButton, LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import { isApiErrorKey } from "@/lib/api-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingPanel className="min-h-[60vh]" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t } = useLocalization();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      router.push(redirectPath);
    } catch (err) {
      if (!(err instanceof Error) || !err.message) {
        setError(t("generated.auth.login.page.loginfailed"));
      } else {
        setError(isApiErrorKey(err.message) ? t(err.message) : err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pc-accent">{t("generated.auth.welcomeBack")}</h1>
          <p className="text-pc-text-secondary mt-2">{t("generated.auth.signInToYourAccount")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.auth.usernameOrEmail")}</label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.auth.enterUsernameOrEmail")}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.auth.password")}</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.auth.enterPassword")}
            />
          </div>

          <AsyncButton
            type="submit"
            loading={loading}
            className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("generated.auth.signIn")}</AsyncButton>
        </form>

        <div className="bg-pc-bg-elevated rounded-lg border border-pc-border px-6 pb-6 space-y-4">
          <div className="relative py-1 text-center text-xs text-pc-text-muted before:absolute before:left-0 before:right-0 before:top-1/2 before:border-t before:border-pc-border"><span className="relative bg-pc-bg-elevated px-2">{t("generated.auth.oidc.divider")}</span></div>
          <form action="/api/auth/oidc/login" method="post">
            <input type="hidden" name="return" value={redirectPath} />
            <button type="submit" className="w-full py-2.5 border border-pc-accent text-pc-accent font-semibold rounded-lg hover:bg-pc-accent/10 transition-colors">{t("generated.auth.oidc.continue")}</button>
          </form>
          <p className="text-center text-xs text-pc-text-muted">{t("generated.auth.oidc.migrationNotice")}</p>
          <a href="https://translate.paladinscat.com/accounts/login/" className="block text-center text-xs text-pc-accent hover:text-pc-accent-light">{t("generated.auth.oidc.translationPortal")}</a>

          <p className="text-center text-pc-text-secondary text-sm">
            {t("generated.auth.donTHaveAnAccount")}{" "}
            <Link href="/auth/register" className="text-pc-accent hover:text-pc-accent-light transition-colors">
              {t("generated.auth.createOne")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
