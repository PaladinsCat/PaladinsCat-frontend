/** Provides localized blog copy and static article metadata.
 * This module supplies static and localized blog copy used by page renderers.
 */
// Blog UI copy — stored as translation key constants.
// Components resolve these via t() from the localization context.

/** BLOG_COPY_KEYS applies the module-specific transformation to its declared inputs.
 * Contract: validates its inputs and returns the existing module result without mutating caller state.
 */
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
