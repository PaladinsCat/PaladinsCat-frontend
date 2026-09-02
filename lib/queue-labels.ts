/** Maps queue identifiers to stable display labels.
 * The module owns the existing validation, policy, label, title, or preference behavior.
 * refs: none
 */
const QUEUE_LABELS: Record<number, string> = {
  1: "Casual Queue",
  2: "KBM",
  4: "1v1",
  8: "Team Queue",
  16: "Open",
  32: "Doomspire",
  424: "Casual Siege",
  428: "Ranked Siege (Controller)",
  437: "Casual Payload",
  451: "PvE Survival",
  452: "Casual Onslaught",
  469: "Casual Team Deathmatch",
  474: "Casual Battlegrounds Solo",
  475: "Casual Battlegrounds Duo",
  476: "Casual Battlegrounds Quad",
  486: "Ranked Siege",
};

/** Apply getQueueLabel to the declared player or request input.
 * Contract: enforces the module rule and returns the documented value without changing unrelated state.
 * Returns: `string`
 * refs: none
 */
export function getQueueLabel(queueId: number, queueName?: string | null): string {
  const storedName = queueName?.trim();
  return storedName || QUEUE_LABELS[queueId] || `Queue #${queueId}`;
}
