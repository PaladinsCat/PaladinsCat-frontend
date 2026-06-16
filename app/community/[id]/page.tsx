"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getPostDetail, addComment, togglePostLike, getAuthUser, getAuthToken, type PostDetail } from "@/lib/api-client";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const loadPost = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getPostDetail(parseInt(id, 10));
      setDetail(data);
    } catch {
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  async function handleLike() {
    if (!detail) return;
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      const newLikes = await togglePostLike(detail.post.id, user.id, token);
      setDetail((prev) => prev ? {
        ...prev,
        post: { ...prev.post, likes: newLikes },
      } : null);
    } catch {
      // Ignore like errors
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !newComment.trim()) return;
    const token = getAuthToken();
    const user = getAuthUser();
    if (!token || !user) {
      window.location.href = "/auth/login";
      return;
    }
    setCommenting(true);
    try {
      const comment = await addComment(detail.post.id, user.id, newComment.trim(), null, token);
      setDetail((prev) => prev ? {
        ...prev,
        comments: [...prev.comments, comment],
      } : null);
      setNewComment("");
    } catch {
      // Ignore comment errors
    } finally {
      setCommenting(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) return <div className="text-center py-12 text-pc-text-secondary">Loading post...</div>;
  if (error) return <div className="text-center py-12 text-pc-text-muted">{error}</div>;
  if (!detail) return <div className="text-center py-12 text-pc-text-muted">Post not found</div>;

  const { post, comments } = detail;

  return (
    <div className="space-y-6">
      <Link href="/community" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
        ← Back to community
      </Link>

      {/* Post content */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h1 className="text-2xl font-bold text-pc-text">{post.title}</h1>
        <div className="flex items-center gap-4 mt-3 text-pc-text-secondary text-sm">
          <span>by {post.username}</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>👁 {post.viewCount}</span>
        </div>
        <div className="mt-4 text-pc-text whitespace-pre-wrap">{post.content}</div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-pc-border">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 text-pc-text-secondary hover:text-pc-accent transition-colors"
          >
            ❤ {post.likes}
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6">
        <h2 className="text-xl font-semibold text-pc-accent mb-4">
          Comments ({comments.length})
        </h2>

        {/* Comment form */}
        <form onSubmit={handleComment} className="mb-6 flex gap-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
          />
          <button
            type="submit"
            disabled={commenting || !newComment.trim()}
            className="px-4 py-2 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {commenting ? "Posting..." : "Post"}
          </button>
        </form>

        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="text-pc-text-muted text-center py-4">No comments yet</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-pc-bg-secondary rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-pc-text font-medium">{comment.username}</span>
                  <span className="text-pc-text-muted">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-pc-text mt-2">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
