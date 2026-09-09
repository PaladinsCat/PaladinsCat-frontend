/**
 * Render the shared visible criteria tip for player tag directories.
 *
 * Keeps tag boundaries beneath the page header without defining the page itself.
 *
 * refs: doc: documents/06-reference/design/frontend-design-system.md
 */
"use client";

import { Info } from "lucide-react";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

/**
 * Render one visible tag-boundary tip.
 *
 * I/O types: input `criteriaKey: TranslationKey`, optional `labelKey: TranslationKey` → output `React.JSX.Element`; no network or storage side effects.
 *
 * refs: doc: documents/06-reference/design/frontend-design-system.md
 */
export default function TagCriteriaTip({
  criteriaKey,
  labelKey = "moderation.criteria",
}: {
  criteriaKey: TranslationKey;
  labelKey?: TranslationKey;
}) {
  const { t } = useLocalization();
  return <aside className="pc-surface flex max-w-3xl items-start gap-2 rounded-lg border border-pc-border px-3 py-2.5 text-sm leading-6 text-pc-text-secondary" aria-label={t(labelKey)}>
    <Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-pc-text-secondary" />
    <p><span className="font-semibold text-pc-text">{t(labelKey)}:</span> {t(criteriaKey)}</p>
  </aside>;
}
