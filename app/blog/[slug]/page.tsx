import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, type BlogPost } from "@/lib/blog";
import { BLOG_COPY_KEYS } from "@/lib/blog-copy";
import { getServerLocalization } from "@/lib/server-localization";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { t } = await getServerLocalization();
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const components: Components = {
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http") || href?.startsWith("//");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-pc-accent hover:underline"
          {...props}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt, ...props }) => (
      <img
        src={src}
        alt={alt}
        className="rounded-lg max-w-full my-4"
        {...props}
      />
    ),
    iframe: (props) => (
      <div className="my-6 overflow-hidden rounded-lg">
        <iframe
          {...props}
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    ),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-pc-accent hover:underline mb-6"
      >
        ← {t(BLOG_COPY_KEYS.backToBlog)}
      </Link>

      <article>
        <h1 className="text-4xl font-bold text-pc-text mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-pc-text-muted mb-8">
          <span>{t(BLOG_COPY_KEYS.authorBy, { author: post.author })}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>

        <div className="prose prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="mt-12 pt-8 border-t border-pc-border">
          <Link
            href="/blog"
            className="text-sm text-pc-accent hover:underline"
          >
            {t(BLOG_COPY_KEYS.viewAllPosts)}
          </Link>
        </div>
      </article>
    </div>
  );
}

// 404 page for blog posts
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { t } = await getServerLocalization();
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: t(BLOG_COPY_KEYS.notFoundTitle),
      description: t(BLOG_COPY_KEYS.notFoundHint),
    };
  }
  return {
    title: post.title,
    description: post.excerpt,
  };
}
