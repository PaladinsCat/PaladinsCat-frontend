import PlayerModerationDirectory from "@/components/player-moderation-directory";
import { SpotlightCard, BackgroundGradientAnimation } from "@/components/aceternity";

export default function AfkWintradePage() {
  return (
    <div className="relative overflow-hidden">
      <BackgroundGradientAnimation />
      <div className="relative z-10">
        <PlayerModerationDirectory titleKey="moderation.afkWintradeTitle" descriptionKey="moderation.afkWintradeDescription" emptyKey="moderation.noAfkWintrade" filter="afkWintradeOnly" accentClass="bg-amber-400/20 border-amber-400/30 text-amber-400" borderClass="border-amber-400/30" /></div>
    </div>
  );
}
