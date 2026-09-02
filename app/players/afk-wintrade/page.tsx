/**
 * Define the player route surface for afk-wintrade page and its local data boundary.
 * This file owns the page, layout, loading state, or route handler named by its path.
 * It does not own unrelated player sections or shared library policy.
 */
import PlayerModerationDirectory from "@/components/player-moderation-directory";

/**
 * Render the AfkWintradePage view for the player afk-wintrade page route.
 * Returns: `React.JSX.Element`
 */
export default function AfkWintradePage() {
  return <PlayerModerationDirectory titleKey="moderation.afkWintradeTitle" noticeKey="moderation.afkWintradeThresholdNotice" emptyKey="moderation.noAfkWintrade" filter="afkWintradeOnly" accentClass="bg-sky-400" borderClass="border-sky-400/30" noticeClass="border-sky-400/30 bg-sky-400/10 text-sky-50" voteClass="text-sky-200" />;
}
