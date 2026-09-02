/**
 * Define the blog page responsibility boundary.
 * Coordinates blog page data loading, authorization, and presentation.
 */
import { BLOG_CATEGORIES, getAllPosts, getPostLink, isBlogCategory, type BlogCategory } from "@/lib/blog";
import { BLOG_COPY_KEYS } from "@/lib/blog-copy";
import { getServerLocalization } from "@/lib/server-localization";
import Link from "next/link";

// Blog content is owned by GitHub. Always render against its current contents
// while keeping this public route at /blog.
/**
 * Selects request-fresh rendering for this data-dependent page.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const dynamic = "force-dynamic";
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export const revalidate = 0;

const CATEGORY_LABEL_KEYS = {
  "public-release": BLOG_COPY_KEYS.categoryPublicRelease,
  "q-and-a": BLOG_COPY_KEYS.categoryQuestionAndAnswer,
  "guide": BLOG_COPY_KEYS.categoryGuide,
} as const satisfies Record<BlogCategory, string>;

type BlogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

type BlogCategoryFilter = BlogCategory | "all";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 */
export async function generateMetadata() {
  const { t } = await getServerLocalization();
  const title = t(BLOG_COPY_KEYS.title);
  const description = t(BLOG_COPY_KEYS.subtitle);
  return {
    title,
    description,
    alternates: { canonical: "/blog" },
    openGraph: { title, description, type: "website" as const, url: "/blog" },
  };
}

/** Render the localized blog index, filtering posts by the requested category. */
export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { t } = await getServerLocalization();
  const { category } = await searchParams;
  const selectedCategory: BlogCategoryFilter = isBlogCategory(category) ? category : "all";
  const posts = await getAllPosts();
  const visiblePosts = selectedCategory === "all"
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="pc-heading pc-heading-lg mb-3">{t(BLOG_COPY_KEYS.title)}</h1>
        <p className="text-lg text-pc-text-secondary">
          {t(BLOG_COPY_KEYS.subtitle)}
        </p>
      </div>

      <nav className="mb-8 flex flex-wrap items-center gap-2" aria-label={t(BLOG_COPY_KEYS.title)}>
        <Link
          href="/blog"
          aria-current={selectedCategory === "all" ? "page" : undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
            selectedCategory === "all"
              ? "bg-pc-accent text-pc-bg"
              : "pc-surface text-pc-muted hover:text-pc-text"
          }`}
        >
          {t(BLOG_COPY_KEYS.categoryAll)}
        </Link>
        {BLOG_CATEGORIES.map(categoryId => (
          <Link
            key={categoryId}
            href={`/blog?category=${encodeURIComponent(categoryId)}`}
            aria-current={selectedCategory === categoryId ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${
              selectedCategory === categoryId
                ? "bg-pc-accent text-pc-bg"
                : "pc-surface text-pc-muted hover:text-pc-text"
            }`}
          >
            {t(CATEGORY_LABEL_KEYS[categoryId])}
          </Link>
        ))}
      </nav>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-pc-text-muted text-lg">{t(BLOG_COPY_KEYS.empty)}</p>
          <p className="text-pc-text-muted text-sm mt-2">
            {t(BLOG_COPY_KEYS.emptyHint)}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {visiblePosts.map((post) => (
            <Link
              key={post.slug}
              href={getPostLink(post.slug)}
              className="block group"
            >
              <article className="border border-pc-border rounded-xl bg-pc-bg-elevated p-6 transition-all hover:border-pc-accent/50 hover:bg-pc-bg-secondary">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pc-accent/10 text-pc-accent">
                    {post.author}
                  </span>
                  <span className="text-xs text-pc-text-muted">{post.date}</span>
                </div>
                <h2 className="text-xl font-bold text-pc-text group-hover:text-pc-accent transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-pc-text-secondary line-clamp-2 mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-1 text-sm text-pc-accent group-hover:opacity-80 transition-opacity">
                  {t(BLOG_COPY_KEYS.readMore)}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M512 14m125l7777" />
                  </svg>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
