/** canonical-talent-image component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect, useState } from "react";
import { getCanonicalTalentIconPath } from "@/lib/champion-data";
import { useLocalization } from "@/lib/localization-context";
import SmartImage from "@/components/SmartImage";

type CanonicalTalentImageProps = {
  talentId: number | null | undefined;
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
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function CanonicalTalentImage({
  talentId,
  talentName,
  alt,
  className,
  loading = "lazy",
  fallbackClassName,
}: CanonicalTalentImageProps) {
  const { t } = useLocalization();
  const [src, setSrc] = useState<string | null>(null);
  const displayName = talentName || t("generated.components.canonicalTalentImage.talent");

  useEffect(() => {
    let active = true;
    setSrc(null);

    if (!talentId) return () => { active = false; };

    void getCanonicalTalentIconPath(talentId)
      .then((resolved) => {
        if (active) setSrc(resolved);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => { active = false; };
  }, [talentId]);

  if (!src) {
    return <span className={fallbackClassName ?? className} role="img" aria-label={t("generated.champions.value1Unavailable", { value1: displayName })} />;
  }

  return (
    <SmartImage
      src={src}
      alt={alt ?? displayName}
      className={className}
      loading={loading}
      onError={() => setSrc(null)}
    />
  );
}
