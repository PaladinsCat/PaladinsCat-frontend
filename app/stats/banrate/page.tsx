import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";

const CONFIG = {
  key: "banRate" as const,
  labelKey: "common.metrics.banRate",
  stroke: "#fb7185",
  fill: "rgba(251,113,133,0.16)",
} as const;

export default function BanRatePage() {
  return <ChampionRateDetailPage config={CONFIG} />;
}
