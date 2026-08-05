import PlayerModerationDirectory from "@/components/player-moderation-directory";

export default function AfkWintradePage() {
  return <PlayerModerationDirectory titleKey="moderation.afkWintradeTitle" descriptionKey="moderation.afkWintradeDescription" emptyKey="moderation.noAfkWintrade" filter="afkWintradeOnly" accentClass="bg-amber-400/20 border-amber-400/30 text-amber-400" borderClass="border-amber-400/30" />;
}
