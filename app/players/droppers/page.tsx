import PlayerModerationDirectory from "@/components/player-moderation-directory";

export default function DroppersPage() {
  return <PlayerModerationDirectory titleKey="moderation.droppersTitle" noticeKey="moderation.dropperThresholdNotice" emptyKey="moderation.noDroppers" filter="dropperOnly" accentClass="bg-rose-400" borderClass="border-rose-400/20" noticeClass="border-rose-400/30 bg-rose-400/10 text-rose-50" voteClass="border-rose-400/30 bg-rose-400/15 text-rose-200" />;
}
