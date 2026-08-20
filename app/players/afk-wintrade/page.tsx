import PlayerModerationDirectory from "@/components/player-moderation-directory";

export default function AfkWintradePage() {
  return <PlayerModerationDirectory titleKey="moderation.afkWintradeTitle" noticeKey="moderation.afkWintradeThresholdNotice" emptyKey="moderation.noAfkWintrade" filter="afkWintradeOnly" accentClass="bg-sky-400" borderClass="border-sky-400/30" noticeClass="border-sky-400/30 bg-sky-400/10 text-sky-50" voteClass="border-sky-400/30 bg-sky-400/15 text-sky-200" />;
}
