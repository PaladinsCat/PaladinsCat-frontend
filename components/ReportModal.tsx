"use client";

import { useState, useRef, useEffect } from "react";
import { reportPlayer, type ReportOptions } from "@/lib/api-client";

const SUSPICIOUS_REASONS = [
  { label: "Suspected boosting", value: "boosting" },
  { label: "First person aim", value: "first_person_aim" },
  { label: "AFK / inactive", value: "afk" },
  { label: "Teammate only", value: "teammate_only" },
  { label: "Other", value: "other" },
];

interface ReportModalProps {
  playerId: string | number;
  type: 'suspicious' | 'cheater';
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const isOther = selectedReason === "other";
  const isSuspicious = type === "suspicious";
  const label = isSuspicious ? "Report Suspicious" : "Flag Cheater";
  const accentColor = isSuspicious ? "amber" : "red";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSuspicious && !selectedReason) {
      setError("Select a reason");
      return;
    }
    if (isOther && !customReason.trim()) {
      setError("Describe why you think the player is suspicious");
      return;
    }

    setError(null);
    setSubmitting(true);

    const reason = isOther ? customReason.trim() : SUSPICIOUS_REASONS.find(r => r.value === selectedReason)?.label ?? selectedReason;
    const opts: ReportOptions = { type, reason };

    try {
      await reportPlayer(playerId, opts);
      setSuccess(true);
      setTimeout(onSuccess, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
    } finally {
      setSubmitting(false);
    }
  }

  const colorMap: Record<string, string> = {
    red: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
  };

  const activeColorMap: Record<string, string> = {
    red: "bg-red-500/25 border-red-500/50 text-red-300",
    amber: "bg-amber-500/25 border-amber-500/50 text-amber-300",
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-md mx-4 bg-pc-bg-elevated border border-pc-border rounded-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-pc-text">{label}</h2>
          <button
            onClick={onClose}
            className="text-pc-text-muted hover:text-pc-text transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="text-center py-6">
            <div className="text-emerald-400 text-2xl mb-2">✓</div>
            <p className="text-pc-text text-sm">Player reported successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason selection */}
            {isSuspicious && (
              <div className="space-y-2">
                <label className="text-xs text-pc-text-muted uppercase tracking-wider">Reason</label>
                <div className="space-y-1.5">
                  {SUSPICIOUS_REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedReason(r.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                        selectedReason === r.value
                          ? activeColorMap[accentColor]
                          : `${colorMap[accentColor]} opacity-70 hover:opacity-100`
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom reason for "other" */}
            {isOther && (
              <div className="space-y-2">
                <label className="text-xs text-pc-text-muted uppercase tracking-wider">Describe</label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="What makes you think this player is suspicious?"
                  rows={3}
                  className="w-full px-3 py-2 bg-pc-bg-secondary border border-pc-border rounded-lg text-pc-text placeholder-pc-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-pc-accent/50 resize-none"
                  autoFocus
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-red-400 text-xs bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuspicious
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {submitting ? "Submitting..." : `Report ${type === 'suspicious' ? 'as Suspicious' : 'as Cheater'}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
