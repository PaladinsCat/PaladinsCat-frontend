/**
 * Load the public New Features document from the repository-owned Markdown source.
 * This module owns source fetching, short-lived caching, and Markdown metadata extraction;
 * it does not persist content or depend on authenticated user state.
 * refs: documents/06-reference/frontend-design-system.md#editorial-or-marketing
 */
import matter from "gray-matter";
import { unstable_cache } from "next/cache";

const FEATURES_GITHUB_REPO = process.env.FEATURES_GITHUB_REPO || "PaladinsCat/PaladinsCat";
const FEATURES_GITHUB_PATH = (process.env.FEATURES_GITHUB_PATH || "docs/features/new-features.md").replace(/^\/+|\/+$/g, "");
const FEATURES_GITHUB_REF = process.env.FEATURES_GITHUB_REF || "main";
const FEATURES_GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${FEATURES_GITHUB_REPO}/${FEATURES_GITHUB_REF}`;
const FEATURES_GITHUB_RAW_URL = `${FEATURES_GITHUB_RAW_BASE}/${FEATURES_GITHUB_PATH}`;
const FEATURES_GITHUB_SOURCE_URL = `https://github.com/${FEATURES_GITHUB_REPO}/blob/${FEATURES_GITHUB_REF}/${FEATURES_GITHUB_PATH}`;
const FEATURE_FETCH_TIMEOUT_MS = 10_000;

/**
 * Return the editable GitHub source for the New Features document.
 * Returns: `string`; this is a pure URL construction with no network or persistence side effect.
 * refs: none
 */
export function getFeatureSourceUrl(): string {
  return FEATURES_GITHUB_SOURCE_URL;
}

/**
 * Describe the repository-owned feature document rendered by `/features`.
 * The source is fetched as Markdown and cached for up to 300 seconds; no write or auth side effect occurs.
 * refs: documents/06-reference/frontend-design-system.md#editorial-or-marketing
 */
export interface FeatureDocument {
  title: string;
  description: string;
  updatedAt: string;
  content: string;
  sourceUrl: string;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function deriveTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || "New Features";
}

function deriveDescription(content: string): string {
  const quote = content
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith(">"));
  if (quote) return quote.replace(/^\s*>\s*/, "").trim();

  return content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .find((paragraph) => paragraph && !paragraph.startsWith("#"))
    ?.replace(/[*_`]/g, "")
    .trim() || "Latest PaladinsCat features and updates.";
}

function parseFeatureDocument(rawContent: string): FeatureDocument {
  const { data, content } = matter(rawContent);
  const frontmatter = data as Record<string, unknown>;
  const renderedContent = content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*#\s+.+(?:\r?\n)+/, "")
    .trim();

  return {
    title: readString(frontmatter.title) || deriveTitle(content),
    description: readString(frontmatter.description) || deriveDescription(content),
    updatedAt: readString(frontmatter.updatedAt) || "",
    content: renderedContent,
    sourceUrl: getFeatureSourceUrl(),
  };
}

async function fetchFeatureDocumentUncached(): Promise<FeatureDocument> {
  const response = await fetch(FEATURES_GITHUB_RAW_URL, {
    headers: { "User-Agent": "PaladinsCat-Features" },
    cache: "no-store",
    signal: AbortSignal.timeout(FEATURE_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GitHub feature document ${response.status}: ${response.statusText}`);
  return parseFeatureDocument(await response.text());
}

const getCachedFeatureDocument = unstable_cache(
  fetchFeatureDocumentUncached,
  ["feature-document-v1", FEATURES_GITHUB_REPO, FEATURES_GITHUB_REF, FEATURES_GITHUB_PATH],
  { revalidate: 300, tags: ["features"] },
);

/**
 * Read the current repository-owned feature document.
 * Returns: `Promise<FeatureDocument | null>`; GitHub failures are converted to an empty document state.
 * refs: none
 */
export async function getFeatureDocument(): Promise<FeatureDocument | null> {
  try {
    return await getCachedFeatureDocument();
  } catch (error) {
    console.error("[features] unable to load GitHub document", error);
    return null;
  }
}

/**
 * Resolve a Markdown link against the feature document source.
 * Input `href: string | undefined` → output `string | undefined`; only relative Markdown references move to GitHub.
 * refs: none
 */
export function resolveFeatureLink(href: string | undefined): string | undefined {
  if (!href || href.startsWith("#") || href.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return href;
  if (!href.split(/[?#]/, 1)[0].toLowerCase().endsWith(".md")) return href;
  try {
    return new URL(href, FEATURES_GITHUB_SOURCE_URL).toString();
  } catch {
    return href;
  }
}

/**
 * Resolve a relative Markdown image against the raw repository document.
 * Input `src: string | undefined` → output `string | undefined`; no network or persistence side effect occurs here.
 * refs: none
 */
export function resolveFeatureAssetUrl(src: string | undefined): string | undefined {
  if (!src || src.startsWith("/") || src.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(src) || src.startsWith("//")) return src;
  try {
    return new URL(src, FEATURES_GITHUB_RAW_URL).toString();
  } catch {
    return src;
  }
}
