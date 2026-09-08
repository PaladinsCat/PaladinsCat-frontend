/** Merge replay/history by revision so stale pages cannot resurrect deleted messages.
 * refs: none
 */
/**
 * Compute merge chat messages and return `[...messages.values()].sort((a, b) => a.id - b.id)`.
 * I/O types: `current: T[]; incoming: T[] -> T[]`.
 * refs: none
 */
export function mergeChatMessages<T extends { id: number; revision: number }>(current: T[], incoming: T[]): T[] {
  const messages = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    if ((messages.get(message.id)?.revision ?? -1) <= message.revision) messages.set(message.id, message);
  }
  return [...messages.values()].sort((a, b) => a.id - b.id);
}
