export interface StatQuality {
  score: number;
  color: string;
  softColor: string;
  borderColor: string;
  background: string;
  track: string;
  textClass: string;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function colorForScore(score: number): string {
  const clamped = clamp01(score);
  if (clamped < 0.5) {
    const t = clamped / 0.5;
    return hsl(350 + 38 * t, 82, 62);
  }
  const t = (clamped - 0.5) / 0.5;
  return hsl(38 + 112 * t, 82, 58);
}

export function getStatQuality(winRate: number | null | undefined, pickRate: number | null | undefined, maxPickRate = 100): StatQuality {
  const wr = Number(winRate ?? 0);
  const pr = Math.max(0, Number(pickRate ?? 0));
  const maxPr = Math.max(1, Number(maxPickRate || 100));
  const popularity = clamp01(pr / maxPr);
  // Win rate drives most of the quality score, while pick rate adds
  // confidence. This keeps heavily played winners green, rarely picked
  // underperformers red, and mixed cases in the amber/orange middle.
  const winScore = clamp01((wr - 42) / 16);
  const score = clamp01(winScore * 0.78 + Math.sqrt(popularity) * 0.22);
  const color = colorForScore(score);

  return {
    score,
    color,
    softColor: color.replace(")", " / 0.42)"),
    borderColor: color.replace(")", " / 0.34)"),
    background: `linear-gradient(135deg, ${color.replace(")", " / 0.18)")}, rgba(20, 22, 28, 0.34))`,
    track: `linear-gradient(90deg, ${color.replace(")", " / 0.95)")}, ${color.replace(")", " / 0.38)")})`,
    textClass: score >= 0.62 ? "text-emerald-400" : score <= 0.38 ? "text-rose-400" : score >= 0.52 ? "text-lime-300" : score <= 0.48 ? "text-orange-300" : "text-pc-text-secondary",
  };
}
