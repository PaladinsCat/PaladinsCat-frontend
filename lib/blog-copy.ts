// Blog UI copy — stored as translation key constants.
// Components resolve these via t() from the localization context.

export const BLOG_COPY_KEYS = {
  title: 'generated.blog.title' as const,
  subtitle: 'generated.blog.subtitle' as const,
  empty: 'generated.blog.empty' as const,
  emptyHint: 'generated.blog.emptyHint' as const,
  readMore: 'generated.blog.readMore' as const,
  categoryAll: 'generated.blog.categoryAll' as const,
  categoryPublicRelease: 'generated.blog.categoryPublicRelease' as const,
  categoryQuestionAndAnswer: 'generated.blog.categoryQuestionAndAnswer' as const,
  categoryGuide: 'generated.blog.categoryGuide' as const,
  authorBy: 'generated.blog.authorBy' as const,
  backToBlog: 'generated.blog.backToBlog' as const,
  viewAllPosts: 'generated.blog.viewAllPosts' as const,
  notFoundTitle: 'generated.blog.notFoundTitle' as const,
  notFoundHint: 'generated.blog.notFoundHint' as const,
} as const;

/** @deprecated Use t(BLOG_COPY_KEYS.key) instead */
export const BLOG_COPY = {
  title: 'Blog',
  subtitle: 'News, updates, and stories from the PaladinsCat team.',
  empty: 'No posts yet.',
  emptyHint: 'Check back soon for updates from the team.',
  readMore: 'Read more',
  categoryAll: 'Show All',
  categoryPublicRelease: 'Public Release',
  categoryQuestionAndAnswer: 'Q&A',
  categoryGuide: 'Guide',
  authorBy: 'By {author}',
  backToBlog: 'Back to blog',
  viewAllPosts: '← View all posts',
  notFoundTitle: 'Post Not Found',
  notFoundHint: "This blog post doesn't exist or has been removed.",
} as const;
