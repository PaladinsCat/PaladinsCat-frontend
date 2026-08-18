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

// The markup is a single font tag. The attribute section and the text content
// are both restricted to a safe character set (no `<` or `>`) so a nested tag
// can never be swallowed, and attribute values may be quoted or bare.
const FONT_TITLE_PATTERN =
  /^<font\s+[^<>]*color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^<>]*>([^<>]*)<\/font>$/i;

/**
 * Parse a raw Hi-Rez player title.
 *
 * - `'<font color="#b52834">hi</font>'` -> `{ text: "hi", color: "#b52834" }`
 * - Plain text titles pass through unchanged with `color: null`.
 * - Anything that is not a single well-formed font tag is returned as plain
 *   text (markup stripped) so no raw HTML can ever reach the page.
 */
export function parsePlayerTitle(raw: string): ParsedPlayerTitle {
  const match = FONT_TITLE_PATTERN.exec(raw.trim());
  if (!match) {
    return { text: raw, color: null };
  }

  const color = match[1] ?? match[2] ?? match[3] ?? "";
  const text = match[4].trim();

  // Only accept hex colors (#rgb / #rrggbb / #rrggbbaa) or CSS named colors.
  // The emitted value is used in an inline style, so reject anything else.
  const isHexColor = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color);
  const isNamedColor = /^[a-z]+$/i.test(color);
  return { text, color: isHexColor || isNamedColor ? color : null };
}
