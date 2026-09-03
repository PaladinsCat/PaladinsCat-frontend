/**
 * Define the player route surface for droppers page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 * refs: none
 */
import PlayerModerationDirectory from "@/components/player-moderation-directory";

/**
 * Render the DroppersPage view for the player droppers page route.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function DroppersPage() {
  return <PlayerModerationDirectory titleKey="moderation.droppersTitle" noticeKey="moderation.dropperThresholdNotice" emptyKey="moderation.noDroppers" filter="dropperOnly" accentClass="bg-rose-400" borderClass="border-rose-400/20" noticeClass="border-rose-400/30 bg-rose-400/10 text-rose-50" voteClass="text-rose-200" />;
}
