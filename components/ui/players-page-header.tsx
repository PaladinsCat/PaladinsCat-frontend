/** Canonical Players-family back link and page header. · refs: none */
"use client";

import type { ComponentProps } from "react";
import ContextBackLink from "@/components/context-back-link";
import { useLocalization } from "@/lib/localization-context";
import PageHeader from "@/components/ui/page-header";

/**
 * Render localized contextual back navigation with /players as the fallback destination.
 * I/O types: `none -> JSX.Element`.
 * refs: none
 */
export function PlayersBackLink() {
  const { t } = useLocalization();
  return <ContextBackLink fallbackHref="/players" label={t("generated.players.players")} />;
}

/**
 * Render PageHeader with the localized Players label and /players parent destination, forwarding the remaining display props.
 * I/O types: `props: Omit<ComponentProps<typeof PageHeader>, "parentHref" | "parentLabel"> -> JSX.Element`.
 * refs: none
 */
export default function PlayersPageHeader(props: Omit<ComponentProps<typeof PageHeader>, "parentHref" | "parentLabel">) {
  const { t } = useLocalization();
  return <PageHeader parentHref="/players" parentLabel={t("generated.players.players")} {...props} />;
}
