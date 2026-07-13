import { getAuthToken } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export type LocalizationModulePayload = {
  locale: string;
  module: string;
  english: Record<string, string>;
  existing: Record<string, string>;
  draft: Record<string, string> | null;
  draftUpdatedAt: string | null;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error("Sign in to use localization");
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || body?.error || `API ${response.status}`);
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

export type LocalizationAccessRequest = { userId: number; username: string; email: string; message: string; status: string; createdAt: string };
export type LocalizationContributor = { userId: number; username: string; email: string; grantedAt: string; grantedBy: string | null };

export function getLocalizationAccessRequests() { return request<LocalizationAccessRequest[]>("/admin/localization/requests"); }
export function getLocalizationContributors() { return request<LocalizationContributor[]>("/admin/localization/contributors"); }
export function grantLocalizationContributor(userId: number) { return request(`/admin/localization/contributors/${userId}`, { method: "POST" }); }
export function revokeLocalizationContributor(userId: number) { return request(`/admin/localization/contributors/${userId}`, { method: "DELETE" }); }
