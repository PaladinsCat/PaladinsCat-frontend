import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";

const CONFIG = {
  key: "winRate" as const,
  labelKey: "common.sort.winRate",
  stroke: "#34d399",
  fill: "rgba(52,211,153,0.16)",
} as const;

export default function WinRatePage() {
  return <ChampionRateDetailPage config={CONFIG} />;
}
