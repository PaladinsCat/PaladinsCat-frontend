/** ReportModal component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { reportPlayer, type ReportOptions, type ReportType } from "@/lib/api-client";
import { useLocalization } from "@/lib/localization-context";
import type { TranslationKey } from "@/lib/localization/messages";

type PlayerAction = Exclude<ReportType, "approve">;

const ACTIONS: Record<PlayerAction, {
  labelKey: TranslationKey;
  submitLabelKey: TranslationKey;
  accent: "amber" | "red" | "violet" | "emerald" | "rose" | "sky" | "fuchsia";
  promptKey: TranslationKey;
  reasons: Array<{ labelKey: TranslationKey; value: string }>;
  reasonRequired?: boolean;
}> = {
  suspicious: {
    labelKey: "moderation.reportSuspicious",
    submitLabelKey: "moderation.reportAsSuspicious",
    accent: "amber",
    promptKey: "moderation.promptSuspicious",
    reasons: [
      { labelKey: "moderation.boostedByCheater", value: "boosted_by_cheater" },
      { labelKey: "moderation.aimHacks", value: "aim_hacks" },
      { labelKey: "moderation.wallHacks", value: "wall_hacks" },
      { labelKey: "moderation.speedHacksNoCooldown", value: "speed_hacks_no_cooldown" },
      { labelKey: "moderation.afkWinTrade", value: "afk_win_trade" },
      { labelKey: "moderation.other", value: "other" },
    ],
  },
  weirdo: {
    labelKey: "moderation.voteWeirdo",
    submitLabelKey: "moderation.addToWeirdo",
    accent: "violet",
    promptKey: "moderation.promptWeirdo",
    reasons: [
      { labelKey: "moderation.unexpectedLoadout", value: "unexpected_loadout" },
      { labelKey: "moderation.wildStrategy", value: "wild_strategy" },
      { labelKey: "moderation.memorablePersonality", value: "memorable_personality" },
      { labelKey: "moderation.other", value: "other" },
    ],
  },
  hall_of_fame: {
    labelKey: "moderation.hallOfFameVote",
    submitLabelKey: "moderation.addToHallOfFame",
    accent: "emerald",
    promptKey: "moderation.promptHallOfFame",
    reasons: [
      { labelKey: "moderation.exceptionalTeammate", value: "exceptional_teammate" },
      { labelKey: "moderation.eliteGameplay", value: "elite_gameplay" },
      { labelKey: "moderation.greatSportsmanship", value: "great_sportsmanship" },
      { labelKey: "moderation.other", value: "other" },
    ],
  },
  cheater: {
    labelKey: "moderation.flagCheater",
    submitLabelKey: "moderation.confirmCheater",
    accent: "red",
    promptKey: "moderation.promptCheater",
    reasons: [
      { labelKey: "moderation.verifiedCheatingEvidence", value: "verified_evidence" },
      { labelKey: "moderation.accountReview", value: "account_review" },
      { labelKey: "moderation.other", value: "other" },
    ],
  },
  dropper: {
    labelKey: "moderation.voteDropper",
    submitLabelKey: "moderation.voteDropper",
    accent: "rose",
    promptKey: "moderation.promptDropper",
    reasons: [],
    reasonRequired: false,
  },
  afk_wintrade: {
    labelKey: "moderation.voteAfkWintrade",
    submitLabelKey: "moderation.voteAfkWintrade",
    accent: "sky",
    promptKey: "moderation.promptAfkWintrade",
    reasons: [],
    reasonRequired: false,
  },
};

interface ReportModalProps {
  playerId: string | number;
  type: PlayerAction;
  onClose: () => void;
  onSuccess: () => void;
  submitReport?: (targetId: string | number, options: ReportOptions) => Promise<{ success: boolean; message: string }>;
}

/** Provide this exported item.
 * Contract: accepts the parameters shown in the signature and returns the declared value; side effects follow the implementation.
 */
export default function ReportModal({ playerId, type, onClose, onSuccess, submitReport = reportPlayer }: ReportModalProps) {
  const { t } = useLocalization();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const action = ACTIONS[type];
  const reasonRequired = action.reasonRequired !== false;
  const isOther = selectedReason === "other";

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === t("generated.components.reportModal.escape")) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose();
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (reasonRequired && !selectedReason) {
      setError(t("moderation.selectReason"));
      return;
    }
    if (reasonRequired && isOther && !customReason.trim()) {
      setError(t(action.promptKey));
      return;
    }

    const reason = reasonRequired
      ? isOther
        ? customReason.trim()
        : selectedReason
      : undefined;
    setError(null);
    setSubmitting(true);
    try {
      await submitReport(playerId, { type, reason } as ReportOptions);
      setSuccess(true);
      setTimeout(onSuccess, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("generated.report.actionFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  const colorMap = {
    red: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
    violet: "bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
    rose: "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20",
    sky: "bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20",
    fuchsia: "bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20",
  };
  const activeColorMap = {
    red: "bg-red-500/25 border-red-500/50 text-red-300",
    amber: "bg-amber-500/25 border-amber-500/50 text-amber-300",
    violet: "bg-violet-500/25 border-violet-500/50 text-violet-200",
    emerald: "bg-emerald-500/25 border-emerald-500/50 text-emerald-200",
    rose: "bg-rose-500/25 border-rose-500/50 text-rose-200",
    sky: "bg-sky-500/25 border-sky-500/50 text-sky-200",
    fuchsia: "bg-fuchsia-500/25 border-fuchsia-500/50 text-fuchsia-200",
  };
  const submitColor = {
    red: "bg-red-500 hover:bg-red-600",
    amber: "bg-amber-500 hover:bg-amber-600",
    violet: "bg-violet-500 hover:bg-violet-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
    rose: "bg-rose-500 hover:bg-rose-600",
    sky: "bg-sky-500 hover:bg-sky-600",
    fuchsia: "bg-fuchsia-500 hover:bg-fuchsia-600",
  };

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 z-50 flex items-center justify-center pc-glass-dark">
      <div className="w-full max-w-md mx-4 bg-pc-bg-elevated border border-pc-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-pc-text">{t(action.labelKey)}</h2>
          <button onClick={onClose} className="text-pc-text-muted hover:text-pc-text transition-colors" aria-label={t("generated.components.close")}>✕</button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-emerald-400 text-2xl mb-2">✓</div>
            <p className="text-pc-text text-sm">{t(reasonRequired ? "generated.components.yourReasonWasRecorded" : "moderation.voteRecorded")}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {reasonRequired ? <div className="space-y-2">
              <label className="text-xs text-pc-text-muted uppercase tracking-wider">{t("generated.components.reason")}</label>
              <div className="space-y-1.5">
                {action.reasons.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedReason(item.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${selectedReason === item.value ? activeColorMap[action.accent] : `${colorMap[action.accent]} opacity-70 hover:opacity-100`}`}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>
            </div> : <p className="rounded-lg border border-pc-border bg-pc-bg-secondary px-3 py-3 text-sm leading-6 text-pc-text-secondary">{t("moderation.communityVoteNoReason")}</p>}

            {isOther && (
              <div className="space-y-2">
                <label className="text-xs text-pc-text-muted uppercase tracking-wider">{t("generated.components.describe")}</label>
                <textarea value={customReason} onChange={(event) => setCustomReason(event.target.value)} placeholder={t(action.promptKey)} rows={3} className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-pc-accent/50 resize-none" autoFocus />
              </div>
            )}

            {error && <div className="text-red-400 text-xs bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={submitting} className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitColor[action.accent]}`}>
              {submitting ? t("generated.components.submitting") : t(action.submitLabelKey)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
