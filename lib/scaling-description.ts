export type NumberFormatter = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => string;

/** Resolve Hi-Rez scaling tokens for the requested card or item level. */
export function formatScalingDescription(
  description: string | null | undefined,
  level: number,
  formatNumber: NumberFormatter,
): string | null {
  if (!description) return null;

  const cleanNumber = (value: number) => formatNumber(value, { maximumFractionDigits: 2 });
  return description
    .replace(/^\s*(?:\[[^\]]+\]\s*)+/, "")
    .replace(/\{\s*(?:scale\s*=\s*)?(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\|\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/gi, (_match, base: string, increase: string) => (
      cleanNumber(Number(base) + Number(increase) * Math.max(0, level - 1))
    ))
    .replace(/\{\s*(-?(?:\d+(?:\.\d*)?|\.\d+))\s*\}/g, (_match, value: string) => (
      cleanNumber(Number(value))
    ));
}
