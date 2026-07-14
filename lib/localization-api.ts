import { getAuthToken } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export type LocalizationModulePayload = {
  locale: string;
  module: string;
  revision: string;
  english: Record<string, string>;
  existing: Record<string, string>;
  draft: Record<string, string> | null;
  draftUpdatedAt: string | null;
};

export type LocalizationSubmission = {
  id: string;
  catalog: "website" | "game-client";
  locale: string;
  baseRevision: string;
  keyCount: number;
  status: string;
  reviewNotes: string | null;
  pullRequest: { number: number; url: string; branch: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type LocalizationProgress = {
  catalog: string;
  revision: string;
  totalKeys: number;
  languages: Array<{
    locale: string;
    approvedKeys: number;
    remainingKeys: number;
    percent: number;
    pendingSubmissions: number;
    pendingUnits: number;
    staleSubmissions: number;
    staleUnits: number;
  }>;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Sign in to use localization");
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || body?.error || "We couldn't complete this request right now. Please try again.");
  return body as T;
}

async function publicRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || body?.error || "We couldn't complete this request right now. Please try again.");
  return body as T;
}

export function getLocalizationMe() {
  return request<{ isContributor: boolean; isAdmin: boolean; accessRequest: { status: string } | null }>("/localization/me");
}

export function applyForLocalization(message: string) {
  return request<{ status: string }>("/localization/access-requests", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }),
  });
}

export function getLocalizationModule(locale: string, module: string) {
  return request<LocalizationModulePayload>(`/localization/modules/${module}?locale=${encodeURIComponent(locale)}`);
}

export function saveLocalizationDraft(locale: string, module: string, messages: Record<string, string>) {
  return request<{ saved: boolean }>(`/localization/modules/${module}/draft`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale, messages }),
  });
}

export function createLocalizationPullRequest(locale: string, module: string) {
  return request<{ pullRequest: { number: number; url: string; branch: string } }>(`/localization/modules/${module}/pull-requests`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }),
  });
}

export function getLocalizationProgress(catalog: "website" | "game-client" = "website") {
  return publicRequest<LocalizationProgress>(`/localization/v1/progress?catalog=${encodeURIComponent(catalog)}`);
}

export function createLocalizationSubmission(input: {
  locale: string;
  baseRevision: string;
  translations: Array<{ namespace: string; key: string; text: string }>;
}) {
  return request<LocalizationSubmission>("/localization/v1/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catalog: "website", ...input }),
  });
}

export function getMyLocalizationSubmissions() {
  return request<LocalizationSubmission[]>("/localization/v1/submissions");
}

export type LocalizationToken = {
  id: number;
  name: string;
  prefix: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function createLocalizationToken(name: string) {
  return request<{ token: string; credential: LocalizationToken }>("/localization/v1/tokens", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
  });
}

export function getLocalizationTokens() { return request<LocalizationToken[]>("/localization/v1/tokens"); }
export function revokeLocalizationToken(tokenId: number) { return request(`/localization/v1/tokens/${tokenId}`, { method: "DELETE" }); }

export type LocalizationAccessRequest = { userId: number; username: string; email: string; message: string; status: string; createdAt: string };
export type LocalizationContributor = { userId: number; username: string; email: string; grantedAt: string; grantedBy: string | null };

export function getLocalizationAccessRequests() { return request<LocalizationAccessRequest[]>("/admin/localization/requests"); }
export function getLocalizationContributors() { return request<LocalizationContributor[]>("/admin/localization/contributors"); }
export function grantLocalizationContributor(userId: number) { return request(`/admin/localization/contributors/${userId}`, { method: "POST" }); }
export function revokeLocalizationContributor(userId: number) { return request(`/admin/localization/contributors/${userId}`, { method: "DELETE" }); }

export type AdminLocalizationSubmission = {
  id: string;
  catalog: string;
  locale: string;
  baseRevision: string;
  keyCount: number;
  status: string;
  validation: Record<string, unknown>;
  reviewNotes: string | null;
  githubPrNumber: number | null;
  githubPrUrl: string | null;
  createdAt: string;
  updatedAt: string;
  username: string;
  email: string;
};

export function getAdminLocalizationSubmissions(status = "pending") {
  return request<AdminLocalizationSubmission[]>(`/admin/localization/v1/submissions?status=${encodeURIComponent(status)}`);
}
export function approveLocalizationSubmission(submissionId: string, notes = "") {
  return request<LocalizationSubmission & { pullRequest: { number: number; url: string; branch: string } }>(
    `/admin/localization/v1/submissions/${encodeURIComponent(submissionId)}/approve`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }) },
  );
}
export function rejectLocalizationSubmission(submissionId: string, notes = "") {
  return request<LocalizationSubmission>(`/admin/localization/v1/submissions/${encodeURIComponent(submissionId)}/reject`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes }),
  });
}
