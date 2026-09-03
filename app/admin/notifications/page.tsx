/**
 * Define the admin notifications page responsibility boundary.
 * Coordinates admin notifications page data loading, authorization, and presentation.
 * refs: none
 */
"use client";
import { useEffect, useState } from "react";
import {
  createAdminNotification,
  deleteAdminNotification,
  fetchAdminActivityBanner,
  fetchAdminNotifications,
  updateAdminActivityBanner,
  updateAdminNotification,
  type ActivityBanner,
  type Notification,
  type NotificationInput,
} from "@/lib/api-client";
import { formatLocalDateTime, parseBackendDate } from "@/lib/time-format";
import { useAuth } from "@/lib/auth-context";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

type Draft = {
  timestamp: string;
  importance: number;
  message: string;
};

const emptyDraft: Draft = {
  timestamp: "",
  importance: 0,
  message: "",
};

const emptyActivityBanner: ActivityBanner = { enabled: false, message: "" };

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = parseBackendDate(value);
  if (!date) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoOrUndefined(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function fromNotification(notification: Notification): Draft {
  return {
    timestamp: toLocalInput(notification.timestamp),
    importance: notification.importance,
    message: notification.message,
  };
}

function toInput(draft: Draft): NotificationInput {
  return {
    timestamp: toIsoOrUndefined(draft.timestamp),
    importance: draft.importance,
    message: draft.message.trim(),
  };
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function AdminNotificationsPage() {
  const { t , formatDateTime} = useLocalization();
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [activityBanner, setActivityBanner] = useState<ActivityBanner>(emptyActivityBanner);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Wait for auth to resolve, then check admin status
  const isAdmin = user?.isAdmin ?? false;

  // Load notifications once auth is resolved and user is admin
  async function load() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const [rows, banner] = await Promise.all([fetchAdminNotifications(), fetchAdminActivityBanner()]);
      setNotifications(rows);
      setDrafts(Object.fromEntries(rows.map((notification) => [notification.id, fromNotification(notification)])));
      setActivityBanner(banner);
      setStatus(t("generated.admin.notifications.page.loadednotifications"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.admin.notifications.page.failedtoloadnotifications"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading && isAdmin) {
      load();
    }
  }, [isLoading, isAdmin]);

  async function createNotification() {
    setError(null);
    setStatus(null);
    try {
      if (!newDraft.message.trim()) throw new Error(t("generated.admin.messageIsRequired"));
      await createAdminNotification(toInput(newDraft));
      setNewDraft(emptyDraft);
      await load();
      setStatus(t("generated.admin.notifications.page.notificationcreated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.admin.notifications.page.failedtocreatenotification"));
    }
  }

  async function saveNotification(id: number) {
    setSavingId(id);
    setError(null);
    setStatus(null);
    try {
      await updateAdminNotification(id, toInput(drafts[id]));
      await load();
      setStatus(t("generated.admin.notifications.page.notificationsaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.admin.notifications.page.failedtosavenotification"));
    } finally {
      setSavingId(null);
    }
  }

  async function removeNotification(id: number) {
    setSavingId(id);
    setError(null);
    setStatus(null);
    try {
      await deleteAdminNotification(id);
      await load();
      setStatus(t("generated.admin.notifications.page.notificationdeleted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.admin.notifications.page.failedtodeletenotification"));
    } finally {
      setSavingId(null);
    }
  }

  async function saveActivityBanner() {
    setSavingBanner(true);
    setError(null);
    setStatus(null);
    try {
      const message = activityBanner.message.trim();
      if (activityBanner.enabled && !message) throw new Error(t("generated.admin.messageIsRequired"));
      const saved = await updateAdminActivityBanner({ enabled: activityBanner.enabled, message });
      setActivityBanner(saved);
      setStatus(t("generated.admin.notifications.page.notificationsaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.admin.notifications.page.failedtosavenotification"));
    } finally {
      setSavingBanner(false);
    }
  }

  function updateDraft(id: number, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  function updateNewDraft(patch: Partial<Draft>) {
    setNewDraft((current) => ({ ...current, ...patch }));
  }

  // Show loading state while auth resolves
  if (isLoading) {
    return <LoadingPanel />;
  }

  // Not admin — deny access
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="pc-heading pc-heading-lg">{t("generated.admin.notificationsAdmin")}</h1>
        <div className="bg-pc-bg-elevated border border-red-500/30 rounded-lg p-6 text-center space-y-2">
          <div className="text-lg font-bold text-red-400">{t("generated.admin.accessDenied")}</div>
          <div className="text-sm text-pc-text-muted">
            {t("generated.admin.thisPageIsRestrictedToAdminAccountsOnly")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="pc-heading pc-heading-lg">{t("generated.admin.notificationsAdmin")}</h1>
        <div className="text-xs text-pc-text-muted">
          {t("generated.admin.loggedInAs")}{" "}<span className="text-pc-text">{user?.username}</span>
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}
      {status && <div className="text-sm text-emerald-400">{status}</div>}

      <section className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-pc-text">{t("siteBanner.title")}</h2>
          <label className="inline-flex items-center gap-2 text-sm text-pc-text-secondary">
            <input
              type="checkbox"
              checked={activityBanner.enabled}
              onChange={(event) => setActivityBanner((current) => ({ ...current, enabled: event.target.checked }))}
            />
            {t("menu.enabled")}
          </label>
        </div>
        <div>
          <label className="block text-xs text-pc-text-muted mb-1">{t("generated.admin.message")}</label>
          <textarea
            value={activityBanner.message}
            onChange={(event) => setActivityBanner((current) => ({ ...current, message: event.target.value }))}
            rows={3}
            maxLength={500}
            className="pc-input w-full resize-y"
          />
        </div>
        <button
          type="button"
          onClick={() => void saveActivityBanner()}
          disabled={savingBanner}
          className="px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm disabled:opacity-50"
        >
          {t("generated.admin.save")}
        </button>
      </section>

      <section className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-bold text-pc-text">{t("generated.admin.createNotification")}</h2>
        <NotificationEditor draft={newDraft} onChange={updateNewDraft} />
        <button
          type="button"
          onClick={createNotification}
          className="px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm"
        >
          {t("generated.admin.create")}</button>
      </section>

      <section className="space-y-3">
        {notifications.map((notification) => {
          const draft = drafts[notification.id] ?? fromNotification(notification);
          return (
            <div key={notification.id} className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-xs text-pc-text-muted">#{notification.id}</div>
                  <div className="text-sm text-pc-text-secondary">
                    {formatDateTime(notification.timestamp)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveNotification(notification.id)}
                    disabled={savingId === notification.id}
                    className="px-3 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm disabled:opacity-50"
                  >
                    {t("generated.admin.save")}</button>
                  <button
                    type="button"
                    onClick={() => removeNotification(notification.id)}
                    disabled={savingId === notification.id}
                    className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm disabled:opacity-50"
                  >
                    {t("generated.admin.delete")}</button>
                </div>
              </div>
              <NotificationEditor draft={draft} onChange={(patch) => updateDraft(notification.id, patch)} />
            </div>
          );
        })}
        {!loading && notifications.length === 0 && (
          <div className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 text-sm text-pc-text-muted">
            {t("generated.admin.noNotificationsFound")}</div>
        )}
      </section>
    </div>
  );
}

function NotificationEditor({ draft, onChange }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  const { t } = useLocalization();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
      <div className="lg:col-span-4">
        <label className="block text-xs text-pc-text-muted mb-1">{t("generated.admin.message")}</label>
        <textarea
          value={draft.message}
          onChange={(event) => onChange({ message: event.target.value })}
          rows={3}
          className="pc-input w-full resize-y"
          maxLength={500}
        />
      </div>
      <div>
        <label className="block text-xs text-pc-text-muted mb-1">{t("generated.admin.importance")}</label>
        <input
          type="number"
          value={draft.importance}
          onChange={(event) => onChange({ importance: Number(event.target.value) })}
          className="pc-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs text-pc-text-muted mb-1">{t("generated.admin.timestamp")}</label>
        <input
          type="datetime-local"
          value={draft.timestamp}
          onChange={(event) => onChange({ timestamp: event.target.value })}
          className="pc-input w-full"
        />
      </div>
    </div>
  );
}
