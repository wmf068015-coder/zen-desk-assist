import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyTicketAssignments } from "./ticket-assignments.ts";
import type { SupportTicket } from "./ticket-replies.ts";

const ticket: SupportTicket = {
  id: "TK-001",
  issueType: "order",
  title: "订单问题",
  description: "测试工单",
  contact: "buyer@example.com",
  attachments: [],
  status: "processing",
  priority: "normal",
  source: "email",
  customerName: "Buyer",
  submittedAt: "2026-08-25 10:00",
  lastUpdatedAt: "2026-08-25 10:00",
  replies: [],
  assignee: "客服小美",
};

describe("ticket assignments", () => {
  it("overrides the default assignee with the administrator assignment", () => {
    const [assigned] = applyTicketAssignments([ticket], { "TK-001": "客服小林" });
    assert.equal(assigned.assignee, "客服小林");
  });

  it("supports explicitly returning a ticket to the unassigned queue", () => {
    const [unassigned] = applyTicketAssignments([ticket], { "TK-001": null });
    assert.equal(unassigned.assignee, undefined);
  });

  it("keeps the default assignee when no administrator override exists", () => {
    const [unchanged] = applyTicketAssignments([ticket], {});
    assert.equal(unchanged.assignee, "客服小美");
  });
});
