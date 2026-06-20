import ChampionRateDetailPage from "@/components/ChampionRateDetailPage";

const CONFIG = {
  key: "banRate" as const,
  label: "Ban Rate",
  stroke: "#fb7185",
  fill: "rgba(251,113,133,0.16)",
};

export default function BanRatePage() {
  return <ChampionRateDetailPage config={CONFIG} />;
}
