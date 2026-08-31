/**
 * Define the admin changelog page responsibility boundary.
 * Coordinates admin changelog page data loading, authorization, and presentation.
 */
"use client";
import { useEffect, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import {
  fetchAdminChangelog,
  updateAdminChangelog,
  type ChangelogEntry,
} from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { LoadingPanel } from '@/components/async-state';
import { formatLocalDateTime } from '@/lib/time-format';
import { useLocalization } from "@/lib/localization-context";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function AdminChangelogPage() {
  const { t , formatDateTime} = useLocalization();
  const { user, isLoading } = useAuth();
  const isAdmin = user?.isAdmin ?? false;
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchAdminChangelog();
      setEntries(rows);
      setDrafts(Object.fromEntries(rows.map((entry) => [entry.id, entry.changelog])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to load changelog entries.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading && isAdmin) void load();
  }, [isLoading, isAdmin]);

  async function save(entry: ChangelogEntry) {
    setSavingId(entry.id);
    setError(null);
    setStatus(null);
    try {
      const updated = await updateAdminChangelog(entry.id, { changelog: drafts[entry.id] ?? '' });
      setEntries((current) => current.map((item) => item.id === updated.id ? updated : item));
      setDrafts((current) => ({ ...current, [updated.id]: updated.changelog }));
      setStatus(`Saved release ${updated.version || `#${updated.id}`}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Failed to save changelog entry.');
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) return <LoadingPanel />;
  if (!isAdmin) {
    return <div className="space-y-6"><h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.admin.changelogAdmin")}</h1><div className="rounded-lg border border-red-500/30 bg-pc-bg-elevated p-6 text-center"><div className="text-lg font-bold text-red-400">{t("generated.admin.accessDenied")}</div><div className="mt-2 text-sm text-pc-text-muted">{t("generated.admin.thisPageIsRestrictedToAdminAccountsOnly")}</div></div></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.admin.changelogAdmin")}</h1>
          <p className="mt-1 text-sm text-pc-text-secondary">{t("generated.admin.editThePublicReleaseNotesForExistingDeploymentsEmptyText")}</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="pc-btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {t("generated.admin.refresh")}</button>
      </header>

      {error && <div className="text-sm text-red-400">{error}</div>}
      {status && <div className="text-sm text-emerald-400">{status}</div>}

      <section className="space-y-3">
        {entries.map((entry) => {
          const draft = drafts[entry.id] ?? entry.changelog;
          const changed = draft !== entry.changelog;
          return <article key={entry.id} className="rounded-lg border border-pc-border bg-pc-bg-elevated p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-bold text-pc-text">{entry.version || t("generated.admin.deploymentValue1", { value1: entry.id })}</div>
                <div className="mt-1 text-xs text-pc-text-muted">#{entry.id}{entry.gitCommitShort ? t("generated.admin.value1", { value1: entry.gitCommitShort }) : ''}{entry.deployedAt ? t("generated.admin.value1", { value1: formatDateTime(entry.deployedAt) }) : ''}</div>
              </div>
              <button type="button" onClick={() => void save(entry)} disabled={!changed || savingId === entry.id} className="pc-btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"><Save className="h-4 w-4" /> {savingId === entry.id ? t("generated.admin.saving") : t("generated.admin.save")}</button>
            </div>
            <label className="mb-1 block text-xs text-pc-text-muted" htmlFor={`changelog-${entry.id}`}>{t("generated.admin.publicChangelog")}</label>
            <textarea id={`changelog-${entry.id}`} value={draft} onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: event.target.value }))} maxLength={12000} rows={Math.max(4, Math.min(12, draft.split('\n').length + 1))} className="pc-input w-full resize-y font-mono text-xs" placeholder={t("generated.admin.noPublicChangelogText")} />
          </article>;
        })}
        {!loading && entries.length === 0 && <div className="rounded-lg border border-pc-border bg-pc-bg-elevated p-4 text-sm text-pc-text-muted">{t("generated.admin.noDeploymentRecordsFound")}</div>}
      </section>
    </div>
  );
}
