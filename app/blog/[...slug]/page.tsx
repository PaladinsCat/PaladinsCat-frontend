/**
 * Define the blog page responsibility boundary.
 * Coordinates blog page data loading, authorization, and presentation.
 * refs: none
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug, getPostLink, resolveBlogAssetUrl, resolveBlogLink } from "@/lib/blog";
import { BLOG_COPY_KEYS } from "@/lib/blog-copy";
import { getServerLocalization } from "@/lib/server-localization";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Blog content changes only with the public repository. Generate the known
// routes into the image and retain ISR for newly published posts.
/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 * refs: none
 */
export const revalidate = 300;

type BlogPostPageProps = { params: Promise<{ slug: string[] }> };

function joinSlug(slug: string[]): string {
  return slug.join("/");
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 * refs: none
 */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug.split("/") }));
}

/** Render one localized blog post selected by its catch-all slug parameters.  Returns: `Promise<React.JSX.Element>`. · refs: none */
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { t } = await getServerLocalization();
  const { slug } = await params;
  const post = await getPostBySlug(joinSlug(slug));
  if (!post) notFound();

  const components: Components = {
    h1: ({ children, ...props }) => <h1 {...props} className="mb-4 mt-10 text-3xl font-bold leading-tight tracking-tight text-pc-text">{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props} className="mb-3 mt-10 text-2xl font-bold leading-tight tracking-tight text-pc-text">{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props} className="mb-3 mt-8 text-xl font-bold leading-tight text-pc-text">{children}</h3>,
    h4: ({ children, ...props }) => <h4 {...props} className="mb-2 mt-7 text-base font-bold leading-tight text-pc-text">{children}</h4>,
    p: ({ children, ...props }) => <p {...props} className="my-4 leading-8 text-pc-text-secondary">{children}</p>,
    strong: ({ children, ...props }) => <strong {...props} className="font-bold text-pc-text">{children}</strong>,
    ul: ({ children, ...props }) => <ul {...props} className="my-4 list-disc space-y-1.5 pl-6 text-pc-text-secondary">{children}</ul>,
    ol: ({ children, ...props }) => <ol {...props} className="my-4 list-decimal space-y-1.5 pl-6 text-pc-text-secondary">{children}</ol>,
    blockquote: ({ children, ...props }) => <blockquote {...props} className="my-5 rounded-r-xl border-l-4 border-pc-accent bg-pc-accent/10 px-4 py-2 text-pc-text [&>p]:my-1 [&>p]:text-pc-text">{children}</blockquote>,
    hr: (props) => <hr {...props} className="my-8 border-0 border-t border-pc-border" />,
    pre: ({ children, ...props }) => <pre {...props} className="my-5 max-w-full overflow-x-auto rounded-xl border border-pc-border bg-pc-bg-secondary p-4 text-sm leading-6 text-pc-text [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-pc-text">{children}</pre>,
    code: ({ className, children, ...props }) => <code {...props} className={`rounded border border-pc-border bg-pc-bg-secondary px-1.5 py-0.5 text-[0.9em] text-pc-accent-light ${className || ""}`}>{children}</code>,
    table: ({ children, ...props }) => <div className="my-5 max-w-full overflow-x-auto rounded-lg border border-pc-border"><table {...props} className="w-full min-w-max border-collapse text-sm">{children}</table></div>,
    th: ({ children, ...props }) => <th {...props} className="border-b border-r border-pc-border bg-pc-bg-secondary px-3 py-2 text-left font-semibold text-pc-text last:border-r-0">{children}</th>,
    td: ({ children, ...props }) => <td {...props} className="border-b border-r border-pc-border px-3 py-2 text-left text-pc-text-secondary last:border-r-0">{children}</td>,
    a: ({ href, className, children, ...props }) => {
      const resolvedHref = resolveBlogLink(href, post.sourcePath);
      const isExternal = resolvedHref?.startsWith("http") || resolvedHref?.startsWith("//");
      return (
        <a
          {...props}
          href={resolvedHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className={`text-pc-accent hover:underline ${className || ""}`}
        >
          {children}
        </a>
      );
    },
    img: ({ src, alt, className, ...props }) => (
      <img
        {...props}
        src={resolveBlogAssetUrl(typeof src === "string" ? src : undefined, post.sourcePath)}
        alt={alt}
        loading="lazy"
        className={`my-6 h-auto max-w-full rounded-xl border border-pc-border shadow-md ${className || ""}`}
      />
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

      <article className="rounded-2xl border border-pc-border bg-pc-bg-elevated/95 p-5 shadow-2xl backdrop-blur-sm sm:p-8 lg:p-10">
        <h1 className="text-4xl font-bold text-pc-text mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-pc-text-muted mb-8">
          <span>{t(BLOG_COPY_KEYS.authorBy, { author: post.author })}</span>
          <span>·</span>
          <span>{post.date}</span>
        </div>

        <div data-allow-native-drag="true" className="blog-markdown text-base leading-8 text-pc-text-secondary [overflow-wrap:anywhere]">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {post.content}
          </ReactMarkdown>
        </div>

        <div className="mt-12 pt-8 border-t border-pc-border">
          <Link href="/blog" className="text-sm text-pc-accent hover:underline">
            {t(BLOG_COPY_KEYS.viewAllPosts)}
          </Link>
        </div>
      </article>
    </div>
  );
}

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `Promise<Metadata>`
 * refs: none
 */
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { t } = await getServerLocalization();
  const { slug } = await params;
  const slugPath = joinSlug(slug);
  const post = await getPostBySlug(slugPath);
  if (!post) {
    return {
      title: t(BLOG_COPY_KEYS.notFoundTitle),
      description: t(BLOG_COPY_KEYS.notFoundHint),
    };
  }
  const publicUrl = getPostLink(slugPath);
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: publicUrl },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article" as const,
      url: publicUrl,
    },
  };
}
