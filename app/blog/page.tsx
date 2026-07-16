import { getAllPosts } from "@/lib/blog";
import { BLOG_COPY_KEYS } from "@/lib/blog-copy";
import { getServerLocalization } from "@/lib/server-localization";
import Link from "next/link";

export default async function BlogPage() {
  const { t } = await getServerLocalization();
  const posts = await getAllPosts();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-pc-accent mb-3">{t(BLOG_COPY_KEYS.title)}</h1>
        <p className="text-lg text-pc-text-secondary">
          {t(BLOG_COPY_KEYS.subtitle)}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-pc-text-muted text-lg">{t(BLOG_COPY_KEYS.empty)}</p>
          <p className="text-pc-text-muted text-sm mt-2">
            {t(BLOG_COPY_KEYS.emptyHint)}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
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
                    <path d="M5 12h14M12 5l7 7-7 7" />
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