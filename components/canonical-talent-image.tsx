"use client";

import { useEffect, useState } from "react";
import { getCanonicalTalentIconPath } from "@/lib/champion-data";

type CanonicalTalentImageProps = {
  championName: string | null | undefined;
  talentName: string | null | undefined;
  alt?: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallbackClassName?: string;
};

/**
 * Talent artwork must always come from the canonical champion-data route.
 * Match payload icon URLs are useful metadata, but they are not authoritative:
 * several champion talents have punctuation or historic filenames that only
 * the champion reference correctly resolves.
 */
export default function CanonicalTalentImage({
  championName,
  talentName,
  alt,
  className,
  loading = "lazy",
  fallbackClassName,
}: CanonicalTalentImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const displayName = talentName || "Talent";

  useEffect(() => {
    let active = true;
    setSrc(null);

    if (!championName || !talentName) return () => { active = false; };

    void getCanonicalTalentIconPath(championName, talentName)
      .then((resolved) => {
        if (active) setSrc(resolved);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => { active = false; };
  }, [championName, talentName]);

  if (!src) {
    return <span className={fallbackClassName ?? className} role="img" aria-label={`${displayName} unavailable`} />;
  }

  return (
    <img
      src={src}
      alt={alt ?? displayName}
      className={className}
      loading={loading}
      onError={() => setSrc(null)}
    />
  );
}
