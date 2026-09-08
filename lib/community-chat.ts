/** Persistent chat API; mutations reuse the site's session and CSRF handling.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
import { fetchJson, getAuthToken } from "./api-client";

/**
 * Describe chat message with id, user_id, username, linked_player_id, content, created_at, deleted_at.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export interface ChatMessage {
  id: number;
  user_id: number | null;
  username: string;
  linked_player_id: number | null;
  content: string;
  created_at: string;
  deleted_at: string | null;
  revision: number;
}
/**
 * Describe chat history with messages, cursor, hasMore.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export interface ChatHistory { messages: ChatMessage[]; cursor: number; hasMore: boolean }

/**
 * Copy a chat message while coercing id, revision, and non-null user_id to numbers; preserve the other fields and leave the input unchanged.
 * I/O types: `message: ChatMessage -> ChatMessage`.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export function normalizeChatMessage(message: ChatMessage): ChatMessage {
  return { ...message, id: Number(message.id), revision: Number(message.revision), user_id: message.user_id == null ? null : Number(message.user_id) };
}
/**
 * Fetch uncached chat history before an optional message ID and normalize each message numeric identifier. Return messages plus the cursor and pagination flag; network/API failures reject the promise.
 * I/O types: `before?: number -> Promise<ChatHistory>`.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export async function chatHistory(before?: number): Promise<ChatHistory> {
  const history = await fetchJson<ChatHistory>(`/community/chat${before == null ? "" : `?before=${before}`}`, { cache: "no-store" });
  return { ...history, messages: history.messages.map(normalizeChatMessage) };
}
/**
 * Open an EventSource connection for chat events after the supplied cursor using the public API origin. The caller owns closing the connection and handling stream errors.
 * I/O types: `cursor: number -> EventSource`.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export function chatEvents(cursor: number): EventSource {
  return new EventSource(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/community/chat/events?after=${cursor}`);
}
function authHeaders() {
  const token = getAuthToken();
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
/**
 * POST chat content with the current authorization headers and shared CSRF handling. Return the created message ID; disable retries to avoid duplicate sends after a lost response. Network/API failures reject the promise.
 * I/O types: `content: string -> Promise<{ id: number; }>`.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export function sendChatMessage(content: string) {
  // Retrying a committed POST after a lost response could duplicate a message.
  return fetchJson<{ id: number }>("/community/chat", { method: "POST", headers: authHeaders(), body: JSON.stringify({ content }), retries: 0 });
}
/**
 * DELETE the selected chat message using current authorization headers and shared CSRF handling. Disable retries; network/API failures reject the promise.
 * I/O types: `id: number -> Promise<unknown>`.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export function deleteChatMessage(id: number) {
  return fetchJson(`/community/chat/${id}`, { method: "DELETE", headers: authHeaders(), retries: 0 });
}
