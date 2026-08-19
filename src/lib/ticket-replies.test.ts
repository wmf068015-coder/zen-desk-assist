import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendTicketReply,
  buildTicketReplyDraft,
  getTicketMessages,
  sendTicketEmail,
} from "./ticket-replies.ts";
import type { SupportTicket } from "./ticket-replies.ts";

const baseTicket: SupportTicket = {
  id: "TK-WEB-20260511-0001",
  issueType: "logistics",
  title: "订单迟迟未发货",
  description: "订单已经 3 天没有物流更新，希望客服帮忙确认。",
  contact: "jane@example.com",
  attachments: [{ id: "att-1", name: "order.png", sizeLabel: "240 KB", mimeType: "image/png" }],
  status: "new",
  priority: "high",
  source: "web_widget",
  customerName: "Jane Cooper",
  submittedAt: "2026-05-11 09:42",
  lastUpdatedAt: "2026-05-11 09:42",
  replies: [],
};

describe("ticket email replies", () => {
  it("builds an email reply draft from customer-submitted ticket details", () => {
    const draft = buildTicketReplyDraft(baseTicket);

    assert.equal(draft.to, "jane@example.com");
    assert.equal(draft.subject, "Re: 订单迟迟未发货");
    assert.match(draft.body, /订单已经 3 天没有物流更新/);
    assert.match(draft.body, /TK-WEB-20260511-0001/);
  });

  it("appends an agent email reply and marks the ticket as replied", () => {
    const updated = appendTicketReply(
      baseTicket,
      "您好，我们已经联系仓库加急核实，今天内会通过邮件同步最新结果。",
      "客服小美",
      "2026-05-11 10:15",
    );

    assert.equal(updated.status, "replied");
    assert.equal(updated.lastUpdatedAt, "2026-05-11 10:15");
    assert.equal(updated.replies.length, 1);
    assert.deepEqual(updated.replies[0], {
      id: "reply-202605111015",
      channel: "email",
      from: "客服小美",
      to: "jane@example.com",
      subject: "Re: 订单迟迟未发货",
      body: "您好，我们已经联系仓库加急核实，今天内会通过邮件同步最新结果。",
      sentAt: "2026-05-11 10:15",
    });
  });

  it("sends to the edited email and appends the outgoing mail to the thread", () => {
    const updated = sendTicketEmail(
      baseTicket,
      {
        to: "buyer@example.com",
        subject: "Re: 订单迟迟未发货",
        body: "您好，仓库已完成复核，订单将在今天发出。",
        bodyHtml: "<h2><strong>处理结果</strong></h2><p>订单将在今天发出。</p>",
        attachments: [
          {
            id: "att-reply",
            name: "tracking.pdf",
            sizeLabel: "80 KB",
            mimeType: "application/pdf",
          },
        ],
      },
      "2026-05-11 10:30",
    );

    const thread = getTicketMessages(updated);
    assert.equal(updated.contact, "buyer@example.com");
    assert.equal(updated.status, "replied");
    assert.equal(thread.length, 2);
    assert.equal(thread[1].direction, "outbound");
    assert.equal(thread[1].bodyHtml, "<h2><strong>处理结果</strong></h2><p>订单将在今天发出。</p>");
    assert.equal(thread[1].includeSignature, true);
    assert.equal(thread[1].attachments[0].name, "tracking.pdf");
  });

  it("rejects an invalid recipient email", () => {
    assert.throws(
      () =>
        sendTicketEmail(baseTicket, {
          to: "invalid-email",
          subject: "Re: 订单迟迟未发货",
          body: "测试回复",
        }),
      /有效的收件邮箱/,
    );
  });
});
