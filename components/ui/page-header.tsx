/** Canonical page header: parent context, neutral title, optional useful context and actions. */
import type { ReactNode } from "react";
import ContextBackLink from "@/components/context-back-link";

export default function PageHeader({
  parentHref,
  parentLabel,
  title,
  description,
  meta,
  actions,
}: {
  parentHref?: string;
  parentLabel?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return <header>
    {parentHref && parentLabel && <ContextBackLink fallbackHref={parentHref} label={parentLabel} />}
    <div className={`${parentHref && parentLabel ? "mt-2 " : ""}flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`}>
      <div className="min-w-0">
        {meta}
        <h1 className="pc-heading pc-heading-lg break-words">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm text-pc-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>;
}
