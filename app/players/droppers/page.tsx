import PlayerModerationDirectory from "@/components/player-moderation-directory";

export default function DroppersPage() {
  return <PlayerModerationDirectory titleKey="moderation.droppersTitle" descriptionKey="moderation.droppersDescription" emptyKey="moderation.noDroppers" filter="dropperOnly" accentClass="bg-rose-400" borderClass="border-rose-400/20" />;
}
