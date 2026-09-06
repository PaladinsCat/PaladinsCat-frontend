/**
 * Render the repository-owned New Features document as an editorial route.
 * The page owns the presentation shell while GitHub owns the Markdown content.
 * refs: documents/06-reference/frontend-design-system.md#editorial-or-marketing
 */
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { ArrowLeft, GitBranch } from "lucide-react";
import { getServerLocalization } from "@/lib/server-localization";
import { getFeatureDocument, getFeatureSourceUrl, resolveFeatureAssetUrl, resolveFeatureLink } from "@/lib/feature-document";

/**
 * Refresh the GitHub-backed document route without making every render a permanent build artifact.
 * refs: documents/06-reference/frontend-async-ui.md#state-selection
 */
export const dynamic = "force-dynamic";
/** The route shell renders per request while the document loader owns its 300-second content cache. · refs: none */
export const revalidate = 0;

/**
 * Build metadata from the current repository document, with localized fallback copy when GitHub is unavailable.
 * Returns: `Promise<Metadata>`; no write, auth, or persistence side effect occurs.
 * refs: documents/06-reference/frontend-design-system.md#page-anatomy
 */
export async function generateMetadata() {
  const { t } = await getServerLocalization();
  const document = await getFeatureDocument();
  const title = document?.title || t("home.newFeatures");
  const description = document?.description || t("home.newFeaturesIntro");
  return {
    title,
    description,
    alternates: { canonical: "/features" },
    openGraph: { title, description, type: "article" as const, url: "/features" },
  };
}

/** Render the GitHub-backed New Features document.  Returns: `Promise<React.JSX.Element>`. · refs: none */
export default async function FeaturesPage() {
  const { t } = await getServerLocalization();
  const document = await getFeatureDocument();
  const sourceUrl = document?.sourceUrl || getFeatureSourceUrl();
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
      const resolvedHref = resolveFeatureLink(href);
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
        src={resolveFeatureAssetUrl(typeof src === "string" ? src : undefined)}
        alt={alt}
        loading="lazy"
        className={`my-6 h-auto max-w-full rounded-xl border border-pc-border shadow-md ${className || ""}`}
      />
    ),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-pc-text-secondary transition-colors hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("home.backToHome")}
      </Link>

      <article className="rounded-2xl border border-pc-border bg-pc-bg-elevated/95 p-5 shadow-2xl backdrop-blur-sm sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-pc-border pb-8">
          <div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-pc-text">{document?.title || t("home.newFeatures")}</h1>
          </div>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-pc-border px-3 py-2 text-sm font-semibold text-pc-text-secondary transition-colors hover:border-pc-accent-mid hover:text-pc-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-accent">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
        </div>

        {document ? (
          <div data-allow-native-drag="true" className="blog-markdown pt-4 text-base leading-8 text-pc-text-secondary [overflow-wrap:anywhere]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {document.content}
            </ReactMarkdown>
          </div>
        ) : null}
      </article>
    </div>
  );
}
