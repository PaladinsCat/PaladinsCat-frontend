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

export function getQueueLabel(queueId: number): string {
  return QUEUE_LABELS[queueId] ?? `Queue #${queueId}`;
}
