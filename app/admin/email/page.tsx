/**
 * Render the /admin/email route: inbox/sent for Hi-Rez alt mailboxes, backed
 * by the IMAP poller and the `email_messages` store (Option B).
 * refs: none
 */
"use client";
import { formatApiErrorMessage } from "@/lib/api-errors";
import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminEmail,
  fetchAdminEmails,
  markAdminEmailRead,
  pollAdminEmail,
  type AdminEmailMessage,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { LoadingPanel } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

type DirectionFilter = "in" | "out" | "all";

/**
 * Render the /admin/email route with an inbox/sent list and a detail panel.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function AdminEmailPage() {
  const { t, formatDateTime } = useLocalization();
  const { user, isLoading } = useAuth();
  const [messages, setMessages] = useState<AdminEmailMessage[]>([]);
  const [selected, setSelected] = useState<AdminEmailMessage | null>(null);
  const [filter, setFilter] = useState<DirectionFilter>("in");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const isAdmin = user?.isAdmin ?? false;

  const load = useCallback(
    async (direction: DirectionFilter) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchAdminEmails(
          undefined,
          direction === "all" ? undefined : direction
        );
        setMessages(rows);
      } catch (err) {
        setError(
          formatApiErrorMessage(
            err,
            t,
            t("admin.email.failedLoad")
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!isLoading && isAdmin) {
      void load(filter);
    }
  }, [isLoading, isAdmin, filter, load]);

  async function handlePoll() {
    setPolling(true);
    setError(null);
    setStatus(null);
    try {
      const result = await pollAdminEmail();
      if (!result.configured) {
        setStatus(t("admin.email.notConfigured"));
      } else if (result.inserted > 0) {
        setStatus(t("admin.email.inserted", { count: result.inserted }));
        await load(filter);
      } else {
        setStatus(t("admin.email.noNew"));
      }
    } catch (err) {
      setError(
        formatApiErrorMessage(err, t, t("admin.email.failedPoll"))
      );
    } finally {
      setPolling(false);
    }
  }

  async function openMessage(id: number) {
    setOpeningId(id);
    setError(null);
    try {
      const msg = await fetchAdminEmail(id);
      setSelected(msg);
      if (!msg.read_at) {
        await markAdminEmailRead(id).catch(() => undefined);
        setMessages((current) =>
          current.map((row) =>
            row.id === id ? { ...row, read_at: new Date().toISOString() } : row
          )
        );
      }
    } catch (err) {
      setError(
        formatApiErrorMessage(err, t, t("admin.email.failedOpen"))
      );
    } finally {
      setOpeningId(null);
    }
  }

  if (isLoading) {
    return <LoadingPanel />;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="pc-heading pc-heading-lg">{t("admin.email.title")}</h1>
        <div className="bg-pc-bg-elevated border border-red-500/30 rounded-lg p-6 text-center space-y-2">
          <div className="text-lg font-bold text-red-400">
            {t("generated.admin.accessDenied")}
          </div>
          <div className="text-sm text-pc-text-muted">
            {t("generated.admin.thisPageIsRestrictedToAdminAccountsOnly")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="pc-heading pc-heading-lg">{t("admin.email.title")}</h1>
          <div className="text-xs text-pc-text-muted">
            {t("admin.email.subtitle")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handlePoll()}
          disabled={polling}
          className="px-4 py-2 rounded-lg bg-pc-accent text-pc-bg font-semibold text-sm disabled:opacity-50"
        >
          {polling ? t("admin.email.refreshing") : t("admin.email.refresh")}
        </button>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}
      {status && <div className="text-sm text-emerald-400">{status}</div>}

      <div className="flex gap-2">
        {(["in", "out", "all"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              filter === value
                ? "bg-pc-accent text-pc-bg"
                : "bg-pc-bg-elevated text-pc-text-secondary border border-pc-border"
            }`}
          >
            {value === "in"
              ? t("admin.email.inbox")
              : value === "out"
                ? t("admin.email.sent")
                : t("admin.email.all")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-pc-bg-elevated border border-pc-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-pc-text-muted">…</div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-sm text-pc-text-muted">
              {t("admin.email.empty")}
            </div>
          ) : (
            <ul className="divide-y divide-pc-border">
              {messages.map((message) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => void openMessage(message.id)}
                    disabled={openingId === message.id}
                    className={`w-full text-left px-4 py-3 hover:bg-pc-bg/40 transition-colors ${
                      selected?.id === message.id ? "bg-pc-bg/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm truncate ${
                          message.read_at
                            ? "text-pc-text-secondary"
                            : "text-pc-text font-semibold"
                        }`}
                      >
                        {message.subject || "(no subject)"}
                      </span>
                      <span className="text-xs text-pc-text-muted shrink-0">
                        {message.direction === "in"
                          ? t("admin.email.directionIn")
                          : t("admin.email.directionOut")}
                      </span>
                    </div>
                    <div className="text-xs text-pc-text-muted mt-0.5 truncate">
                      {message.sender}
                    </div>
                    <div className="text-xs text-pc-text-muted mt-0.5">
                      {formatDateTime(message.received_at)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-pc-bg-elevated border border-pc-border rounded-lg p-4 space-y-3">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-bold text-pc-text break-words">
                  {selected.subject || "(no subject)"}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs text-pc-text-muted hover:text-pc-text shrink-0"
                >
                  {t("admin.email.close")}
                </button>
              </div>
              <dl className="text-sm space-y-1">
                <div className="flex gap-2">
                  <dt className="text-pc-text-muted w-20 shrink-0">
                    {t("admin.email.from")}
                  </dt>
                  <dd className="text-pc-text break-words">{selected.sender}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-pc-text-muted w-20 shrink-0">
                    {t("admin.email.to")}
                  </dt>
                  <dd className="text-pc-text break-words">{selected.recipient}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-pc-text-muted w-20 shrink-0">
                    {t("admin.email.received")}
                  </dt>
                  <dd className="text-pc-text">
                    {formatDateTime(selected.received_at)}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-pc-text-muted w-20 shrink-0">
                    {t("admin.email.messageId")}
                  </dt>
                  <dd className="text-pc-text">#{selected.id}</dd>
                </div>
              </dl>
              <div>
                <div className="text-xs text-pc-text-muted mb-1">
                  {t("admin.email.body")}
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm text-pc-text bg-pc-bg/40 border border-pc-border rounded-lg p-3 max-h-96 overflow-y-auto">
                  {selected.body || "(empty)"}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-sm text-pc-text-muted">
              {t("admin.email.empty")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
