"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocalization } from "@/lib/localization-context";
import {
  approveLocalizationSubmission,
  getAdminLocalizationSubmissions,
  getLocalizationAccessRequests,
  getLocalizationContributors,
  grantLocalizationContributor,
  rejectLocalizationSubmission,
  revokeLocalizationContributor,
  type AdminLocalizationSubmission,
  type LocalizationAccessRequest,
  type LocalizationContributor,
} from "@/lib/localization-api";

export default function AdminLocalizationPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { t } = useLocalization();
  const [requests, setRequests] = useState<LocalizationAccessRequest[]>([]);
  const [contributors, setContributors] = useState<LocalizationContributor[]>([]);
  const [submissions, setSubmissions] = useState<AdminLocalizationSubmission[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextRequests, nextContributors, pendingSubmissions, staleSubmissions] = await Promise.all([
        getLocalizationAccessRequests(),
        getLocalizationContributors(),
        getAdminLocalizationSubmissions("pending"),
        getAdminLocalizationSubmissions("needs_rebase"),
      ]);
      setRequests(nextRequests);
      setContributors(nextContributors);
      setSubmissions([...pendingSubmissions, ...staleSubmissions]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    }
  }, [t]);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth/login");
    else if (!isLoading && !user?.isAdmin) router.replace("/");
    else if (user?.isAdmin) void load();
  }, [isLoading, user, router, load]);

  async function grant(userId: number) {
    await grantLocalizationContributor(userId);
    await load();
  }

  async function revoke(userId: number) {
    await revokeLocalizationContributor(userId);
    await load();
  }

  async function approve(submissionId: string) {
    setBusy(submissionId);
    try {
      await approveLocalizationSubmission(submissionId);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    } finally {
      setBusy(null);
    }
  }

  async function reject(submissionId: string) {
    const notes = window.prompt("Optional rejection reason") ?? "";
    setBusy(submissionId);
    try {
      await rejectLocalizationSubmission(submissionId, notes);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("localization.error"));
    } finally {
      setBusy(null);
    }
  }

  if (isLoading || !user?.isAdmin) return null;
  return (
    <section className="space-y-6">
      <header><h1 className="pc-heading pc-heading-lg">{t("localization.adminTitle")}</h1></header>
      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="pc-card">
        <h2 className="text-base font-bold">{t("localization.adminSubmissions")}</h2>
        <div className="mt-4 space-y-2">
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-lg border border-pc-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{submission.username} <span className="text-pc-text-muted">({submission.email})</span></div>
                  <div className="mt-1 text-xs text-pc-text-secondary">{submission.catalog} · {submission.locale} · {submission.keyCount} keys · {submission.status}</div>
                  <code className="mt-1 block text-[10px] text-pc-text-muted">{submission.id}</code>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy === submission.id} onClick={() => void reject(submission.id)} className="pc-btn-secondary text-sm">{t("localization.reject")}</button>
                  {submission.status === "pending" && <button type="button" disabled={busy === submission.id} onClick={() => void approve(submission.id)} className="pc-btn-primary text-sm">{t("localization.approve")}</button>}
                </div>
              </div>
            </div>
          ))}
          {submissions.length === 0 && <p className="text-sm text-pc-text-muted">{t("localization.noSubmissions")}</p>}
        </div>
      </div>

      <div className="pc-card">
        <h2 className="text-base font-bold">{t("localization.adminRequests")}</h2>
        <div className="mt-4 space-y-2">
          {requests.map((request) => (
            <div key={request.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pc-border p-3">
              <div>
                <div className="text-sm font-medium">{request.username} <span className="text-pc-text-muted">({request.email})</span></div>
                <p className="mt-1 text-xs text-pc-text-secondary">{request.message || "—"}</p>
                <span className="text-[10px] uppercase text-pc-text-muted">{request.status}</span>
              </div>
              {request.status !== "approved" && <button type="button" onClick={() => void grant(request.userId)} className="pc-btn-primary text-sm">{t("localization.grant")}</button>}
            </div>
          ))}
          {requests.length === 0 && <p className="text-sm text-pc-text-muted">{t("localization.noRequests")}</p>}
        </div>
      </div>

      <div className="pc-card">
        <h2 className="text-base font-bold">{t("localization.adminContributors")}</h2>
        <div className="mt-4 space-y-2">
          {contributors.map((contributor) => (
            <div key={contributor.userId} className="flex items-center justify-between gap-3 rounded-lg border border-pc-border p-3">
              <div><div className="text-sm font-medium">{contributor.username}</div><div className="text-xs text-pc-text-muted">{contributor.email}</div></div>
              <button type="button" onClick={() => void revoke(contributor.userId)} className="pc-btn-secondary text-sm">{t("localization.revoke")}</button>
            </div>
          ))}
          {contributors.length === 0 && <p className="text-sm text-pc-text-muted">{t("localization.noContributors")}</p>}
        </div>
      </div>
    </section>
  );
}
