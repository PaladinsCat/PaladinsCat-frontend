"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api-client";
import { AsyncButton } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

export default function RegisterPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // CRITICAL: Validate password confirmation. Without it, typos lock users
    // out permanently (no password reset flow exists).
    // Source: Fault #7 — "No password confirmation field"
    if (password !== passwordConfirm) {
      setError(t("generated.auth.passwordsDoNotMatch"));
      return;
    }
    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.auth.register.page.registrationfailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pc-accent">{t("generated.auth.createAccount")}</h1>
          <p className="text-pc-text-secondary mt-2">{t("generated.auth.joinThePaladinscatCommunity")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.auth.username")}</label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.auth.chooseAUsername3Chars")}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.auth.email")}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.auth.yourEmailCom")}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.auth.password")}</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.auth.text6Characters")}
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-pc-text-secondary mb-1">
              {t("generated.auth.confirmPassword")}</label>
            <input
              id="passwordConfirm"
              type="password"
              required
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
              placeholder={t("generated.auth.reEnterPassword")}
            />
          </div>

          <AsyncButton
            type="submit"
            loading={loading}
            className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("generated.auth.createAccount")}</AsyncButton>

          <p className="text-center text-pc-text-secondary text-sm">
            {t("generated.auth.alreadyHaveAnAccount")}{" "}
            <Link href="/auth/login" className="text-pc-accent hover:text-pc-accent-light transition-colors">
              {t("generated.auth.signIn.ada2e9e")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
