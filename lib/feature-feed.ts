/**
 * Validate and order the public New Features feed.
 * The public repository owns editorial content; this module owns the typed read contract.
 * refs: documents/06-reference/publication/new-features-content-format.md
 */
import matter from "gray-matter";

export type NewFeatureKind = "new" | "improved" | "fixed";
export type NewFeatureCategory = "analytics" | "players" | "champions" | "stats" | "community" | "experience";
export type NewFeatureStatus = "upcoming" | "released";

export interface NewFeatureEntry {
  id: string;
  kind: NewFeatureKind;
  category: NewFeatureCategory;
  status: NewFeatureStatus;
  targetVersion: string;
  publishedAt?: string;
  title: string;
  summary: string;
  href?: string;
}

export interface NewFeaturesDocument {
  title: "New Features";
  entries: NewFeatureEntry[];
}

const KINDS = new Set<NewFeatureKind>(["new", "improved", "fixed"]);
const CATEGORIES = new Set<NewFeatureCategory>(["analytics", "players", "champions", "stats", "community", "experience"]);
const STATUSES = new Set<NewFeatureStatus>(["upcoming", "released"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requiredString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validHref(value: string): boolean {
  return (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value);
}

/** Parse one source entry, returning null when it violates the public contract. */
function parseEntry(value: unknown): NewFeatureEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = requiredString(record, "id");
  const kind = requiredString(record, "kind") as NewFeatureKind | null;
  const category = requiredString(record, "category") as NewFeatureCategory | null;
  const status = (requiredString(record, "status") || "released") as NewFeatureStatus;
  const targetVersion = requiredString(record, "targetVersion");
  const publishedAt = requiredString(record, "publishedAt") || undefined;
  const title = requiredString(record, "title");
  const summary = requiredString(record, "summary");
  const href = requiredString(record, "href") || undefined;

  if (!id || !ID_PATTERN.test(id) || !kind || !KINDS.has(kind) || !category || !CATEGORIES.has(category)) return null;
  if (!STATUSES.has(status) || !targetVersion || !title || !summary || (href && !validHref(href))) return null;
  if (status === "released" && (!publishedAt || !Number.isFinite(Date.parse(publishedAt)))) return null;
  if (publishedAt && !Number.isFinite(Date.parse(publishedAt))) return null;
  if (status === "upcoming" && publishedAt) return null;
  return { id, kind, category, status, targetVersion, publishedAt, title, summary, href };
}

/**
 * Parse the repository-owned YAML feed and discard malformed or duplicate entries.
 * I/O types: `rawContent: string -> NewFeaturesDocument`.
 */
export function parseNewFeaturesDocument(rawContent: string): NewFeaturesDocument {
  const { data } = matter(rawContent);
  const source = data as Record<string, unknown>;
  const seen = new Set<string>();
  const entries: NewFeatureEntry[] = [];
  for (const value of Array.isArray(source.entries) ? source.entries : []) {
    const entry = parseEntry(value);
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    entries.push(entry);
  }
  return { title: "New Features", entries };
}

/**
 * Return upcoming entries plus releases inside the seven-day visibility window, newest first.
 * I/O types: `entries: NewFeatureEntry[]; now?: Date -> NewFeatureEntry[]`.
 */
export function activeNewFeatures(entries: NewFeatureEntry[], now = new Date()): NewFeatureEntry[] {
  const nowMs = now.getTime();
  const windowMs = 7 * 24 * 60 * 60 * 1000;
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => {
      if (entry.status === "upcoming") return true;
      const published = Date.parse(entry.publishedAt || "");
      return published <= nowMs && nowMs < published + windowMs;
    })
    .sort((left, right) => {
      if (left.entry.status !== right.entry.status) return left.entry.status === "upcoming" ? -1 : 1;
      const dateOrder = Date.parse(right.entry.publishedAt || "") - Date.parse(left.entry.publishedAt || "");
      return (Number.isFinite(dateOrder) && dateOrder !== 0) ? dateOrder : left.index - right.index;
    })
    .map(({ entry }) => entry);
}
