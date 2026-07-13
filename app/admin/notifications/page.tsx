"use client";

import { useEffect, useState } from "react";
import {
  createAdminNotification,
  deleteAdminNotification,
  fetchAdminNotifications,
  updateAdminNotification,
  type Notification,
  type NotificationInput,
} from "@/lib/api-client";
import { formatLocalDateTime, parseBackendDate } from "@/lib/time-format";
import { useAuth } from "@/lib/auth-context";
import { LoadingPanel } from "@/components/async-state";

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

export default function AdminNotificationsPage() {
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
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
      const rows = await fetchAdminNotifications();
      setNotifications(rows);
      setDrafts(Object.fromEntries(rows.map((notification) => [notification.id, fromNotification(notification)])));
      setStatus("Loaded notifications.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
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
      if (!newDraft.message.trim()) throw new Error("Message is required.");
      await createAdminNotification(toInput(newDraft));
      setNewDraft(emptyDraft);
      await load();
      setStatus("Notification created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create notification.");
    }
  }

  async function saveNotification(id: number) {
    setSavingId(id);
    setError(null);
    setStatus(null);
    try {
      await updateAdminNotification(id, toInput(drafts[id]));
      await load();
      setStatus("Notification saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notification.");
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
      setStatus("Notification deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete notification.");
    } finally {
      setSavingId(null);
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
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Notifications Admin</h1>
        <div className="bg-pc-bg-elevated border border-red-500/30 rounded-lg p-6 text-center space-y-2">
          <div className="text-lg font-bold text-red-400">Access Denied</div>
          <div className="text-sm text-pc-text-muted">
            This page is restricted to admin accounts only.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="pc-heading pc-heading-lg text-pc-accent">Notifications Admin</h1>
        <div className="text-xs text-pc-text-muted">
          Logged in as <span className="text-pc-text">{user?.username}</span>
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}
      {status && <div className="text-sm text-emerald-400">{status}</div>}

      <section className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-bold text-pc-text">Create Notification</h2>
        <NotificationEditor draft={newDraft} onChange={updateNewDraft} />
        <button
          type="button"
          onClick={createNotification}
          className="px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm"
        >
          Create
        </button>
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
                    {formatLocalDateTime(notification.timestamp)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveNotification(notification.id)}
                    disabled={savingId === notification.id}
                    className="px-3 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNotification(notification.id)}
                    disabled={savingId === notification.id}
                    className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <NotificationEditor draft={draft} onChange={(patch) => updateDraft(notification.id, patch)} />
            </div>
          );
        })}
        {!loading && notifications.length === 0 && (
          <div className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 text-sm text-pc-text-muted">
            No notifications found.
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationEditor({ draft, onChange }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
      <div className="lg:col-span-4">
        <label className="block text-xs text-pc-text-muted mb-1">Message</label>
        <textarea
          value={draft.message}
          onChange={(event) => onChange({ message: event.target.value })}
          rows={3}
          className="pc-input w-full resize-y"
          maxLength={500}
        />
      </div>
      <div>
        <label className="block text-xs text-pc-text-muted mb-1">Importance</label>
        <input
          type="number"
          value={draft.importance}
          onChange={(event) => onChange({ importance: Number(event.target.value) })}
          className="pc-input w-full"
        />
      </div>
      <div>
        <label className="block text-xs text-pc-text-muted mb-1">Timestamp</label>
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
