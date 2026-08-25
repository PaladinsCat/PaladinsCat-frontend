/**
 * Player title parsing.
 *
 * Hi-Rez player titles are authored as a single `<font color="...">text</font>`
 * markup string (e.g. `<font color="#b52834">never forgives, never forgets</font>`).
 * The backend stores that markup verbatim, so the frontend must parse it and
 * render the color as a CSS style. Never render the raw string as HTML
 * (dangerouslySetInnerHTML): titles are user-settable in-game and would be an
 * XSS vector.
 */

export interface ParsedPlayerTitle {
  /** Title text with the markup stripped. */
  text: string;
  /** Hex color from the markup, or `null` when the title has no color. */
  color: string | null;
}

export interface PlayerTitleSegment {
  /** Segment text with the markup stripped. */
  text: string;
  /** Hex color for this segment, or `null` when it has no color. */
  color: string | null;
}

// The markup is one or more concatenated font tags. The attribute section and
// the text content are both restricted to a safe character set (no `<` or `>`)
// so a nested tag can never be swallowed, and attribute values may be quoted
// or bare.
const FONT_TITLE_PATTERN =
  /^(?:<font\s+[^<>]*color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^<>]*>([^<>]*)<\/font>)+$/i;

/**
 * Parse the font-tag segments of a raw Hi-Rez player title.
 *
 * Returns one segment per `<font color="...">text</font>` tag when the whole
 * string is a well-formed concatenation of such tags, or `null` when the
 * string is not (in which case it must be rendered as plain text).
 */
export function parsePlayerTitleSegments(raw: string): PlayerTitleSegment[] | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }
  if (!FONT_TITLE_PATTERN.test(trimmed)) {
    return null;
  }

  const segments: PlayerTitleSegment[] = [];
  const segmentPattern =
    /<font\s+[^<>]*color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^<>]*>([^<>]*)<\/font>/gi;
  let match: RegExpExecArray | null;
  while ((match = segmentPattern.exec(trimmed)) !== null) {
    segments.push({ text: match[4], color: sanitizeColor(match[1] ?? match[2] ?? match[3] ?? "") });
  }
  // Trim only the outer edges so spaces between segments are preserved.
  if (segments.length > 0) {
    segments[0].text = segments[0].text.replace(/^\s+/, "");
    segments[segments.length - 1].text = segments[segments.length - 1].text.replace(/\s+$/, "");
  }
  return segments;
}

/**
 * Parse a raw Hi-Rez player title.
 *
 * - `'<font color="#b52834">hi</font>'` -> `{ text: "hi", color: "#b52834" }`
 * - Plain text titles pass through unchanged with `color: null`.
 * - Anything that is not a well-formed font-tag concatenation is returned as
 *   plain text (markup stripped) so no raw HTML can ever reach the page.
 */
export function parsePlayerTitle(raw: string): ParsedPlayerTitle {
  const segments = parsePlayerTitleSegments(raw);
  if (segments === null) {
    return { text: raw, color: null };
  }

  const text = segments.map((s) => s.text).join("");
  const colors = new Set(segments.map((s) => s.color));
  const color = colors.size === 1 ? segments[0]?.color ?? null : null;
  return { text, color };
}

// Only accept hex colors (#rgb / #rrggbb / #rrggbbaa) or CSS named colors.
// The emitted value is used in an inline style, so reject anything else.
function sanitizeColor(color: string): string | null {
  const isHexColor = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color);
  const isNamedColor = /^[a-z]+$/i.test(color);
  return isHexColor || isNamedColor ? color : null;
}
