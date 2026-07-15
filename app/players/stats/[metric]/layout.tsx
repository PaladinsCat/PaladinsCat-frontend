import type { Metadata } from "next";
import { getServerLocalization } from "@/lib/server-localization";

const METRIC_LABEL_KEYS = {
  dpm: "seo.metrics.dpm",
  hpm: "seo.metrics.hpm",
  gpm: "seo.metrics.cpm",
  mpm: "seo.metrics.spm",
  kda: "seo.metrics.kda",
  winrate: "seo.metrics.winRate",
} as const;

type Props = {
  children: React.ReactNode;
  params: Promise<{ metric: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metric } = await params;
  const { t } = await getServerLocalization();
  const metricKey = metric.toLowerCase() as keyof typeof METRIC_LABEL_KEYS;
  const label = metricKey in METRIC_LABEL_KEYS ? t(METRIC_LABEL_KEYS[metricKey]) : metric.toUpperCase();

  return {
    title: t("seo.players.stats.title", { metric: label }),
    description: t("seo.players.stats.description", { metric: label }),
    alternates: {
      canonical: `/players/stats/${metric}`,
    },
  };
}

export default function PlayerMetricLayout({ children }: Props) {
  return children;
}
