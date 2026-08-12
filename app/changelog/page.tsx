"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchChangelog, type ChangelogPage } from "@/lib/api-client";
import { formatLocalDateTime, formatRelativeTime } from "@/lib/time-format";
import { LoadingPanel } from "@/components/async-state";
import { usePersistentDirectoryPage } from "@/components/player-directory-pagination";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

const PER_PAGE = 10;

type ChangelogSection = {
  title: string;
  items: string[];
  color: string;
};

function parseChangelog(text: string, changesLabel: string): ChangelogSection[] {
  if (!text || !text.trim()) return [];

  const sections: ChangelogSection[] = [];
  const lines = text.split("\\n").filter((l) => l.trim());
  let currentSection: ChangelogSection | null = null;
  const orphanItems: string[] = [];

  for (const line of lines) {
    const sectionMatch = line.match(/^\s*[-*]?\s*\*\*(Added|Changed|Fixed|Removed|Refactored|Improved|Security)\*\*\s*[-:–—]*\s*(.*)/i);
    if (sectionMatch) {
      if (currentSection && currentSection.items.length > 0) sections.push(currentSection);
      const title = sectionMatch[1];
      const colorMap: Record<string, string> = {
        Added: "text-emerald-400",
        Changed: "text-amber-400",
        Fixed: "text-red-400",
        Removed: "text-gray-400",
        Refactored: "text-violet-400",
        Improved: "text-blue-400",
        Security: "text-rose-400",
      };
      currentSection = {
        title,
        items: sectionMatch[2].trim() ? [sectionMatch[2].trim()] : [],
        color: colorMap[title] || "text-pc-text",
      };
    } else if (line.match(/^[-*•]\s+/)) {
      const item = line.replace(/^[-*•]\s+/, "").trim();
      if (item) {
        if (currentSection) {
          currentSection.items.push(item);
        } else {
          orphanItems.push(item);
        }
      }
    } else if (line.trim() && !line.match(/^\s*$/)) {
      if (currentSection) {
        currentSection.items.push(line.trim());
      } else {
        orphanItems.push(line.trim());
      }
    }
  }

  if (currentSection && currentSection.items.length > 0) sections.push(currentSection);

  if (orphanItems.length > 0) {
    sections.unshift({ title: changesLabel, items: orphanItems, color: "text-pc-text" });
  }

  return sections;
}

function sourceLabel(source: string | null, t: (key: TranslationKey) => string) {
  if (!source) return null;
  const labels: Record<string, TranslationKey> = {
    "deploy-script": "common.changelog.automatedDeploy",
    "manual-migration": "common.changelog.manualMigration",
    "runtime_env_fallback": "common.changelog.runtimeFallback",
    "site_versions_legacy": "common.changelog.legacyVersion",
  };
  return labels[source] ? t(labels[source]) : source;
}

function componentLabel(component: string) {
  const labels: Record<string, string> = {
    frontend: "Frontend",
    backend: "Backend",
    "backend-rust-api": "Backend API",
    "backend-rust-auto-ingester": "Ingest worker",
    "backend-rust-hourly-gap-checker": "Gap-check worker",
    hirezrelay: "Hi-Rez relay",
    discordbot: "Discord bot",
    "discord-bot": "Discord bot",
    database: "Database",
    platform: "Platform",
    stack: "Full stack",
    "legacy-monorepo": "Legacy monorepo",
  };
  return labels[component] ?? component.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getVersionColor(type: "major" | "minor" | "patch") {
  switch (type) {
    case "major": return "bg-rose-500";
    case "minor": return "bg-amber-500";
    case "patch": return "bg-pc-accent";
  }
}

function releaseLabel(type: "major" | "minor" | "patch", t: (key: TranslationKey) => string) {
  const labels = {
    major: "common.changelog.major",
    minor: "common.changelog.minor",
    patch: "common.changelog.patch",
  } as const;
  return t(labels[type]);
}

function getVersionTextColor(type: "major" | "minor" | "patch") {
  switch (type) {
    case "major": return "text-rose-400";
    case "minor": return "text-amber-400";
    case "patch": return "text-pc-accent";
  }
}

// Version History Graph - compact timeline visualization
function VersionHistoryGraph({ entries }: { entries: ChangelogPage["data"] }) {
  const { t , formatRelative} = useLocalization();
  if (entries.length === 0) return null;

  return (
    <div className="pc-card sticky top-20">
      <h2 className="text-sm font-bold text-pc-text mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pc-accent"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        {t("generated.changelog.versionHistory")}</h2>

      <div className="space-y-0">
        {entries.map((entry, i) => {
          const changeType = entry.releaseType;
          const color = getVersionColor(changeType);
          const textColor = getVersionTextColor(changeType);
          const hasChangelog = entry.changelog && entry.changelog.trim().length > 0;

          return (
            <div key={entry.id} className="flex items-start gap-3 group">
              {/* Timeline */}
              <div className="flex flex-col items-center pt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${color} ${hasChangelog ? "ring-2 ring-white/10" : "opacity-50"} transition-all group-hover:scale-125`} />
                {i < entries.length - 1 && (
                  <div className="w-px flex-1 bg-pc-border min-h-[20px] mt-1" />
                )}
              </div>

              {/* Info */}
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-mono ${textColor}`}>
                    {entry.totalVersion ?? entry.componentVersion}
                  </span>
                  <span className="truncate text-xs font-semibold text-pc-text-secondary">
                    {componentLabel(entry.component)} {entry.totalVersion ? entry.componentVersion : ""}
                  </span>
                  <span className="text-xs font-mono text-pc-text-muted truncate">
                    {entry.gitCommitShort}
                  </span>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wide ${textColor}`}>
                  {releaseLabel(changeType, t)} · {t(entry.changeCount === 1 ? "common.count.changeOne" : "common.count.changeMany", { count: entry.changeCount })}
                </span>
                {entry.deployedAt && (
                  <time dateTime={entry.deployedAt} className="text-xs text-pc-text-muted block mt-0.5">
                    {formatRelative(entry.deployedAt)}
                  </time>
                )}
                {!hasChangelog && (
                  <span className="text-xs text-pc-text-muted italic block mt-0.5">
                    {t("generated.changelog.deployment")}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-pc-border">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pc-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {t("generated.changelog.major10")}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {t("generated.changelog.minor59")}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-pc-accent" /> {t("generated.changelog.patch04")}</span>
        </div>
      </div>
    </div>
  );
}

function ChangelogEntry({ entry, index }: { entry: ChangelogPage["data"][number]; index: number }) {
  const { t , formatDateTime, formatRelative} = useLocalization();
  const sections = useMemo(() => parseChangelog(entry.changelog, t("common.changelog.changes")), [entry.changelog, t]);
  const hasChangelog = sections.length > 0;

  return (
    <article className="group pb-6 border-b border-pc-border last:border-b-0">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        <span className="text-sm font-bold text-pc-text">{entry.totalVersion ?? entry.componentVersion}</span>
        <span className="rounded-md border border-pc-border bg-pc-bg-secondary px-2 py-0.5 text-xs font-semibold text-pc-text-secondary">
          {componentLabel(entry.component)} {entry.totalVersion ? entry.componentVersion : ""}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
          entry.releaseType === "major"
            ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
            : entry.releaseType === "minor"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
              : "border-pc-accent/40 bg-pc-accent/10 text-pc-accent"
        }`}>
          {releaseLabel(entry.releaseType, t)} · {t(entry.changeCount === 1 ? "common.count.changeOne" : "common.count.changeMany", { count: entry.changeCount })}
        </span>
        <span className="font-mono text-xs text-pc-text-muted bg-pc-bg-secondary px-1.5 py-0.5 rounded">
          {entry.gitCommitShort}
        </span>
        {entry.gitBranch && (
          <span className="text-xs text-pc-text-muted">
            {entry.gitBranch}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-pc-text-muted mb-2">
        {entry.deployedAt && (
          <time dateTime={entry.deployedAt} title={formatDateTime(entry.deployedAt)}>
            {formatRelative(entry.deployedAt)}
          </time>
        )}
        {sourceLabel(entry.source, t) && (
          <>
            <span>·</span>
            <span>{sourceLabel(entry.source, t)}</span>
          </>
        )}
      </div>

      {/* Changelog sections */}
      {hasChangelog ? (
        <div className="space-y-2">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className={`text-xs font-semibold ${section.color} mb-1`}>
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-pc-text-secondary leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-pc-text-muted italic">
          {t("generated.changelog.deploymentRecordedNoChangelogProvided")}</p>
      )}
    </article>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useLocalization();
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 pt-4" aria-label={t("generated.changelog.pagination")}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg text-xs text-pc-text-muted hover:text-pc-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {t("generated.changelog.prev")}</button>
      <div className="flex items-center gap-1 mx-2">
        {pages.map((pn, i) =>
          pn === "..." ? (
            <span key={`e-${i}`} className="px-1 text-pc-text-muted text-xs">…</span>
          ) : (
            <button
              key={pn}
              onClick={() => onChange(pn as number)}
              className={`w-8 h-8 rounded-lg text-xs transition-colors ${
                page === pn
                  ? "bg-pc-accent text-pc-bg font-bold"
                  : "text-pc-text-muted hover:text-pc-accent"
              }`}
            >
              {pn}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg text-xs text-pc-text-muted hover:text-pc-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        {t("generated.changelog.next")}</button>
    </nav>
  );
}

export default function ChangelogPage() {
  const { t } = useLocalization();
  const [page, setPage] = usePersistentDirectoryPage();
  const [data, setData] = useState<ChangelogPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchChangelog({ page, perPage: PER_PAGE }).then((result) => {
      if (!cancelled) setData(result);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = data?.totalPages ?? 1;
  const totalEntries = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="pc-heading pc-heading-lg text-pc-accent">{t("generated.changelog.changelog")}</h1>
        <p className="text-sm text-pc-text-muted">
          {t(totalEntries === 1 ? "common.count.deploymentRecordedOne" : "common.count.deploymentRecordedMany", { count: totalEntries })}</p>
      </div>

      {/* Content: Graph + Entries */}
      {loading ? (
        <LoadingPanel />
      ) : totalEntries === 0 ? (
        <div className="pc-card text-center py-12">
          <p className="text-pc-text-muted text-sm">{t("generated.changelog.noDeploymentHistoryYet")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Version History Graph */}
          <div className="lg:col-span-1">
            <VersionHistoryGraph entries={data?.data ?? []} />
          </div>

          {/* Right: Detailed Entries */}
          <div className="lg:col-span-2 pc-card">
            {data?.data.map((entry, i) => (
              <ChangelogEntry key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
