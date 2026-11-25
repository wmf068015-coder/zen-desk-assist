import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMockEmailReply, generateMockEmailReply } from "./ai-email-reply.ts";
import { initialSupportTickets } from "./ticket-replies.ts";

describe("mock AI email reply", () => {
  it("generates invoice content from the latest email without changing the ticket", () => {
    const ticket = structuredClone(initialSupportTickets[0]);
    const before = structuredClone(ticket);
    const body = buildMockEmailReply(ticket);
    assert.match(body, /Bonjour/);
    assert.match(body, /facture/);
    assert.deepEqual(ticket, before);
  });

  it("supports customer ticket content and related order numbers", () => {
    const ticket = initialSupportTickets.find((item) => item.source === "web_widget")!;
    const body = buildMockEmailReply({
      ...ticket,
      status: "new",
      issueType: "logistics",
      title: "物流查询",
      relatedOrderId: "TEST-1001",
    });
    assert.match(body, /TEST-1001/);
    assert.match(body, /物流/);
    assert.match(body, /NEEWER/);
  });

  it("rejects Amazon and completed tickets", () => {
    assert.throws(() =>
      buildMockEmailReply({ ...initialSupportTickets[0], source: "amazon_email" }),
    );
    assert.throws(() => buildMockEmailReply({ ...initialSupportTickets[0], status: "closed" }));
  });

  it("cancels pending generation when navigating away", async () => {
    const controller = new AbortController();
    const result = generateMockEmailReply(initialSupportTickets[0], controller.signal);
    controller.abort();
    await assert.rejects(result, { name: "AbortError" });
  });
});
