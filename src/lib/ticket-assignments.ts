import type { SupportTicket } from "./ticket-replies.ts";

export const SUPPORT_AGENTS = [
  "Marzia",
  "Kevin",
  "Flora",
  "Christiana",
  "罗凤",
  "张海鸥",
  "吴金香",
  "曾芬",
  "余雪",
  "徐晓芬",
  "郑绮淇",
  "曹超议",
  "肖琼",
] as const;

export type TicketAssignmentMap = Record<string, string | null>;

const STORAGE_KEY = "zen-desk-assist.ticket-assignments.v1";
const ASSIGNMENT_EVENT = "ticket-assignment-changed";
const LEGACY_AGENT_NAMES: Record<string, (typeof SUPPORT_AGENTS)[number]> = {
  客服小美: "Marzia",
  客服小陈: "Kevin",
  客服小林: "吴金香",
  客服小周: "Flora",
};

export function readTicketAssignments(): TicketAssignmentMap {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([ticketId, assignee]) =>
            ticketId.trim() && (typeof assignee === "string" || assignee === null),
        )
        .map(([ticketId, assignee]) => [
          ticketId,
          typeof assignee === "string" ? (LEGACY_AGENT_NAMES[assignee] ?? assignee) : null,
        ]),
    );
  } catch {
    return {};
  }
}

export function applyTicketAssignments(
  tickets: SupportTicket[],
  assignments: TicketAssignmentMap,
): SupportTicket[] {
  return tickets.map((ticket) =>
    Object.prototype.hasOwnProperty.call(assignments, ticket.id)
      ? { ...ticket, assignee: assignments[ticket.id] ?? undefined }
      : ticket,
  );
}

export function saveTicketAssignment(ticketId: string, assignee?: string) {
  saveTicketAssignments([ticketId], assignee);
}

export function saveTicketAssignments(ticketIds: string[], assignee?: string) {
  if (typeof window === "undefined") return;
  const assignments = readTicketAssignments();
  ticketIds.forEach((ticketId) => {
    assignments[ticketId] = assignee?.trim() || null;
  });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  window.dispatchEvent(new Event(ASSIGNMENT_EVENT));
}

export function subscribeTicketAssignments(listener: (assignments: TicketAssignmentMap) => void) {
  if (typeof window === "undefined") return () => undefined;
  const notify = () => listener(readTicketAssignments());
  window.addEventListener(ASSIGNMENT_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(ASSIGNMENT_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}
