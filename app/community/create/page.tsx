/**
 * Render the /community/create route with `AsyncButton`.
 * refs: none
 */
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createPost, getAuthUser, getAuthToken, hasCookieAuthSession } from "@/lib/api-client";
import { AsyncButton } from "@/components/async-state";
import { useLocalization } from "@/lib/localization-context";
import SubmissionMediaFields from "@/components/submission-media-fields";

/**
 * Render the /community/create route with `AsyncButton`.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function CreatePostPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const user = getAuthUser();
    const token = getAuthToken();
    if (!user || (!token && !hasCookieAuthSession())) {
      window.location.href = "/auth/login";
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError(t("generated.community.titleAndContentAreRequired"));
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.set("title", title.trim());
      form.set("content", content.trim());
      if (sourceUrl.trim()) form.set("source_url", sourceUrl.trim());
      files.forEach((file) => form.append("images", file, file.name));
      const post = await createPost(form, token);
      router.push(`/community/${post.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.community.create.page.failedtocreatepost"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/community" className="text-pc-text-secondary hover:text-pc-accent transition-colors">
          {t("generated.community.backToCommunity")}</Link>
        <h1 className="pc-heading pc-heading-lg">{t("generated.community.createPost")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="pc-card space-y-6">
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="block space-y-1 text-xs font-semibold text-pc-text-secondary" htmlFor="title">
          {t("generated.community.title")}
          <input
            id="title"
            type="text"
            required
            maxLength={300}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal text-pc-text outline-none focus:border-pc-accent-mid"
            placeholder={t("generated.community.postTitle")}
          />
        </label>

        <label className="block space-y-1 text-xs font-semibold text-pc-text-secondary" htmlFor="content">
          {t("generated.community.content")}
          <textarea
            id="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm font-normal leading-6 text-pc-text outline-none focus:border-pc-accent-mid"
            placeholder={t("generated.community.writeYourPostContent")}
          />
        </label>

        <SubmissionMediaFields
          files={files}
          sourceUrl={sourceUrl}
          onFilesChange={(next) => { setFiles(next); setError(null); }}
          onSourceUrlChange={setSourceUrl}
          onValidationError={setError}
        />

        <AsyncButton
          type="submit"
          loading={loading}
          className="min-h-11 rounded-lg bg-pc-accent px-4 py-2 text-sm font-semibold text-black hover:bg-pc-accent-secondary"
        >
          <Send className="h-4 w-4" aria-hidden="true" />{t("generated.community.createPost")}</AsyncButton>
      </form>
    </div>
  );
}
