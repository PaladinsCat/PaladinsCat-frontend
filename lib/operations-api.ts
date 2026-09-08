/**
 * Defines operations-api's shared contracts and runtime helpers.
 * Keep behavior aligned with its callers and browser/server boundary.
 * refs: none
 */
import { accountAuthHeaders, fetchJson } from "./api-client";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
/**
 * Defines the  public operations stats contract used by this module.
 * refs: none
 */
export interface PublicOperationsStats { generatedAt:string; release:{version:string;gitCommitShort:string;deployedAt:string|null}; traffic:{activeUsers:number;activeWindowSeconds:number;heartbeatSeconds:number;visitorsToday:number;viewsToday:number;visitorDays7d:number;views7d:number}; catalog:{matches:number;rankedMatches:number;casualMatches:number;specialMatches:number;players:number;registeredUsers:number;verifiedUsers:number;communityBuilds:number;tierLists:number;communityPosts:number;recoveredMatches:number;incompleteMatches:number;latestMatchAt:string|null}; ingestCoverage:{totalMatches:number;directMatches:number;recoveredMatches:number;incompleteMatches:number}; }
/**
 * Fetch public operations statistics and normalize release, traffic, catalog, and ingest-coverage fields. Use documented numeric defaults for missing fields; reject network failures or non-success HTTP responses.
 * refs: none
 * I/O types: `none -> Promise<PublicOperationsStats>`.
 */
export async function fetchPublicOperationsStats():Promise<PublicOperationsStats>{const response=await fetch(`${API_BASE}/operations/stats`);const raw=await response.json().catch(()=>({}));if(!response.ok)throw new Error(typeof raw.error==="string"?raw.error:`Request failed (${response.status})`);const summary=raw.traffic?.summary??{},catalog=raw.catalog??{};return {generatedAt:String(raw.generated_at??""),release:{version:String(raw.release?.version??""),gitCommitShort:String(raw.release?.git_commit_short??""),deployedAt:raw.release?.deployed_at==null?null:String(raw.release.deployed_at)},traffic:{activeUsers:Number(summary.active_users??0),activeWindowSeconds:Number(summary.active_window_seconds??300),heartbeatSeconds:Number(summary.heartbeat_seconds??60),visitorsToday:Number(summary.visitors_today??0),viewsToday:Number(summary.views_today??0),visitorDays7d:Number(summary.visitor_days_7d??0),views7d:Number(summary.views_7d??0)},catalog:{matches:Number(catalog.matches??0),rankedMatches:Number(catalog.ranked_matches??0),casualMatches:Number(catalog.casual_matches??0),specialMatches:Number(catalog.special_matches??0),players:Number(catalog.players??0),registeredUsers:Number(catalog.registered_users??0),verifiedUsers:Number(catalog.verified_users??0),communityBuilds:Number(catalog.community_builds??0),tierLists:Number(catalog.tier_lists??0),communityPosts:Number(catalog.community_posts??0),recoveredMatches:Number(catalog.recovered_matches??0),incompleteMatches:Number(catalog.incomplete_matches??0),latestMatchAt:catalog.latest_match_at==null?null:String(catalog.latest_match_at)},ingestCoverage:{totalMatches:Number(raw.ingest_coverage?.total_matches??0),directMatches:Number(raw.ingest_coverage?.direct_matches??0),recoveredMatches:Number(raw.ingest_coverage?.recovered_matches??0),incompleteMatches:Number(raw.ingest_coverage?.incomplete_matches??0)}}}

/**
 * Defines the  ticket type contract used by this module.
 * refs: none
 */
export type TicketType = "bug" | "feature";
/**
 * Defines the  ticket status contract used by this module.
 * refs: none
 */
export type TicketStatus = "received" | "under_review" | "planned" | "closed";
/**
 * Defines the  ticket contract used by this module.
 * refs: none
 */
export type Ticket = { id: number; code: string; kind: TicketType; status: TicketStatus; title: string; details: string; requester: string; created_at: string; updated_at: string };
/**
 * Defines the  ticket comment contract used by this module.
 * refs: none
 */
export type TicketComment = { id: number; body: string; author: string; created_at: string };
/**
 * Defines the  work column contract used by this module.
 * refs: none
 */
export type WorkColumn = "backlog" | "building" | "review" | "done";
/**
 * Defines the  work item contract used by this module.
 * refs: none
 */
export type WorkItem = { id: number; code: string; title: string; component: string; column_name: WorkColumn; priority: "low" | "normal" | "high"; assignee: string | null; details: string };
const auth = () => accountAuthHeaders();
/**
 * Fetch an authenticated ticket page and preserve its data/pagination envelope; API and network errors reject the promise.
 * refs: none
 * I/O types: `page: number; perPage: number -> Promise<{ data: Ticket[]; page: { current: number; total_pages: number; }; }>`.
 */
export async function listTickets(page: number, perPage = 20) { return fetchJson<{ data: Ticket[]; page: { current: number; total_pages: number } }>(`/tickets?page=${page}&per_page=${perPage}`, { headers: auth(), unwrapData: false }); }
/**
 * POST a JSON ticket kind/title/details with current authentication and no retries; return the created ticket or reject request errors.
 * refs: none
 * I/O types: `input: { kind: TicketType; title: string; details: string } -> Promise<Ticket>`.
 */
export async function createTicket(input: { kind: TicketType; title: string; details: string }) { return fetchJson<Ticket>("/tickets", { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(input), retries: 0 }); }
/**
 * Fetch a URL-encoded ticket ID with authentication and return its ticket/comments envelope; request errors reject.
 * refs: none
 * I/O types: `id: string -> Promise<{ ticket: Ticket; comments: TicketComment[]; }>`.
 */
export async function getTicket(id: string) { return fetchJson<{ ticket: Ticket; comments: TicketComment[] }>(`/tickets/${encodeURIComponent(id)}`, { headers: auth(), unwrapData: false }); }
/**
 * POST a comment body to the encoded ticket ID with authentication and no retries; preserve the returned ticket/comments envelope and reject request errors.
 * refs: none
 * I/O types: `id: string; body: string -> Promise<{ ticket: Ticket; comments: TicketComment[]; }>`.
 */
export async function commentTicket(id: string, body: string) { return fetchJson<{ ticket: Ticket; comments: TicketComment[] }>(`/tickets/${encodeURIComponent(id)}/comments`, { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify({ body }), unwrapData: false, retries: 0 }); }
/**
 * PUT a ticket status to the encoded ID with authentication and no retries; preserve the returned ticket/comments envelope and reject request errors.
 * refs: none
 * I/O types: `id: string; status: TicketStatus -> Promise<{ ticket: Ticket; comments: TicketComment[]; }>`.
 */
export async function updateTicket(id: string, status: TicketStatus) { return fetchJson<{ ticket: Ticket; comments: TicketComment[] }>(`/tickets/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify({ status }), unwrapData: false, retries: 0 }); }
/**
 * DELETE the encoded ticket ID with authentication and no retries; return the deletion acknowledgment or reject request errors.
 * refs: none
 * I/O types: `id: string -> Promise<{ deleted: true; }>`.
 */
export async function deleteTicket(id: string) { return fetchJson<{ deleted: true }>(`/tickets/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth(), retries: 0 }); }
/**
 * Fetch authenticated project work items; return the array or reject request errors.
 * refs: none
 * I/O types: `none -> Promise<WorkItem[]>`.
 */
export async function listWorkItems() { return fetchJson<WorkItem[]>("/projects", { headers: auth() }); }
/**
 * POST a project title/component with authentication and no retries; return the new numeric ID or reject request errors.
 * refs: none
 * I/O types: `input: { title: string; component: string } -> Promise<{ id: number; }>`.
 */
export async function createWorkItem(input: { title: string; component: string }) { return fetchJson<{ id: number }>("/projects", { method: "POST", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify(input), retries: 0 }); }
/**
 * PUT editable work-item fields to the project ID, mapping column_name to column and absent assignee to an empty string. Send JSON with authentication and no retries; request errors reject.
 * refs: none
 * I/O types: `id: number; input: Omit<WorkItem, "id" | "code"> -> Promise<unknown>`.
 */
export async function updateWorkItem(id: number, input: Omit<WorkItem, "id" | "code">) { return fetchJson(`/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", ...auth() }, body: JSON.stringify({ title: input.title, component: input.component, column: input.column_name, priority: input.priority, assignee: input.assignee ?? "", details: input.details }), retries: 0 }); }
