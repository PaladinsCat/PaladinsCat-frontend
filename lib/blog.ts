import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const GITHUB_REPO = "NabiCook/PaladinsCat";
const BLOG_GITHUB_PATH = "PaladinsCat-Public/PaladinsCat/docs/blog";
const GITHUB_API_BASE = "https://api.github.com/repos";

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
  rawContent: string;
  coverImage?: string;
}

function deriveMetadata(content: string): { title: string; date: string; excerpt: string } {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].replace(/[🔴🟠🟡🟢🔵🟣💡⚠️❗❓]/g, "").trim() : "Untitled Post";

  const dateMatch = content.match(/\*\*Published:\*\*\s*(.+?)\s*(?:\s*&nbsp;|\s*\||\s*$)/m);
  const date = dateMatch ? dateMatch[1].trim() : "N/A";

  const lines = content.split("\n").filter(l => l.trim());
  let excerpt = "";
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("|") || line.startsWith(">") || line.startsWith("---")) continue;
    if (line.includes("**") && line.includes("*")) continue;
    if (line.trim().length > 0) {
      excerpt = line.replace(/\*\*/g, "").trim();
      break;
    }
  }
  return { title, date, excerpt };
}

function parsePost(filename: string, rawContent: string): BlogPost {
  const slug = filename.replace(/\.md$/, "");
  const { data, content } = matter(rawContent);

  const { title, date, excerpt } = deriveMetadata(content);

  return {
    slug,
    title: (data as any).title ?? title,
    date: (data as any).date ?? date,
    author: (data as any).author ?? "PaladinsCat Team",
    excerpt: (data as any).excerpt ?? excerpt,
    content,
    rawContent: rawContent,
    coverImage: (data as any).coverImage ?? undefined,
  };
}

function resolveLocalBlogDir(): string | null {
  if (process.env.BLOG_LOCAL_PATH) {
    return process.env.BLOG_LOCAL_PATH;
  }
  if (process.env.LOCAL_BLOG_DIR) {
    return process.env.LOCAL_BLOG_DIR;
  }
  const candidates: string[] = [];
  const cwd = process.cwd();
  // src/frontend → ../../PaladinsCat-Public/PaladinsCat/docs/blog
  candidates.push(path.join(cwd, "..", "..", "PaladinsCat-Public", "PaladinsCat", "docs", "blog"));
  // repo root → PaladinsCat-Public/PaladinsCat/docs/blog
  const root = path.dirname(path.dirname(cwd));
  candidates.push(path.join(root, "PaladinsCat-Public", "PaladinsCat", "docs", "blog"));
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function fetchPostsFromGitHub(): Promise<BlogPost[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const contentsUrl = `${GITHUB_API_BASE}/${GITHUB_REPO}/contents/${BLOG_GITHUB_PATH}`;
  const res = await fetch(contentsUrl, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
  }
  const files: any[] = await res.json();
  const mdFiles = files.filter(f => f.type === "file" && f.name.endsWith(".md"));

  const posts: BlogPost[] = [];
  for (const file of mdFiles) {
    const rawRes = await fetch(file.download_url, { headers });
    if (!rawRes.ok) continue;
    const rawContent = await rawRes.text();
    posts.push(parsePost(file.name, rawContent));
  }
  return posts;
}

function readPostsLocal(): BlogPost[] {
  const dir = resolveLocalBlogDir();
  if (!dir) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
  const posts: BlogPost[] = [];
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    posts.push(parsePost(f, raw));
  }
  return posts;
}

function dateValue(d: string): number {
  const t = Date.parse(d);
  return isNaN(t) ? 0 : t;
}

export async function getAllPosts(): Promise<BlogPost[]> {
  if (process.env.NODE_ENV === "development") {
    try {
      const localPosts = readPostsLocal();
      if (localPosts.length > 0) return localPosts.sort((a, b) => dateValue(b.date) - dateValue(a.date));
    } catch {
      // fall through to GitHub
    }
  }
  const posts = await fetchPostsFromGitHub();
  return posts.sort((a, b) => dateValue(b.date) - dateValue(a.date));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find(p => p.slug === slug) ?? null;
}

export function getPostLink(slug: string): string {
  return `/blog/${slug}`;
}