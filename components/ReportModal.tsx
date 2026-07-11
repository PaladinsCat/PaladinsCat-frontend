"use client";

import { useState, useRef, useEffect } from "react";
import { reportPlayer, type ReportOptions, type ReportType } from "@/lib/api-client";

type PlayerAction = Exclude<ReportType, "approve">;

const ACTIONS: Record<PlayerAction, {
  label: string;
  submitLabel: string;
  accent: "amber" | "red" | "violet" | "emerald";
  prompt: string;
  reasons: Array<{ label: string; value: string }>;
}> = {
  suspicious: {
    label: "Report Suspicious",
    submitLabel: "Report as Suspicious",
    accent: "amber",
    prompt: "What makes this player suspicious?",
    reasons: [
      { label: "Suspected boosting", value: "boosting" },
      { label: "First person aim", value: "first_person_aim" },
      { label: "AFK / inactive", value: "afk" },
      { label: "Teammate only", value: "teammate_only" },
      { label: "Other", value: "other" },
    ],
  },
  weirdo: {
    label: "Vote Weirdo",
    submitLabel: "Add to Weirdo",
    accent: "violet",
    prompt: "What makes this player a Weirdo?",
    reasons: [
      { label: "Unexpected loadout", value: "unexpected_loadout" },
      { label: "Wild strategy", value: "wild_strategy" },
      { label: "Memorable personality", value: "memorable_personality" },
      { label: "Other", value: "other" },
    ],
  },
  hall_of_fame: {
    label: "Hall of Fame Vote",
    submitLabel: "Add to Hall of Fame",
    accent: "emerald",
    prompt: "Why does this player belong in the Hall of Fame?",
    reasons: [
      { label: "Exceptional teammate", value: "exceptional_teammate" },
      { label: "Elite gameplay", value: "elite_gameplay" },
      { label: "Great sportsmanship", value: "great_sportsmanship" },
      { label: "Other", value: "other" },
    ],
  },
  cheater: {
    label: "Flag Cheater",
    submitLabel: "Confirm Cheater",
    accent: "red",
    prompt: "What evidence supports this action?",
    reasons: [
      { label: "Verified cheating evidence", value: "verified_evidence" },
      { label: "Account review", value: "account_review" },
      { label: "Other", value: "other" },
    ],
  },
};

interface ReportModalProps {
  playerId: string | number;
  type: PlayerAction;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportModal({ playerId, type, onClose, onSuccess }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const action = ACTIONS[type];
  const isOther = selectedReason === "other";

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose();
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedReason) {
      setError("Select a reason");
      return;
    }
    if (isOther && !customReason.trim()) {
      setError(action.prompt);
      return;
    }

    const reason = isOther
      ? customReason.trim()
      : action.reasons.find((item) => item.value === selectedReason)?.label ?? selectedReason;
    setError(null);
    setSubmitting(true);
    try {
      await reportPlayer(playerId, { type, reason } as ReportOptions);
      setSuccess(true);
      setTimeout(onSuccess, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  const colorMap = {
    red: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
    violet: "bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20",
    emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20",
  };
  const activeColorMap = {
    red: "bg-red-500/25 border-red-500/50 text-red-300",
    amber: "bg-amber-500/25 border-amber-500/50 text-amber-300",
    violet: "bg-violet-500/25 border-violet-500/50 text-violet-200",
    emerald: "bg-emerald-500/25 border-emerald-500/50 text-emerald-200",
  };
  const submitColor = {
    red: "bg-red-500 hover:bg-red-600",
    amber: "bg-amber-500 hover:bg-amber-600",
    violet: "bg-violet-500 hover:bg-violet-600",
    emerald: "bg-emerald-500 hover:bg-emerald-600",
  };

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-pc-bg-elevated border border-pc-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-pc-text">{action.label}</h2>
          <button onClick={onClose} className="text-pc-text-muted hover:text-pc-text transition-colors" aria-label="Close">✕</button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="text-emerald-400 text-2xl mb-2">✓</div>
            <p className="text-pc-text text-sm">Your reason was recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-pc-text-muted uppercase tracking-wider">Reason</label>
              <div className="space-y-1.5">
                {action.reasons.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedReason(item.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${selectedReason === item.value ? activeColorMap[action.accent] : `${colorMap[action.accent]} opacity-70 hover:opacity-100`}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {isOther && (
              <div className="space-y-2">
                <label className="text-xs text-pc-text-muted uppercase tracking-wider">Describe</label>
                <textarea value={customReason} onChange={(event) => setCustomReason(event.target.value)} placeholder={action.prompt} rows={3} className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-pc-accent/50 resize-none" autoFocus />
              </div>
            )}

            {error && <div className="text-red-400 text-xs bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={submitting} className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitColor[action.accent]}`}>
              {submitting ? "Submitting..." : action.submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
