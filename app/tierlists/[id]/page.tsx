"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addComment,
  deleteComment,
  deletePost,
  getAuthToken,
  getAuthUser,
  getPostDetail,
  togglePostLike,
  updateComment,
  type Comment,
  type PostDetail,
} from "@/lib/api-client";
import { fetchTierList, type TierListSummary } from "@/lib/tierlists-api";
import TierListBoard from "@/components/tier-list-board";
import CommunityRichContent from "@/components/CommunityRichContent";
import { LoadingIndicator, LoadingPanel } from "@/components/async-state";
import { VerifiedPlayerBadge } from "@/components/player-name";
import { formatLocalDateTime } from "@/lib/time-format";
import { useLocalization } from "@/lib/localization-context";

export default function TierListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLocalization();
  const router = useRouter();
  const [id, setId] = useState<number | null>(null);
  const [list, setList] = useState<TierListSummary | null>(null);
  const [discussion, setDiscussion] = useState<PostDetail | null>(null);
  const [comment, setComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState("");
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);
  const [deletingList, setDeletingList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { params.then(({ id: value }) => setId(Number(value))); }, [params]);
  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [tierList, post] = await Promise.all([fetchTierList(id), getPostDetail(id)]);
      setList(tierList);
      setDiscussion(post);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("generated.app\\tierlists\\[id]\\page.failedtoloadtierlist"));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  function requireAuth() {
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) { window.location.href = "/auth/login"; return null; }
    return { token, user };
  }

  async function like() {
    if (!discussion) return;
    const auth = requireAuth();
    if (!auth) return;
    try {
      const likes = await togglePostLike(discussion.post.id, auth.user.id, auth.token);
      setDiscussion((current) => current ? { ...current, post: { ...current.post, likes } } : null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("generated.app\\tierlists\\[id]\\page.failedtoupdatelike")); }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!discussion || !comment.trim()) return;
    const auth = requireAuth();
    if (!auth) return;
    setCommenting(true);
    try {
      const created = await addComment(discussion.post.id, auth.user.id, comment.trim(), null, auth.token);
      setDiscussion((current) => current ? { ...current, comments: [...current.comments, created] } : null);
      setComment("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("generated.app\\tierlists\\[id]\\page.failedtoaddcomment")); }
    finally { setCommenting(false); }
  }

  function startCommentEdit(item: Comment) {
    setEditingCommentId(item.id);
    setEditingComment(item.content);
    setError(null);
  }

  async function saveComment(commentId: number) {
    if (!editingComment.trim()) return;
    const auth = requireAuth();
    if (!auth) return;
    setBusyCommentId(commentId);
    try {
      const updated = await updateComment(commentId, editingComment.trim(), auth.token);
      setDiscussion((current) => current ? { ...current, comments: current.comments.map((item) => item.id === commentId ? updated : item) } : null);
      setEditingCommentId(null);
      setEditingComment("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("generated.app\\tierlists\\[id]\\page.failedtoupdatecomment")); }
    finally { setBusyCommentId(null); }
  }

  async function removeComment(commentId: number) {
    if (!window.confirm(t("generated.community.deleteThisComment"))) return;
    const auth = requireAuth();
    if (!auth) return;
    setBusyCommentId(commentId);
    try {
      await deleteComment(commentId, auth.token);
      setDiscussion((current) => current ? { ...current, comments: current.comments.filter((item) => item.id !== commentId) } : null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("generated.app\\tierlists\\[id]\\page.failedtodeletecomment")); }
    finally { setBusyCommentId(null); }
  }

  async function removeList() {
    if (!discussion || !window.confirm(t("generated.community.deleteThisPost"))) return;
    const auth = requireAuth();
    if (!auth) return;
    setDeletingList(true);
    try {
      await deletePost(discussion.post.id, auth.token);
      router.push("/tierlists");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("generated.app\\tierlists\\[id]\\page.failedtodeletetierlist"));
      setDeletingList(false);
    }
  }

  if (loading) return <LoadingPanel />;
  if (!list || !discussion) return <div className="py-12 text-center text-pc-text-muted">{error ?? t("generated.app\\tierlists\\[id]\\page.tierlistnotfound")}</div>;

  const currentUser = getAuthUser();
  const canManageList = currentUser ? currentUser.id === discussion.post.userId || currentUser.isAdmin : false;

  return <div className="space-y-6">
    <Link href="/tierlists" className="text-sm text-pc-text-secondary hover:text-pc-accent">{t("tierLists.back")}</Link>
    {error && <div className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div>}
    <article className="space-y-5 rounded-xl border border-pc-border bg-pc-bg-elevated p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-pc-text sm:text-3xl">{discussion.post.title}</h1><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-pc-text-muted"><span className="inline-flex items-center gap-1">{t("tierLists.createdBy", { name: discussion.post.username })}{discussion.post.linkedPlayerId != null && <VerifiedPlayerBadge />}</span><span>{formatLocalDateTime(discussion.post.createdAt)}</span><span>👁 {discussion.post.viewCount}</span></div></div>{canManageList && <button type="button" onClick={removeList} disabled={deletingList} className="shrink-0 rounded-lg border border-rose-700/50 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 disabled:opacity-50">{deletingList ? t("generated.community.deleting") : t("generated.community.delete")}</button>}</div>
      {discussion.post.content && <div className="text-sm text-pc-text-secondary"><CommunityRichContent content={discussion.post.content} /></div>}
      <TierListBoard entries={list.entries} />
      <div className="border-t border-pc-border pt-4"><button type="button" onClick={like} className="text-pc-text-secondary transition-colors hover:text-pc-accent">❤ {discussion.post.likes}</button></div>
    </article>
    <section className="rounded-xl border border-pc-border bg-pc-bg-elevated p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-pc-accent">{t("tierLists.comments", { count: discussion.comments.length })}</h2>
      <form onSubmit={submitComment} className="mb-5 flex gap-3"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("tierLists.addComment")} className="min-w-0 flex-1 rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-sm text-pc-text" /><button disabled={commenting || !comment.trim()} className="rounded-lg bg-pc-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{commenting ? <LoadingIndicator className="gap-2" /> : t("tierLists.postComment")}</button></form>
      {discussion.comments.length === 0 ? <p className="py-4 text-center text-sm text-pc-text-muted">{t("tierLists.noComments")}</p> : <div className="space-y-3">{discussion.comments.map((item) => {
        const canManageComment = currentUser ? currentUser.id === item.userId || currentUser.isAdmin : false;
        const isEditing = editingCommentId === item.id;
        const isBusy = busyCommentId === item.id;
        return <div key={item.id} className="rounded-lg bg-pc-bg-secondary p-4"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2 text-xs text-pc-text-muted"><span className="inline-flex items-center gap-1 font-semibold text-pc-text">{item.username}{item.linkedPlayerId != null && <VerifiedPlayerBadge />}</span><span>{formatLocalDateTime(item.createdAt)}</span></div>{canManageComment && !isEditing && <div className="flex gap-2"><button type="button" onClick={() => startCommentEdit(item)} className="text-xs text-pc-text-muted hover:text-pc-text">{t("generated.community.edit")}</button><button type="button" onClick={() => removeComment(item.id)} disabled={isBusy} className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-50">{isBusy ? t("generated.community.deleting") : t("generated.community.delete")}</button></div>}</div>{isEditing ? <div className="mt-3 space-y-2"><textarea value={editingComment} onChange={(event) => setEditingComment(event.target.value)} rows={3} className="w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text" /><div className="flex gap-2"><button type="button" onClick={() => saveComment(item.id)} disabled={isBusy || !editingComment.trim()} className="rounded-lg bg-pc-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{isBusy ? <LoadingIndicator className="gap-2" /> : t("generated.community.save")}</button><button type="button" onClick={() => { setEditingCommentId(null); setEditingComment(""); }} className="rounded-lg border border-pc-border px-3 py-1.5 text-xs text-pc-text-secondary">{t("generated.community.cancel")}</button></div></div> : <div className="mt-2 text-sm"><CommunityRichContent content={item.content} /></div>}</div>;
      })}</div>}
    </section>
  </div>;
}
