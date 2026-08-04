import CommunityVoteLeaderboard from "@/components/CommunityVoteLeaderboard";
import { SpotlightCard, BackgroundGradientAnimation } from "@/components/aceternity";

export default function HallOfFamePage() {
  return (
    <div className="relative overflow-hidden">
      <BackgroundGradientAnimation />
      <div className="relative z-10">
        <CommunityVoteLeaderboard kind="hall_of_fame" /></div>
    </div>
  );
}
