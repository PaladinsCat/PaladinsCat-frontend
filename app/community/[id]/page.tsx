/**
 * Define the community page responsibility boundary.
 * Coordinates community page data loading, authorization, and presentation.
 * refs: none
 */
"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {

  getPostDetail,
  addComment,
  deleteComment,
  deletePost,
  togglePostLike,
  updateComment,
  updatePost,
  getAuthUser,
  getAuthToken,
  hasCookieAuthSession,
  type Comment,
  type PostDetail,
} from "@/lib/api-client";
import { formatLocalDateTime } from "@/lib/time-format";
import CommunityRichContent from "@/components/CommunityRichContent";
import { LoadingIndicator, LoadingPanel } from "@/components/async-state";
import { VerifiedPlayerBadge } from "@/components/player-name";
import { useLocalization } from "@/lib/localization-context";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { t , formatDateTime} = useLocalization();
  const router = useRouter();
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const loadPost = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getPostDetail(parseInt(id, 10));
      setDetail(data);
      setPostTitle(data.post.title);
      setPostContent(data.post.content);
    } catch {
      setError(t("generated.community.failedToLoadPost"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  function requireAuth() {
    const token = getAuthToken();
    const user = getAuthUser();
    if ((!token && !hasCookieAuthSession()) || !user) {
      window.location.href = "/auth/login";
      return null;
    }
    return { token, user };
  }

  async function handleLike() {
    if (!detail) return;
    setActionError(null);
    const auth = requireAuth();
    if (!auth) return;

    try {
      const newLikes = await togglePostLike(detail.post.id, auth.user.id, auth.token);
      setDetail((prev) => prev ? {
        ...prev,
        post: { ...prev.post, likes: newLikes },
      } : null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("generated.community.[id].page.failedtoupdatelike"));
    }
  }

  async function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !postTitle.trim() || !postContent.trim()) return;
    setActionError(null);
    const auth = requireAuth();
    if (!auth) return;

    setSavingPost(true);
    try {
      const post = await updatePost(detail.post.id, postTitle.trim(), postContent.trim(), auth.token);
      setDetail((prev) => prev ? { ...prev, post } : null);
      setEditingPost(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("generated.community.[id].page.failedtosavepost"));
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDeletePost() {
    if (!detail || !window.confirm(t("generated.community.deleteThisPost"))) return;
    setActionError(null);
    const auth = requireAuth();
    if (!auth) return;

    setDeletingPost(true);
    try {
      await deletePost(detail.post.id, auth.token);
      router.push("/community");
      router.refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("generated.community.[id].page.failedtodeletepost"));
      setDeletingPost(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !newComment.trim()) return;
    setActionError(null);
    const auth = requireAuth();
    if (!auth) return;

    setCommenting(true);
    try {
      const comment = await addComment(detail.post.id, auth.user.id, newComment.trim(), null, auth.token);
      setDetail((prev) => prev ? {
        ...prev,
        comments: [...prev.comments, comment],
      } : null);
      setNewComment("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("generated.community.[id].page.failedtoaddcomment"));
    } finally {
      setCommenting(false);
    }
  }

  function startCommentEdit(comment: Comment) {
    setEditingCommentId(comment.id);
    setCommentContent(comment.content);
    setActionError(null);
  }

  async function handleSaveComment(commentId: number) {
    if (!commentContent.trim()) return;
    setActionError(null);
    const auth = requireAuth();
    if (!auth) return;

    setBusyCommentId(commentId);
    try {
      const updated = await updateComment(commentId, commentContent.trim(), auth.token);
      setDetail((prev) => prev ? {
        ...prev,
        comments: prev.comments.map((comment) => comment.id === commentId ? updated : comment),
      } : null);
      setEditingCommentId(null);
      setCommentContent("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("generated.community.[id].page.failedtosavecomment"));
    } finally {
      setBusyCommentId(null);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!window.confirm(t("generated.community.deleteThisComment"))) return;
    setActionError(null);
    const auth = requireAuth();
    if (!auth) return;

    setBusyCommentId(commentId);
    try {
      await deleteComment(commentId, auth.token);
      setDetail((prev) => prev ? {
        ...prev,
        comments: prev.comments.filter((comment) => comment.id !== commentId),
      } : null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("generated.community.[id].page.failedtodeletecomment"));
    } finally {
      setBusyCommentId(null);
    }
  }

  if (loading) return <LoadingPanel />;
  if (error) return <div className="text-center py-12 text-pc-text-muted">{error}</div>;
  if (!detail) return <div className="text-center py-12 text-pc-text-muted">{t("generated.community.postNotFound")}</div>;

  const { post, comments } = detail;
  const currentUser = getAuthUser();
  const canEditPost = currentUser ? currentUser.id === post.userId || currentUser.isAdmin : false;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link href="/community" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
        {t("generated.community.backToCommunity")}</Link>

      {actionError && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400">
          {actionError}
        </div>
      )}

      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        {editingPost ? (
          <form onSubmit={handleSavePost} className="space-y-4">
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-xl font-bold text-pc-text outline-none focus:ring-2 focus:ring-pc-accent/50"
            />
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-2 text-pc-text outline-none focus:ring-2 focus:ring-pc-accent/50"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={savingPost || !postTitle.trim() || !postContent.trim()}
                className="rounded-lg bg-pc-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPost ? <LoadingIndicator className="gap-2" /> : t("generated.community.save")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPost(false);
                  setPostTitle(post.title);
                  setPostContent(post.content);
                }}
                className="rounded-lg border border-pc-border px-4 py-2 text-sm text-pc-text-secondary transition-colors hover:text-pc-text"
              >
                {t("generated.community.cancel")}</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-pc-text">{post.title}</h1>
              {canEditPost && (
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPost(true)}
                    className="rounded-lg border border-pc-border px-3 py-1.5 text-xs text-pc-text-secondary transition-colors hover:text-pc-text"
                  >
                    {t("generated.community.edit")}</button>
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    disabled={deletingPost}
                    className="rounded-lg border border-red-700/50 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingPost ? t("generated.community.deleting") : t("generated.community.delete")}
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-pc-text-secondary text-sm">
              <span className="inline-flex items-center gap-1">{t("generated.community.by")}{" "}{post.username}{post.linkedPlayerId != null && <VerifiedPlayerBadge />}</span>
              <span>{formatDateTime(post.createdAt)}</span>
              <span>👁 {post.viewCount}</span>
            </div>
            <div className="mt-4"><CommunityRichContent content={post.content} /></div>
          </>
        )}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-pc-border">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-2 text-pc-text-secondary hover:text-pc-accent transition-colors"
          >
            ❤ {post.likes}
          </button>
        </div>
      </div>

      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h2 className="pc-card-title mb-4">
          {t("generated.community.comments")}{comments.length})
        </h2>

        <form onSubmit={handleComment} className="mb-6 flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("generated.community.addAComment")}
            className="flex-1 px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
          />
          <button
            type="submit"
            disabled={commenting || !newComment.trim()}
            className="px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {commenting ? t("generated.community.posting") : t("generated.community.post")}
          </button>
        </form>

        {comments.length === 0 ? (
          <p className="text-pc-text-muted text-center py-4">{t("generated.community.noCommentsYet")}</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const canEditComment = currentUser ? currentUser.id === comment.userId || currentUser.isAdmin : false;
              const isEditing = editingCommentId === comment.id;
              const isBusy = busyCommentId === comment.id;

              return (
                <div key={comment.id} className="bg-pc-bg-secondary rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 text-pc-text font-medium">{comment.username}{comment.linkedPlayerId != null && <VerifiedPlayerBadge />}</span>
                      <span className="text-pc-text-muted">{formatDateTime(comment.createdAt)}</span>
                    </div>
                    {canEditComment && !isEditing && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startCommentEdit(comment)}
                          className="text-xs text-pc-text-muted transition-colors hover:text-pc-text"
                        >
                          {t("generated.community.edit")}</button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={isBusy}
                          className="text-xs text-red-400 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? t("generated.community.deleting") : t("generated.community.delete")}
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-pc-text outline-none focus:ring-2 focus:ring-pc-accent/50"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveComment(comment.id)}
                          disabled={isBusy || !commentContent.trim()}
                          className="rounded-lg bg-pc-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-pc-accent-secondary disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy ? <LoadingIndicator className="gap-2" /> : t("generated.community.save")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setCommentContent("");
                          }}
                          className="rounded-lg border border-pc-border px-3 py-1.5 text-xs text-pc-text-secondary transition-colors hover:text-pc-text"
                        >
                          {t("generated.community.cancel")}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm"><CommunityRichContent content={comment.content} /></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
