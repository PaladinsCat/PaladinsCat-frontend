import PlayerModerationDirectory from "@/components/player-moderation-directory";

export default function AfkWintradePage() {
  return <PlayerModerationDirectory titleKey="moderation.afkWintradeTitle" descriptionKey="moderation.afkWintradeDescription" emptyKey="moderation.noAfkWintrade" filter="afkWintradeOnly" accentClass="bg-sky-400" borderClass="border-sky-400/20" />;
}
