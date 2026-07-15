"use client";

/**
 * Footer component — full footer on every page
 * Pattern source: Paladins.guru (footer on every page with links, social, copyright)
 * Structure: 3 columns (Links | Social | Copyright) on desktop, stacked on mobile
 * Hi-Rez Studios data attribution required per Paladins.guru footer pattern
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchSiteVersion, type SiteVersion } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";

export default function Footer() {
  const { t } = useLocalization();
  const [siteVersion, setSiteVersion] = useState<SiteVersion | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSiteVersion().then((version) => {
      if (!cancelled && version?.version) {
        setSiteVersion(version);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const versionLabel = useMemo(() => {
    if (!siteVersion?.version) return "";
    return [siteVersion.version, siteVersion.gitCommitShort].filter(Boolean).join(" · ");
  }, [siteVersion]);

  const versionTitle = useMemo(() => {
    if (!siteVersion) return "";
    const parts = [
      siteVersion.gitCommit ? t("footer.commit", { commit: siteVersion.gitCommit }) : "",
      siteVersion.gitBranch ? t("footer.branch", { branch: siteVersion.gitBranch }) : "",
      siteVersion.gitDirty ? t("footer.dirtyWorktree") : "",
      siteVersion.dbSchemaVersion ? t("footer.databaseSchema", { version: siteVersion.dbSchemaVersion }) : "",
      siteVersion.deployedAt ? t("footer.deployed", { date: siteVersion.deployedAt }) : "",
    ].filter(Boolean);
    return parts.join("\n");
  }, [siteVersion, t]);

  return (
    // Footer: sticky bottom layout, secondary bg, top border separation
    <footer className="bg-pc-bg-secondary border-t border-pc-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Column 1: Navigation Links + Discord */}
          <div>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
                  {t("menu.about")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
                  {t("footer.termsOfUse")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
                  {t("menu.contact")}
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-pc-text-secondary hover:text-pc-accent transition-colors text-sm">
                  {t("menu.changelog")}
                </Link>
              </li>
            </ul>
            <div className="mt-4">
              <a
                href="https://discord.gg/VqYMXAR"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-pc-text-muted hover:text-pc-accent transition-colors text-sm"
                aria-label={t("footer.joinDiscord")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.043c-.21.375-.444.864-.608 1.26a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.26.077.077 0 0 0-.079-.043 19.79 19.79 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.135-.317 13.54.087 17.936a.082.082 0 0 0 .029.059 20.04 20.04 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.463-.63.874-1.294 1.226-1.991a.076.076 0 0 0-.041-.104 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.29.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.29a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.99a.076.076 0 0 0 .084.028 20.04 20.04 0 0 0 6.001-3.03.077.077 0 0 0 .028-.058c.45-4.91-.993-9.253-3.552-13.536a.061.061 0 0 0-.032-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419s.972-2.42 2.157-2.42c1.19 0 2.16 1.086 2.158 2.42s-.97 2.419-2.158 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419s.972-2.42 2.157-2.42c1.19 0 2.16 1.086 2.158 2.42s-.97 2.419-2.158 2.419Z"/>
                </svg>
                {t("footer.joinDiscord")}
              </a>
            </div>
          </div>

          {/* Column 2: Brand + Copyright */}
          <div className="flex flex-col items-start md:items-end text-right">
            <Link href="/" className="text-xl font-bold text-pc-text hover:text-pc-text-muted transition-colors mb-3">
              {t("generated.common.paladinscat")}</Link>
            <p className="text-pc-text-muted text-xs">
              {t("generated.common.paladinscat.edf580c")}{" "}{new Date().getFullYear()}<br />
              {t("footer.dataProvidedBy")}<br />
              {t("footer.allRightsReserved")}
            </p>
          </div>

        </div>

        {/* Keep this slot mounted so the async version label cannot resize the footer. */}
        <div className="mt-6 min-h-8 pt-4 border-t border-pc-border/50 text-center">
          {versionLabel && (
            <span className="text-pc-text-muted text-xs" title={versionTitle}>{versionLabel}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
