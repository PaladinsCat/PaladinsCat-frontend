import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";

const CONFIG = {
  key: "winRate" as const,
  label: "Win Rate",
  stroke: "#34d399",
  fill: "rgba(52,211,153,0.16)",
};

export default function WinRatePage() {
  return <ChampionRateDetailPage config={CONFIG} />;
}
