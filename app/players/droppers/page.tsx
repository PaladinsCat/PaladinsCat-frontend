import PlayerModerationDirectory from "@/components/player-moderation-directory";
import { SpotlightCard, BackgroundGradientAnimation } from "@/components/aceternity";

export default function DroppersPage() {
  return (
    <div className="relative overflow-hidden">
      <BackgroundGradientAnimation />
      <div className="relative z-10">
        <PlayerModerationDirectory titleKey="moderation.droppersTitle" descriptionKey="moderation.droppersDescription" emptyKey="moderation.noDroppers" filter="dropperOnly" accentClass="bg-rose-400" borderClass="border-rose-400/20" /></div>
    </div>
  );
}
