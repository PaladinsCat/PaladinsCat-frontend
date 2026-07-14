"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CONTRIBUTOR_LOCALES, type ContributorLocale } from "@/lib/localization/locales";
import { useLocalization } from "@/lib/localization-context";
import {
  applyForLocalization,
  createLocalizationSubmission,
  createLocalizationToken,
  getLocalizationMe,
  getLocalizationModule,
  getLocalizationProgress,
  getLocalizationTokens,
  getMyLocalizationSubmissions,
  revokeLocalizationToken,
  saveLocalizationDraft,
  type LocalizationModulePayload,
  type LocalizationProgress,
  type LocalizationSubmission,
  type LocalizationToken,
} from "@/lib/localization-api";

const MODULE_LABELS: Record<string, string> = {
  "ui/navigation": "localization.module.uiNavigation",
  "ui/footer": "localization.module.uiFooter",
  "ui/async": "localization.module.uiAsync",
  "pages/home": "localization.module.pagesHome",
  "pages/localization": "localization.module.pagesLocalization",
  "system/status": "localization.module.systemStatus",
  "game/talents": "localization.module.gameTalents",
  "game/items": "localization.module.gameItems",
};

export default function LocalizationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLocalization();
  const [access, setAccess] = useState<{ isContributor: boolean; accessRequest: { status: string } | null } | null>(null);
  const [application, setApplication] = useState("");
  const [locale, setLocale] = useState<ContributorLocale>("de");
  const [module, setModule] = useState("ui/navigation");
  const [payload, setPayload] = useState<LocalizationModulePayload | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<LocalizationProgress | null>(null);
  const [tokens, setTokens] = useState<LocalizationToken[]>([]);
  const [submissions, setSubmissions] = useState<LocalizationSubmission[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshProgress = useCallback(async () => {
    try { setProgress(await getLocalizationProgress("website")); } catch { /* progress is supplementary */ }
  }, []);

  const refreshAccount = useCallback(async () => {
    try {
      const [nextAccess, nextTokens, nextSubmissions] = await Promise.all([
        getLocalizationMe(),
        getLocalizationTokens(),
        getMyLocalizationSubmissions(),
      ]);
      setAccess(nextAccess);
      setTokens(nextTokens);
      setSubmissions(nextSubmissions);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }, [t]);

  const loadModule = useCallback(async () => {
    if (!user || !access) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const next = await getLocalizationModule(locale, module);
      setPayload(next);
      setMessages(next.draft ?? next.existing);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    } finally {
      setLoading(false);
    }
  }, [access, locale, module, t, user]);

  useEffect(() => { void refreshProgress(); }, [refreshProgress]);
  useEffect(() => { if (user) void refreshAccount(); }, [user, refreshAccount]);
  useEffect(() => { void loadModule(); }, [loadModule]);

  async function submitApplication() {
    setError(null);
    setNotice(null);
    try {
      await applyForLocalization(application);
      await refreshAccount();
      setNotice(t("localization.pending"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }

  async function saveDraft() {
    setError(null);
    setNotice(null);
    try {
      await saveLocalizationDraft(locale, module, messages);
      setNotice(t("localization.saved"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }

  async function submitForReview() {
    if (!payload) return;
    setError(null);
    setNotice(null);
    const translations = Object.entries(messages)
      .filter(([, text]) => text.trim().length > 0)
      .map(([key, text]) => ({ namespace: module, key, text }));
    try {
      await saveLocalizationDraft(locale, module, messages);
      const submission = await createLocalizationSubmission({
        locale,
        baseRevision: payload.revision,
        translations,
      });
      setNotice(`${t("localization.submittedForReview")} ${submission.id}`);
      await Promise.all([refreshProgress(), refreshAccount()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }

  async function createCliToken() {
    setError(null);
    setNewToken(null);
    try {
      const result = await createLocalizationToken("Contributor CLI");
      setNewToken(result.token);
      await refreshAccount();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }

  async function revokeCliToken(tokenId: number) {
    try {
      await revokeLocalizationToken(tokenId);
      await refreshAccount();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }

  const progressPanel = progress && (
    <div className="pc-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">{t("localization.progress")}</h2>
        <span className="text-xs text-pc-text-muted">{progress.totalKeys} {t("localization.keys")}</span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {progress.languages.map((language) => (
          <div key={language.locale} className="rounded-lg border border-pc-border p-3">
            <div className="flex justify-between text-sm"><span>{language.locale}</span><span>{language.percent}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-pc-bg">
              <div className="h-full bg-emerald-400" style={{ width: `${language.percent}%` }} />
            </div>
            <div className="mt-2 text-xs text-pc-text-muted">
              {language.approvedKeys}/{progress.totalKeys} · {language.pendingSubmissions} {t("localization.pendingShort")}
              {language.staleSubmissions > 0 && <> · {language.staleSubmissions} {t("localization.staleShort")}</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (authLoading) return <div className="pc-card text-sm text-pc-text-muted">{t("localization.loading")}</div>;
  if (!user) return (
    <section className="space-y-5">
      {progressPanel}
      <div className="pc-card space-y-3">
        <h1 className="pc-heading pc-heading-lg">{t("localization.title")}</h1>
        <p className="text-sm text-pc-text-secondary">{t("localization.signInOpen")}</p>
        <Link href="/auth/login" className="pc-btn-primary inline-flex">{t("nav.login")}</Link>
      </div>
    </section>
  );

  if (!access) return <div className="pc-card text-sm text-pc-text-muted">{t("localization.loading")}</div>;

  return (
    <section className="space-y-5">
      <header>
        <h1 className="pc-heading pc-heading-lg">{t("localization.title")}</h1>
        <p className="mt-1 text-sm text-pc-text-secondary">{t("localization.openDescription")}</p>
      </header>
      {progressPanel}

      <div className="pc-card flex flex-wrap gap-3">
        <label className="text-sm">{t("localization.locale")}
          <select value={locale} onChange={(event) => setLocale(event.target.value as ContributorLocale)} className="ml-2 rounded border border-pc-border bg-pc-bg px-2 py-1">
            {CONTRIBUTOR_LOCALES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm">{t("localization.module")}
          <select value={module} onChange={(event) => setModule(event.target.value)} className="ml-2 rounded border border-pc-border bg-pc-bg px-2 py-1">
            {Object.entries(MODULE_LABELS).map(([value, key]) => <option key={value} value={value}>{t(key as never)}</option>)}
          </select>
        </label>
      </div>

      {loading && <div className="pc-card text-sm text-pc-text-muted">{t("localization.loading")}</div>}
      {payload && (
        <div className="space-y-3">
          {Object.entries(payload.english).map(([key, source]) => (
            <div key={key} className="grid gap-2 rounded-xl border border-pc-border bg-pc-bg-secondary p-3 md:grid-cols-2">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-pc-text-muted">{t("localization.source")}</div>
                <div className="mt-1 text-sm text-pc-text">{source}</div>
              </div>
              <label>
                <span className="text-[10px] uppercase tracking-wide text-pc-text-muted">{t("localization.translation")}</span>
                <textarea value={messages[key] ?? ""} placeholder={t("localization.emptyTranslation")} onChange={(event) => setMessages((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 min-h-16 w-full rounded border border-pc-border bg-pc-bg px-2 py-1 text-sm" />
              </label>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void saveDraft()} className="pc-btn-secondary">{t("localization.saveDraft")}</button>
        <button type="button" onClick={() => void submitForReview()} className="pc-btn-primary">{t("localization.submitForReview")}</button>
      </div>

      <div className="pc-card">
        <h2 className="text-base font-bold">{t("localization.mySubmissions")}</h2>
        <div className="mt-3 space-y-2">
          {submissions.slice(0, 10).map((submission) => (
            <div key={submission.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-pc-border p-2 text-xs">
              <span>{submission.locale} · {submission.keyCount} {t("localization.keys")} · {submission.status}</span>
              {submission.pullRequest && <a href={submission.pullRequest.url} target="_blank" rel="noreferrer" className="text-emerald-300">PR #{submission.pullRequest.number}</a>}
            </div>
          ))}
          {submissions.length === 0 && <p className="text-sm text-pc-text-muted">{t("localization.noMySubmissions")}</p>}
        </div>
      </div>

      <details className="pc-card">
        <summary className="cursor-pointer text-sm font-bold">{t("localization.localTolgee")}</summary>
        <p className="mt-3 text-sm text-pc-text-secondary">{t("localization.localTolgeeDescription")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void createCliToken()} className="pc-btn-secondary text-sm">{t("localization.createCliToken")}</button>
          <a href="https://github.com/NabiCook/PaladinsCat-locales/blob/main/docs/SELF_HOSTED_TOLGEE.md" className="pc-btn-secondary text-sm" target="_blank" rel="noreferrer">{t("localization.setupGuide")}</a>
        </div>
        {newToken && (
          <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3">
            <p className="text-xs text-amber-200">{t("localization.tokenOnce")}</p>
            <code className="mt-2 block break-all text-xs">{newToken}</code>
          </div>
        )}
        <div className="mt-3 space-y-2">
          {tokens.filter((token) => !token.revokedAt).map((token) => (
            <div key={token.id} className="flex items-center justify-between rounded border border-pc-border p-2 text-xs">
              <span>{token.name} · {token.prefix}…</span>
              <button type="button" onClick={() => void revokeCliToken(token.id)} className="text-rose-300">{t("localization.revoke")}</button>
            </div>
          ))}
        </div>
      </details>

      {!access.isContributor && (
        <details className="pc-card max-w-2xl">
          <summary className="cursor-pointer text-sm font-bold">{t("localization.applyTitle")}</summary>
          <p className="mt-3 text-sm text-pc-text-muted">{access.accessRequest?.status === "pending" ? t("localization.pending") : access.accessRequest?.status === "denied" ? t("localization.denied") : t("localization.trustedDescription")}</p>
          <label className="mt-3 block text-sm font-medium">{t("localization.applicationLabel")}
            <textarea value={application} onChange={(event) => setApplication(event.target.value)} maxLength={1000} className="mt-2 min-h-24 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm" />
          </label>
          <button type="button" onClick={() => void submitApplication()} className="pc-btn-secondary mt-3">{t("localization.submitApplication")}</button>
        </details>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {notice && <p className="text-sm text-emerald-300">{notice}</p>}
    </section>
  );
}
