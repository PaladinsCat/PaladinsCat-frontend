/**
 * Render community rich content.
 * refs: none
 */
"use client";

import { Fragment } from "react";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";
import ExternalVideoConsent from "@/components/ExternalVideoConsent";

type VideoEmbed = { provider: string; src: string; titleKey: TranslationKey };

function trimUrl(url: string) {
  return url.replace(/[),.!?;:]+$/, "");
}

function videoEmbed(url: string): VideoEmbed | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, titleKey: "common.media.youtubeVideo" } : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") ?? (parsed.pathname.startsWith("/embed/") ? parsed.pathname.split("/")[2] : "");
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}`, titleKey: "common.media.youtubeVideo" } : null;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return /^\d+$/.test(id) ? { provider: "vimeo", src: `https://player.vimeo.com/video/${id}`, titleKey: "common.media.vimeoVideo" } : null;
    }
  } catch {
    // An invalid pasted URL is kept as plain text rather than rendered as a link.
  }
  return null;
}

/**
 * Render community rich content.
 * refs: none
 * I/O types: `{ content }: { content: string } -> JSX.Element`.
 */
export default function CommunityRichContent({ content }: { content: string }) {
  const { t } = useLocalization();
  const parts = content.split(/(https?:\/\/[^\s<]+)/gi);
  return (
    <div data-allow-native-drag="true" className="space-y-4 whitespace-pre-wrap break-words text-pc-text">
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
        return <ExternalVideoConsent key={`embed-${index}`} provider={embed.provider} src={embed.src} title={t(embed.titleKey)} />;
      })}
    </div>
  );
}
