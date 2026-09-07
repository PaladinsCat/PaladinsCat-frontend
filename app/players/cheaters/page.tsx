/** Dedicated Cheater Portal landing page. */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileImage, History, ShieldAlert } from "lucide-react";
import { LoadingPanel } from "@/components/async-state";
import PlatformIcon from "@/components/platform-icon";
import PlayersPageHeader from "@/components/ui/players-page-header";
import { fetchCheaterPortal, type CheaterPortal, type CheaterPortalEntry } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import { getPercentageColor } from "@/lib/stat-quality";

const EMPTY_PORTAL: CheaterPortal = { activeCount: 0, inactiveCount: 0, evidenceCount: 0, latest: [] };
const USE_CHEATER_PORTAL_MOCK = process.env.NODE_ENV === "development";
const MOCK_PLATFORMS = ["Steam", "Epic Games", "PlayStation", "Xbox", "Hi-Rez"] as const;
const MOCK_CHEATER_POOL: CheaterPortalEntry[] = [
  ["AetherFox", "Aim review"], ["CobaltPaw", "Input pattern review"], ["DuskVandal", "Movement review"],
  ["EmberNyx", "Match replay review"], ["FrostByte", "Tracking review"], ["GloomRunner", "Fire-rate review"],
  ["HexaVee", "Community evidence review"], ["IronSundae", "Aim review"], ["JadeRecoil", "Input pattern review"],
  ["KineticMochi", "Movement review"], ["LunarRook", "Match replay review"], ["MauveQuasar", "Tracking review"],
  ["NeonBastion", "Fire-rate review"], ["ObsidianKit", "Community evidence review"], ["PixelSovereign", "Aim review"],
  ["QuietCatalyst", "Input pattern review"], ["RiftNomad", "Movement review"], ["SolarMarten", "Match replay review"],
  ["TacticalPanda", "Tracking review"], ["UmbraCircuit", "Fire-rate review"], ["VelvetRaptor", "Community evidence review"],
  ["WinterSyntax", "Aim review"], ["XenoPounce", "Input pattern review"], ["YoruByte", "Movement review"],
].map(([name, reason], index) => {
  const wins = 80 + index * 23;
  const losses = 35 + index * 17;
  return {
    kind: "player" as const,
    subjectId: `mock-${index + 1}`,
    playerId: 900000 + index + 1,
    name,
    platform: MOCK_PLATFORMS[index % MOCK_PLATFORMS.length],
    lastSeen: "2026-09-05T12:00:00Z",
    markedAt: `2026-09-${String(5 - (index % 5)).padStart(2, "0")}T${String(8 + (index % 10)).padStart(2, "0")}:15:00Z`,
    reason: `[mock] ${reason}`,
    level: 20 + ((index * 7) % 96),
    wins,
    losses,
    winRate: (wins / (wins + losses)) * 100,
    leaveRate: 1.2 + (index % 7) * 0.6,
  };
});

function createMockCheaterPortal(): CheaterPortal {
  const latest = [...MOCK_CHEATER_POOL];
  for (let index = latest.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [latest[index], latest[swapIndex]] = [latest[swapIndex], latest[index]];
  }
  return { activeCount: 37, inactiveCount: 126, evidenceCount: 84, latest: latest.slice(0, 20) };
}

const MOCK_CHEATER_PORTAL: CheaterPortal = { activeCount: 37, inactiveCount: 126, evidenceCount: 84, latest: MOCK_CHEATER_POOL.slice(0, 20) };

function entryHref(entry: CheaterPortalEntry): string {
  return entry.kind === "private" ? `/players/private-accounts/${entry.subjectId}` : `/players/cheaters/${entry.playerId ?? entry.subjectId}`;
}

type NumberFormatter = (value: number | null | undefined, options?: Intl.NumberFormatOptions) => string;

function MetricCell({ label, title, value, style }: { label: string; title: string; value: string; style?: { color: string } }) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-0.5 whitespace-nowrap" title={title} aria-label={`${title}: ${value}`}>
      <span className="text-xs tracking-[0.04em] text-pc-text-muted">{label}</span>
      <span className="text-xs font-mono font-medium tabular-nums text-pc-text" style={style}>{value}</span>
    </span>
  );
}

function LatestEntry({
  entry,
  formatNumber,
  formatPercent,
  formatDateTime,
  labels,
}: {
  entry: CheaterPortalEntry;
  formatNumber: NumberFormatter;
  formatPercent: NumberFormatter;
  formatDateTime: (value: string | null | undefined) => string;
  labels: { level: string; wins: string; losses: string; winRate: string };
}) {
  return (
    <Link href={entryHref(entry)} className="group flex items-start justify-between gap-3 rounded-lg border border-pc-border bg-pc-bg/45 px-3 py-2.5 transition-colors hover:border-red-400/50 hover:bg-red-500/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 shrink truncate text-sm font-semibold text-pc-text group-hover:text-red-200">{entry.name}</span>
          {entry.playerId != null && (
            <span className="inline-flex shrink-0 items-baseline gap-0.5 whitespace-nowrap text-xs" title={`Player ID: ${entry.playerId}`} aria-label={`Player ID: ${entry.playerId}`}>
              <span className="text-pc-text-muted">ID</span>
              <span className="font-mono tabular-nums text-pc-text">{entry.playerId}</span>
            </span>
          )}
          <span className="shrink-0 border-l border-pc-border/50 pl-3">
            <MetricCell label={labels.level} title={labels.level} value={formatNumber(entry.level)} />
          </span>
          <span className="flex min-w-0 flex-1 items-center justify-end gap-x-3" aria-label="Player statistics">
            <PlatformIcon platform={entry.platform} />
            <span className="inline-flex shrink-0 items-center gap-x-2" aria-label={`${labels.wins}, ${labels.losses}, ${labels.winRate}`}>
              <MetricCell label="W" title={labels.wins} value={formatNumber(entry.wins)} />
              <MetricCell label="L" title={labels.losses} value={formatNumber(entry.losses)} />
              <MetricCell label="WR" title={labels.winRate} value={formatPercent(entry.winRate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} style={entry.winRate == null ? undefined : { color: getPercentageColor(entry.winRate) }} />
            </span>
          </span>
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-pc-text-muted">
          <span className="min-w-0 flex-1 truncate">{entry.reason || "Confirmed cheater"}</span>
          {entry.markedAt && <time className="shrink-0 font-mono tabular-nums" dateTime={entry.markedAt}>{formatDateTime(entry.markedAt)}</time>}
        </span>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-pc-text-muted transition-[transform,color] duration-[120ms] group-hover:translate-x-1 group-hover:text-red-200" aria-hidden="true" />
    </Link>
  );
}

export default function CheatersPage() {
  const { formatDateTime, formatNumber, formatPercent, t } = useLocalization();
  const statLabels = {
    level: t("generated.players.level"),
    wins: t("generated.players.wins"),
    losses: t("generated.players.losses"),
    winRate: t("generated.players.winRate"),
  };
  const [portal, setPortal] = useState<CheaterPortal>(USE_CHEATER_PORTAL_MOCK ? MOCK_CHEATER_PORTAL : EMPTY_PORTAL);
  const [loading, setLoading] = useState(!USE_CHEATER_PORTAL_MOCK);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    if (USE_CHEATER_PORTAL_MOCK) {
      void Promise.resolve().then(() => { if (active) setPortal(createMockCheaterPortal()); });
      return () => { active = false; };
    }
    fetchCheaterPortal().then((value) => { if (active) setPortal(value); }).catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <PlayersPageHeader title="Cheater Portal" description="Browse confirmed cheaters and their evidence, or submit evidence for review." />
      {error && <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">The portal could not be loaded.</div>}

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <Link href="/players/cheaters/active" data-card-accent="red" aria-label="Open active cheater directory" className="pc-glass pc-home-feature-card group relative flex h-full min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center shadow-lg transition-[transform,border-color] duration-[280ms] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
            <ArrowRight className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition-[transform,color] duration-[120ms] group-hover:translate-x-1 group-hover:text-red-200" aria-hidden="true" />
            <span className="pc-card-icon pc-home-card-icon flex h-12 w-12 items-center justify-center rounded-xl border">
              <ShieldAlert className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="relative mt-5">
              <h2 className="text-xl font-bold tracking-tight text-pc-text group-hover:text-red-100">Active cheaters</h2>
              <p className="mt-6 text-2xl font-bold tabular-nums text-pc-text">{formatNumber(portal.activeCount)}</p>
              <p className="text-xs text-pc-text-muted">records</p>
            </div>
        </Link>

        <Link href="/players/cheaters/inactive" data-card-accent="secondary" className="pc-glass pc-home-feature-card group relative flex h-full min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center shadow-lg transition-[transform,border-color] duration-[280ms] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
          <ArrowRight className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition-[transform,color] duration-[120ms] group-hover:translate-x-1 group-hover:text-violet-200" aria-hidden="true" />
          <span className="pc-home-card-icon flex h-12 w-12 items-center justify-center rounded-xl border">
            <History className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="relative mt-5">
            <h2 className="text-xl font-bold tracking-tight text-pc-text group-hover:text-violet-100">Inactive cheater database</h2>
            <p className="mt-6 text-2xl font-bold tabular-nums text-pc-text">{formatNumber(portal.inactiveCount)}</p>
            <p className="text-xs text-pc-text-muted">records</p>
          </div>
        </Link>

        <Link href="/players/cheaters/evidence" data-card-accent="tertiary" title="View or submit evidence" aria-label="View or submit evidence" className="pc-glass pc-home-feature-card group relative flex h-full min-h-64 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-6 text-center shadow-lg transition-[transform,border-color] duration-[280ms] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
          <ArrowRight className="pc-home-card-arrow absolute right-5 top-5 h-4 w-4 text-pc-text-muted transition-[transform,color] duration-[120ms] group-hover:translate-x-1 group-hover:text-amber-200" aria-hidden="true" />
          <span className="pc-home-card-icon flex h-12 w-12 items-center justify-center rounded-xl border">
            <FileImage className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="relative mt-5">
            <h2 className="text-xl font-bold tracking-tight text-pc-text group-hover:text-amber-100">Evidence portal</h2>
            <p className="mt-6 text-2xl font-bold tabular-nums text-pc-text">{formatNumber(portal.evidenceCount)}</p>
            <p className="text-xs text-pc-text-muted">evidence</p>
          </div>
        </Link>
      </div>

      <section className="pc-card" aria-labelledby="latest-cheaters-preview-title">
        <h2 id="latest-cheaters-preview-title" className="text-lg font-semibold text-pc-text">Latest cheaters</h2>
        {loading ? <LoadingPanel compact className="py-8" /> : portal.latest.length === 0 ? (
          <p className="py-8 text-center text-sm text-pc-text-muted">No confirmed cheaters yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-4">
            <div className="space-y-2">{portal.latest.slice(0, 10).map((entry) => <LatestEntry key={`${entry.kind}:${entry.subjectId}`} entry={entry} formatNumber={formatNumber} formatPercent={formatPercent} formatDateTime={formatDateTime} labels={statLabels} />)}</div>
            <div className="space-y-2">{portal.latest.slice(10, 20).map((entry) => <LatestEntry key={`${entry.kind}:${entry.subjectId}`} entry={entry} formatNumber={formatNumber} formatPercent={formatPercent} formatDateTime={formatDateTime} labels={statLabels} />)}</div>
          </div>
        )}
      </section>
    </div>
  );
}
