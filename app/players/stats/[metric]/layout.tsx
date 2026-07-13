import type { Metadata } from "next";

const METRIC_LABELS: Record<string, string> = {
  dpm: "Damage Per Minute",
  hpm: "Healing Per Minute",
  gpm: "Credits Per Minute",
  mpm: "Shielding Per Minute",
  kda: "KDA",
  winrate: "Win Rate",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ metric: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metric } = await params;
  const label = METRIC_LABELS[metric.toLowerCase()] ?? metric.toUpperCase();

  return {
    title: `Paladins Player ${label} Leaderboard`,
    description: `Rank Paladins players by ${label} with account stats, champion performance, match counts, and ranked data.`,
    alternates: {
      canonical: `/players/stats/${metric}`,
    },
  };
}

export default function PlayerMetricLayout({ children }: Props) {
  return children;
}
