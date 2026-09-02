/** Calls administrative dashboard endpoints and maps their responses.
 * This client reads administrative dashboard summaries from backend endpoints.
 */
import { accountAuthHeaders, fetchJson } from "./api-client";

export type AdminDailyTraffic = { date: string; visitors: number; pageViews: number; matches: number };
export type AdminApiKey = {
  devId: string;
  status: string;
  used: number;
  dailyLimit: number;
  remaining: number;
  callsTotal: number;
  consecutiveFailures: number;
  lastUsed: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
};

export type AdminDashboard = {
  generatedAt: string;
  traffic: {
    summary: { activeUsers: number; activeWindowSeconds: number; heartbeatSeconds: number; visitorsToday: number; viewsToday: number; visitorsYesterday: number; visitorDays7d: number; views7d: number };
    daily: AdminDailyTraffic[];
    topPages: Array<{ path: string; pageViews: number }>;
  };
  site: {
    totals: { matches: number; rankedMatches: number; casualMatches: number; directMatches: number; recoveredMatches: number; incompleteMatches: number; players: number; registeredUsers: number; verifiedAccounts: number; communityBuilds: number; databaseBytes: number };
    pipeline: { bufferPending: number; bufferProjectionPending: number; bufferProcessing: number; bufferFailed: number; bufferProcessed: number };
  };
  hirez: {
    keys: AdminApiKey[];
    hourly: Array<{ hour: string; calls: number }>;
    endpoints: Array<{ consumer: string; endpoint: string; calls: number; avgResponseMs: number }>;
  };
};

const numberValue = (value: unknown) => Number(value ?? 0) || 0;


// User-facing error keys — resolved at the UI layer via t()
/** ADMIN_ERROR_KEYS applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
export const ADMIN_ERROR_KEYS = {
  sessionRequired: "generated.admin.sessionRequired",
  dashboardRequestFailed: "generated.admin.dashboardRequestFailed",
} as const;

/** fetchAdminDashboard applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 * Returns: `Promise<AdminDashboard>`
 */
export async function fetchAdminDashboard(mode: "admin" | "developer" = "admin"): Promise<AdminDashboard> {
  const response = await fetch(mode === "developer" ? "/api/developer/dashboard" : "/api/admin/dashboard", {
    headers: accountAuthHeaders(),
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || body?.error || `Dashboard request failed (${response.status}).`);
  const raw = body?.data && !body?.generated_at ? body.data : body;
  const summary = raw.traffic?.summary ?? {};
  const totals = raw.site?.totals ?? {};
  const pipeline = raw.site?.pipeline ?? {};

  return {
    generatedAt: String(raw.generated_at ?? new Date().toISOString()),
    traffic: {
      summary: {
        activeUsers: numberValue(summary.active_users),
        activeWindowSeconds: numberValue(summary.active_window_seconds) || 300,
        heartbeatSeconds: numberValue(summary.heartbeat_seconds) || 60,
        visitorsToday: numberValue(summary.visitors_today),
        viewsToday: numberValue(summary.views_today),
        visitorsYesterday: numberValue(summary.visitors_yesterday),
        visitorDays7d: numberValue(summary.visitor_days_7d),
        views7d: numberValue(summary.views_7d),
      },
      daily: (raw.traffic?.daily ?? []).map((row: any) => ({
        date: String(row.date), visitors: numberValue(row.visitors), pageViews: numberValue(row.page_views), matches: numberValue(row.matches),
      })),
      topPages: (raw.traffic?.top_pages ?? []).map((row: any) => ({ path: String(row.path), pageViews: numberValue(row.page_views) })),
    },
    site: {
      totals: {
        matches: numberValue(totals.matches), rankedMatches: numberValue(totals.ranked_matches), casualMatches: numberValue(totals.casual_matches), directMatches: numberValue(totals.direct_matches), recoveredMatches: numberValue(totals.recovered_matches), incompleteMatches: numberValue(totals.incomplete_matches), players: numberValue(totals.players),
        registeredUsers: numberValue(totals.registered_users), verifiedAccounts: numberValue(totals.verified_accounts), communityBuilds: numberValue(totals.community_builds), databaseBytes: numberValue(totals.database_bytes),
      },
      pipeline: {
        bufferPending: numberValue(pipeline.buffer_pending), bufferProcessing: numberValue(pipeline.buffer_processing),
        bufferProjectionPending: numberValue(pipeline.buffer_projection_pending),
        bufferFailed: numberValue(pipeline.buffer_failed), bufferProcessed: numberValue(pipeline.buffer_processed),
      },
    },
    hirez: {
      keys: (raw.hirez?.keys ?? []).map((row: any) => ({
        devId: String(row.label ?? row.dev_id ?? "Key"), status: String(row.status ?? "unknown"), used: numberValue(row.used), dailyLimit: numberValue(row.daily_limit),
        remaining: numberValue(row.remaining), callsTotal: numberValue(row.calls_total), consecutiveFailures: numberValue(row.consecutive_failures),
        lastUsed: row.last_used ? String(row.last_used) : null, lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : null,
        lastSyncError: row.last_sync_error ? String(row.last_sync_error) : null,
      })),
      hourly: (raw.hirez?.hourly ?? []).map((row: any) => ({ hour: String(row.hour), calls: numberValue(row.calls) })),
      endpoints: (raw.hirez?.endpoints ?? []).map((row: any) => ({
        consumer: String(row.consumer ?? "unknown"), endpoint: String(row.endpoint),
        calls: numberValue(row.calls), avgResponseMs: numberValue(row.avg_response_ms),
      })),
    },
  };
}

export type ManagedAccount = { id: number; username: string; email: string; role: "user" | "moderator" | "developer" | "admin" };
/** searchManagedAccounts applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 * Returns: `Promise<ManagedAccount[]>`
 */
export async function searchManagedAccounts(query: string): Promise<ManagedAccount[]> { return fetchJson<ManagedAccount[]>(`/admin/accounts?q=${encodeURIComponent(query)}`,{headers:accountAuthHeaders()}); }
/** updateManagedAccountRole applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 * Returns: `Promise<void>`
 */
export async function updateManagedAccountRole(id:number,role:ManagedAccount["role"]):Promise<void>{await fetchJson(`/admin/accounts/${id}/role`,{method:"PUT",headers:{"Content-Type":"application/json",...accountAuthHeaders()},body:JSON.stringify({role}),retries:0});}
