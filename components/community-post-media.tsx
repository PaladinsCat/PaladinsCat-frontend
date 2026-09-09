/** Render community-post media returned by the shared submission pipeline. */
"use client";

import { ExternalLink } from "lucide-react";
import type { Post } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

function imageUrl(url: string, format: "avif" | "original") {
  return `${url}${url.includes("?") ? "&" : "?"}format=${format}`;
}

function embedUrl(url: string, provider: Post["provider"]) {
  if (provider !== "twitch" || typeof window === "undefined") return url;
  const embed = new URL(url);
  embed.searchParams.set("parent", window.location.hostname);
  return embed.toString();
}

export default function CommunityPostMedia({ post }: { post: Post }) {
  const { formatNumber, t } = useLocalization();
  if (post.imageUrls.length === 0 && !post.embedUrl && !post.sourceUrl) return null;
  return (
    <div className="mt-4 space-y-3">
      {post.imageUrls.length > 0 && <div className={`grid gap-px overflow-hidden rounded-xl border border-pc-border bg-pc-border ${post.imageUrls.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {post.imageUrls.map((url, index) => <picture key={url} className="block aspect-video bg-pc-bg"><source srcSet={imageUrl(url, "avif")} type="image/avif" /><img src={imageUrl(url, "original")} alt={t("community.postImageAlt", { value1: formatNumber(index + 1), value2: post.title })} loading="lazy" decoding="async" className="h-full w-full object-contain" /></picture>)}
      </div>}
      {post.embedUrl && (post.provider === "medal" || post.provider === "discord") ? (
        <div className="aspect-video overflow-hidden rounded-xl bg-black"><video controls playsInline preload="metadata" src={post.embedUrl} title={t("community.postClipTitle", { value1: post.provider === "discord" ? "Discord" : "Medal", value2: post.title })} className="h-full w-full object-contain" /></div>
      ) : post.embedUrl ? (
        <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe src={embedUrl(post.embedUrl, post.provider)} title={t("community.postVideoTitle", { value1: post.provider || "Video", value2: post.title })} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
      ) : null}
      {post.sourceUrl && <a href={post.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-pc-accent hover:text-pc-accent-secondary"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />{t("community.openSource")}</a>}
    </div>
  );
}
