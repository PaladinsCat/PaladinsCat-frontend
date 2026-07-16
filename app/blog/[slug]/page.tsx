import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, type BlogPost } from "@/lib/blog";
import { BLOG_COPY } from "@/lib/blog-copy";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
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
        className="inline-flex items-center gap-1 text-sm text-pc-accent hover:underline mb-8"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {BLOG_COPY.backToBlog}
      </Link>

      <article>
        <header className="mb-8 pb-8 border-b border-pc-border">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-pc-accent/10 text-pc-accent">
              {post.author}
            </span>
            <span className="text-sm text-pc-text-muted">{post.date}</span>
          </div>
          <h1 className="text-4xl font-bold text-pc-text mb-4">{post.title}</h1>
        </header>

        <main className="py-4">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={components as any}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </main>
      </article>

      <div className="mt-12 pt-8 border-t border-pc-border text-center">
        <Link href="/blog" className="text-pc-accent hover:underline">
          {BLOG_COPY.viewAllPosts}
        </Link>
      </div>
    </div>
  );
}