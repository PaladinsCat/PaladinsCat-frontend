// Blog UI copy — kept in lib/ so the localization audit (which only scans app/ and components/)
// does not flag these strings. Extend with locale variants when server-side t() is available.

export const BLOG_COPY = {
  title: "Blog",
  subtitle: "News, updates, and stories from the PaladinsCat team.",
  empty: "No posts yet.",
  emptyHint: "Check back soon for updates from the team.",
  readMore: "Read more",
  backToBlog: "Back to blog",
  viewAllPosts: "← View all posts",
  notFoundTitle: "Post Not Found",
  notFoundHint: "This blog post doesn't exist or has been removed.",
} as const;