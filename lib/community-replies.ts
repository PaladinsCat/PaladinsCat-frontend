/** Keep each reply next to its parent, preserving sibling order and orphaned comments.
 * refs: none
 */
/**
 * Compute order replies and return `ordered`.
 * I/O types: `comments: T[] -> T[]`.
 * refs: none
 */
export function orderReplies<T extends { id: number; parentId: number | null }>(comments: T[]): T[] {
  const ids = new Set(comments.map((comment) => comment.id));
  const children = new Map<number, T[]>();
  for (const comment of comments) {
    if (comment.parentId != null && ids.has(comment.parentId)) {
      const siblings = children.get(comment.parentId) ?? [];
      siblings.push(comment);
      children.set(comment.parentId, siblings);
    }
  }
  const roots = comments.filter((comment) => comment.parentId == null || !ids.has(comment.parentId));
  const seen = new Set<number>();
  const ordered: T[] = [];
  // Iteration avoids a call-stack limit on long reply chains; cycles remain visible.
  for (const root of [...roots, ...comments]) {
    const pending = [root];
    while (pending.length) {
      const comment = pending.pop()!;
      if (seen.has(comment.id)) continue;
      seen.add(comment.id);
      ordered.push(comment);
      pending.push(...[...(children.get(comment.id) ?? [])].reverse());
    }
  }
  return ordered;
}
