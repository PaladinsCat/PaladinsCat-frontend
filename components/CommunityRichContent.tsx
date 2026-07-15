"use client";

import { Fragment } from "react";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

type VideoEmbed = { src: string; titleKey: TranslationKey };

function trimUrl(url: string) {
  return url.replace(/[),.!?;:]+$/, "");
}

function videoEmbed(url: string): VideoEmbed | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? { src: `https://www.youtube-nocookie.com/embed/${id}`, titleKey: "common.media.youtubeVideo" } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") ?? (parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/")[2] : "");
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? { src: `https://www.youtube-nocookie.com/embed/${id}`, titleKey: "common.media.youtubeVideo" } : null;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return /^\d+$/.test(id) ? { src: `https://player.vimeo.com/video/${id}`, titleKey: "common.media.vimeoVideo" } : null;
    }
  } catch {
    // An invalid pasted URL is kept as plain text rather than rendered as a link.
  }
  return null;
}

export default function CommunityRichContent({ content }: { content: string }) {
  const { t } = useLocalization();
  const parts = content.split(/(https?:\/\/[^\s<]+)/gi);
  return (
    <div className="space-y-4 whitespace-pre-wrap break-words text-pc-text">
      <p>
        {parts.map((part, index) => {
          if (!/^https?:\/\//i.test(part)) return <Fragment key={index}>{part}</Fragment>;
          const href = trimUrl(part);
          try {
            const parsed = new URL(href);
            if (!["http:", "https:"].includes(parsed.protocol)) return <Fragment key={index}>{part}</Fragment>;
            return <a key={index} href={href} target="_blank" rel="noreferrer noopener" className="break-all text-pc-accent underline decoration-pc-accent/40 underline-offset-2 hover:text-pc-accent-secondary">{href}</a>;
          } catch {
            return <Fragment key={index}>{part}</Fragment>;
          }
        })}
      </p>
      {parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return null;
        const embed = videoEmbed(trimUrl(part));
        if (!embed) return null;
        return <div key={`embed-${index}`} className="aspect-video overflow-hidden rounded-xl border border-pc-border bg-black shadow-lg"><iframe src={embed.src} title={t(embed.titleKey)} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>;
      })}
    </div>
  );
}
