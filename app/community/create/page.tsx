"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPost, getAuthUser, getAuthToken } from "@/lib/api-client";
import { AsyncButton } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";

export default function CreatePostPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const user = getAuthUser();
    const token = getAuthToken();
    if (!user || !token) {
      window.location.href = "/auth/login";
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError(t("generated.community.titleAndContentAreRequired"));
      return;
    }

    setLoading(true);
    try {
      const post = await createPost(user.id, title.trim(), content.trim(), null, token);
      router.push(`/community/${post.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.community.create.page.failedtocreatepost"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/community" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          {t("generated.community.backToCommunity")}</Link>
        <h1 className="text-3xl font-bold text-pc-accent">{t("generated.community.createPost")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-pc-text-secondary mb-1">
            {t("generated.community.title")}</label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            placeholder={t("generated.community.postTitle")}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-pc-text-secondary mb-1">
            {t("generated.community.content")}</label>
          <p className="mb-1 text-xs text-pc-text-muted">{t("generated.community.pasteAYoutubeOrVimeoLinkOnItsOwnLine")}</p>
          <textarea
            id="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted focus:outline-none focus:ring-2 focus:ring-pc-accent/50"
            placeholder={t("generated.community.writeYourPostContent")}
          />
        </div>

        <AsyncButton
          type="submit"
          loading={loading}
          className="w-full py-2.5 bg-pc-accent hover:bg-pc-accent-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("generated.community.createPost")}</AsyncButton>
      </form>
    </div>
  );
}
