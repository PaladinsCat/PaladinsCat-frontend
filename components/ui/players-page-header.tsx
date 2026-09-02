/** Canonical Players-family back link and page header. */
"use client";

import type { ComponentProps } from "react";
import ContextBackLink from "@/components/context-back-link";
import { useLocalization } from "@/lib/localization-context";
import PageHeader from "@/components/ui/page-header";

export function PlayersBackLink() {
  const { t } = useLocalization();
  return <ContextBackLink fallbackHref="/players" label={t("generated.players.players")} />;
}

export default function PlayersPageHeader(props: Omit<ComponentProps<typeof PageHeader>, "parentHref" | "parentLabel">) {
  const { t } = useLocalization();
  return <PageHeader parentHref="/players" parentLabel={t("generated.players.players")} {...props} />;
}
