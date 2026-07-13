"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { CONTRIBUTOR_LOCALES, type ContributorLocale } from "@/lib/localization/locales";
import { useLocalization } from "@/lib/localization-context";
import { applyForLocalization, createLocalizationPullRequest, getLocalizationMe, getLocalizationModule, saveLocalizationDraft, type LocalizationModulePayload } from "@/lib/localization-api";

const MODULE_LABELS: Record<string, string> = {
  "ui/navigation": "localization.module.uiNavigation", "ui/footer": "localization.module.uiFooter", "ui/async": "localization.module.uiAsync",
  "pages/home": "localization.module.pagesHome", "pages/localization": "localization.module.pagesLocalization", "system/status": "localization.module.systemStatus", "game/talents": "localization.module.gameTalents", "game/items": "localization.module.gameItems",
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
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshAccess = useCallback(async () => {
    try { setAccess(await getLocalizationMe()); } catch (reason) { setError(reason instanceof Error ? reason.message : t("localization.error")); }
  }, [t]);

  const loadModule = useCallback(async () => {
    if (!access?.isContributor) return;
    setLoading(true); setError(null); setNotice(null);
    try {
      const next = await getLocalizationModule(locale, module);
      setPayload(next); setMessages(next.draft ?? next.existing);
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("localization.error")); }
    finally { setLoading(false); }
  }, [access?.isContributor, locale, module, t]);

  useEffect(() => { if (user) void refreshAccess(); }, [user, refreshAccess]);
  useEffect(() => { void loadModule(); }, [loadModule]);

  async function submitApplication() {
    setError(null); setNotice(null);
    try { await applyForLocalization(application); await refreshAccess(); setNotice(t("localization.pending")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t("localization.error")); }
  }
  async function saveDraft() {
    setError(null); setNotice(null);
    try { await saveLocalizationDraft(locale, module, messages); setNotice(t("localization.saved")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t("localization.error")); }
  }
  async function submitPullRequest() {
    setError(null); setNotice(null);
    try { await saveLocalizationDraft(locale, module, messages); const result = await createLocalizationPullRequest(locale, module); setNotice(`${t("localization.published")} #${result.pullRequest.number}`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t("localization.error")); }
  }

  if (authLoading) return <div className="pc-card text-sm text-pc-text-muted">{t("localization.loading")}</div>;
  if (!user) return <section className="pc-card space-y-3"><h1 className="pc-heading pc-heading-lg">{t("localization.title")}</h1><p className="text-sm text-pc-text-secondary">{t("localization.signIn")}</p><Link href="/auth/login" className="pc-btn-primary inline-flex">{t("nav.login")}</Link></section>;

  if (!access?.isContributor) return <section className="pc-card max-w-2xl space-y-4"><h1 className="pc-heading pc-heading-lg">{t("localization.title")}</h1><p className="text-sm text-pc-text-secondary">{t("localization.description")}</p><h2 className="text-base font-bold">{t("localization.applyTitle")}</h2><p className="text-sm text-pc-text-muted">{access?.accessRequest?.status === "pending" ? t("localization.pending") : access?.accessRequest?.status === "denied" ? t("localization.denied") : t("localization.applyDescription")}</p><label className="block text-sm font-medium">{t("localization.applicationLabel")}<textarea value={application} onChange={(event) => setApplication(event.target.value)} maxLength={1000} className="mt-2 min-h-28 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm" /></label><button type="button" onClick={() => void submitApplication()} className="pc-btn-primary">{t("localization.submitApplication")}</button>{error && <p className="text-sm text-rose-300">{error}</p>}{notice && <p className="text-sm text-emerald-300">{notice}</p>}</section>;

  return <section className="space-y-5"><header><h1 className="pc-heading pc-heading-lg">{t("localization.title")}</h1><p className="mt-1 text-sm text-pc-text-secondary">{t("localization.description")}</p></header><div className="pc-card flex flex-wrap gap-3"><label className="text-sm">{t("localization.locale")}<select value={locale} onChange={(event) => setLocale(event.target.value as ContributorLocale)} className="ml-2 rounded border border-pc-border bg-pc-bg px-2 py-1">{CONTRIBUTOR_LOCALES.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}</select></label><label className="text-sm">{t("localization.module")}<select value={module} onChange={(event) => setModule(event.target.value)} className="ml-2 rounded border border-pc-border bg-pc-bg px-2 py-1">{Object.entries(MODULE_LABELS).map(([value, key]) => <option key={value} value={value}>{t(key as never)}</option>)}</select></label></div>{loading && <div className="pc-card text-sm text-pc-text-muted">{t("localization.loading")}</div>}{payload && <div className="space-y-3">{Object.entries(payload.english).map(([key, source]) => <div key={key} className="grid gap-2 rounded-xl border border-pc-border bg-pc-bg-secondary p-3 md:grid-cols-2"><div><div className="text-[10px] uppercase tracking-wide text-pc-text-muted">{t("localization.source")}</div><div className="mt-1 text-sm text-pc-text">{source}</div></div><label><span className="text-[10px] uppercase tracking-wide text-pc-text-muted">{t("localization.translation")}</span><textarea value={messages[key] ?? ""} placeholder={t("localization.emptyTranslation")} onChange={(event) => setMessages((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 min-h-16 w-full rounded border border-pc-border bg-pc-bg px-2 py-1 text-sm" /></label></div>)}</div>}<div className="flex flex-wrap gap-2"><button type="button" onClick={() => void saveDraft()} className="pc-btn-secondary">{t("localization.saveDraft")}</button><button type="button" onClick={() => void submitPullRequest()} className="pc-btn-primary">{t("localization.submitPullRequest")}</button></div>{error && <p className="text-sm text-rose-300">{error}</p>}{notice && <p className="text-sm text-emerald-300">{notice}</p>}</section>;
}
