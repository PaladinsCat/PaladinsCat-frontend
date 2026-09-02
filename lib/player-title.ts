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

/** Describe the parsed player-title markup returned to UI callers.
 * Contract: carries the sanitized title text and optional color metadata.
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

// Attribute values may be quoted or bare. Segment boundaries are located with
// indexOf below so malformed input is processed linearly instead of by a
// backtracking whole-string expression.
const COLOR_ATTRIBUTE_PATTERN = /color\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

// Player titles can contain additional legacy HTML-like formatting inside or
// around font tags. React renders strings safely, but leaving those tags in the
// string exposes the markup to users. Strip every tag-shaped token while
// preserving ordinary angle brackets such as "2 < 3".
/** Apply stripPlayerTitleMarkup to the declared player or request input.
 * Contract: enforces title sanitation and returns plain text without markup.
 * Returns: `string`
 */
export function stripPlayerTitleMarkup(raw: string): string {
  let text = "";
  let cursor = 0;
  while (cursor < raw.length) {
    if (raw.startsWith("<!--", cursor)) {
      const commentEnd = raw.indexOf("-->", cursor + 4);
      cursor = commentEnd === -1 ? raw.length : commentEnd + 3;
      continue;
    }

    if (raw[cursor] === "<" && /^\/?[a-z]/i.test(raw.slice(cursor + 1, cursor + 3))) {
      const tagEnd = raw.indexOf(">", cursor + 1);
      cursor = tagEnd === -1 ? raw.length : tagEnd + 1;
      continue;
    }

    text += raw[cursor];
    cursor += 1;
  }
  return text;
}

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

  const segments: PlayerTitleSegment[] = [];
  const lower = trimmed.toLowerCase();
  let cursor = 0;
  while (cursor < trimmed.length) {
    if (lower.slice(cursor, cursor + 5) !== "<font" || !/\s/.test(trimmed[cursor + 5] ?? "")) {
      return null;
    }
    const tagEnd = trimmed.indexOf(">", cursor + 6);
    if (tagEnd === -1) {
      return null;
    }
    const attributes = trimmed.slice(cursor + 5, tagEnd);
    if (attributes.includes("<")) {
      return null;
    }
    const colorMatch = COLOR_ATTRIBUTE_PATTERN.exec(attributes);
    if (!colorMatch) {
      return null;
    }
    const textStart = tagEnd + 1;
    const closeStart = lower.indexOf("</font>", textStart);
    if (closeStart === -1) {
      return null;
    }
    const text = stripPlayerTitleMarkup(trimmed.slice(textStart, closeStart));
    segments.push({
      text,
      color: sanitizeColor(colorMatch[1] ?? colorMatch[2] ?? colorMatch[3] ?? ""),
    });
    cursor = closeStart + "</font>".length;
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
    return { text: stripPlayerTitleMarkup(raw).trim(), color: null };
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
