/** Account API contract. No consent state is inferred from login or browser storage. */
import { accountAuthHeaders, fetchJson } from "@/lib/api-client";

export const MAINTENANCE_POLICY_VERSION = "maintenance-presence-2026-09-12-v1";
export type MaintenanceConsent = {
  decision: "unset" | "accepted" | "declined";
  policy_version: string;
  updated_at: string | null;
};
export type ConsentSource = "login_banner" | "account_settings";
const path = "/auth/account/maintenance-consent";

export function consentAllowsPresence(choice: MaintenanceConsent | null): boolean {
  return choice?.decision === "accepted" && choice.policy_version === MAINTENANCE_POLICY_VERSION;
}

export function getMaintenanceConsent(signal?: AbortSignal): Promise<MaintenanceConsent> {
  return fetchJson(path, { headers: accountAuthHeaders(), cache: "no-store", retries: 0, timeoutMs: 5000, signal });
}

export function saveMaintenanceConsent(enabled: boolean, source: ConsentSource): Promise<MaintenanceConsent> {
  return fetchJson(path, {
    method: "PUT", headers: { ...accountAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, source, policy_version: MAINTENANCE_POLICY_VERSION }),
    cache: "no-store", retries: 0, timeoutMs: 5000,
  });
}

export function sendMaintenancePresence(signal: AbortSignal): Promise<unknown> {
  return fetchJson("/auth/account/maintenance-presence", {
    method: "POST", headers: accountAuthHeaders(), cache: "no-store", referrerPolicy: "no-referrer",
    retries: 0, timeoutMs: 5000, signal,
  });
}
