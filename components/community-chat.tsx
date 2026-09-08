/**
 * Global room with durable history, resumable updates, and a scroll-safe composer.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLocalization } from "@/lib/localization-context";
import { chatEvents, chatHistory, deleteChatMessage, normalizeChatMessage, sendChatMessage, type ChatMessage } from "@/lib/community-chat";
import { mergeChatMessages } from "@/lib/chat-messages";
import { VerifiedPlayerBadge } from "@/components/player-name";

/**
 * Global room with durable history, resumable updates, and a scroll-safe composer.
 * I/O types: `none -> JSX.Element`.
 * refs: doc: documents/02-technical/api/community-interactions.md
 */
export default function CommunityChat() {
  const { user } = useAuth();
  const { t, formatDateTime } = useLocalization();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "reconnecting">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [older, setOlder] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const prependHeight = useRef<number | null>(null);
  // Only fetched history pages advance this cursor; live deletions may be older.
  const historyBefore = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let stream: EventSource | undefined;
    setLoading(true);
    setError(null);
    chatHistory().then((history) => {
      if (!active) return;
      setMessages(history.messages);
      historyBefore.current = history.messages[0]?.id;
      setHasMore(history.hasMore);
      stream = chatEvents(history.cursor);
      stream.onopen = () => { setStatus("live"); setError(null); };
      stream.onerror = () => setStatus("reconnecting");
      stream.addEventListener("messages", (event) => {
        if (!active) return;
        try {
          const rows: ChatMessage[] = JSON.parse((event as MessageEvent).data).map(normalizeChatMessage);
          setMessages((current) => mergeChatMessages(current, rows));
          if (!follow.current) setUnseen(true);
        } catch { setStatus("reconnecting"); }
      });
    }).catch((err) => { if (active) setError(err instanceof Error ? err.message : t("community.chatError")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; stream?.close(); };
  }, [attempt, t]);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    if (prependHeight.current != null) {
      element.scrollTop += element.scrollHeight - prependHeight.current;
      prependHeight.current = null;
    } else if (follow.current) element.scrollTop = element.scrollHeight;
  }, [messages]);

  async function loadOlder() {
    if (older || historyBefore.current == null) return;
    setOlder(true);
    try {
      const history = await chatHistory(historyBefore.current);
      historyBefore.current = history.messages[0]?.id;
      prependHeight.current = scroller.current?.scrollHeight ?? null;
      setMessages((current) => mergeChatMessages(current, history.messages));
      setHasMore(history.hasMore);
    } catch (err) { setError(err instanceof Error ? err.message : t("community.chatError")); }
    finally { setOlder(false); }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendChatMessage(draft.trim());
      setDraft("");
      follow.current = true;
      setUnseen(false);
    } catch (err) { setError(err instanceof Error ? err.message : t("community.chatError")); }
    finally { setSending(false); }
  }

  async function remove(id: number) {
    if (!window.confirm(t("community.deleteMessageConfirm"))) return;
    try { await deleteChatMessage(id); }
    catch (err) { setError(err instanceof Error ? err.message : t("community.chatError")); }
  }

  return <section aria-labelledby="community-chat-title" className="overflow-hidden rounded-xl border border-pc-border bg-pc-bg-elevated">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-pc-border px-4 py-3">
      <div><h2 id="community-chat-title" className="pc-card-title">{t("community.globalChat")}</h2><p className="text-sm text-pc-text-secondary">{t("community.chatDescription")}</p></div>
      <span role="status" className={`text-sm ${status === "live" ? "text-pc-accent" : "text-pc-text-muted"}`}>{t(`community.${status}`)}</span>
    </header>
    <div ref={scroller} role="log" aria-label={t("community.globalChat")} aria-live="polite" aria-relevant="additions text" className="h-80 overflow-y-auto overscroll-contain px-4 py-3 sm:h-96" onScroll={() => {
      const el = scroller.current;
      if (el) { follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64; if (follow.current) setUnseen(false); }
    }}>
      {hasMore && <button type="button" onClick={loadOlder} disabled={older} className="mb-3 w-full text-sm text-pc-accent disabled:opacity-50">{t("community.olderMessages")}</button>}
      {loading ? <p className="text-sm text-pc-text-secondary">{t("community.connecting")}</p> : !messages.length && <p className="py-10 text-center text-sm text-pc-text-secondary">{t("community.chatEmpty")}</p>}
      {messages.map((message) => <article key={message.id} className="group py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-pc-text">{message.username}{message.linked_player_id != null && <VerifiedPlayerBadge />}</span>
          <time dateTime={message.created_at} className="text-xs text-pc-text-muted">{formatDateTime(message.created_at)}</time>
          {!message.deleted_at && user && (user.id === message.user_id || user.isAdmin) && <button type="button" onClick={() => remove(message.id)} className="ml-auto text-xs text-pc-text-secondary hover:text-red-400">{t("generated.community.delete")}</button>}
        </div>
        <p className={`whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere] ${message.deleted_at ? "italic text-pc-text-muted" : "text-pc-text"}`}>{message.deleted_at ? t("community.messageDeleted") : message.content}</p>
      </article>)}
    </div>
    {unseen && <button type="button" className="w-full bg-pc-accent/15 py-2 text-sm text-pc-accent" onClick={() => { follow.current = true; setUnseen(false); if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }}>{t("community.newMessages")}</button>}
    {error && <div role="alert" className="px-4 py-2 text-sm text-red-400">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)} className="underline">{t("community.retry")}</button></div>}
    <div className="border-t border-pc-border p-3">
      {user ? <form onSubmit={send} className="flex items-end gap-2">
        <textarea aria-label={t("community.messagePlaceholder")} placeholder={t("community.messagePlaceholder")} value={draft} maxLength={2000} rows={2} disabled={sending} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
        }} className="min-w-0 flex-1 resize-none rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text focus:outline-none focus:ring-2 focus:ring-pc-accent/50" />
        <button type="submit" disabled={sending || !draft.trim()} className="rounded-lg bg-pc-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t("community.send")}</button>
      </form> : <Link href="/auth/login" className="text-sm text-pc-accent">{t("community.loginToChat")}</Link>}
    </div>
  </section>;
}
