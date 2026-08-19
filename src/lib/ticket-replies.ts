export type TicketIssueType = "order" | "logistics" | "refund" | "product" | "technical" | "other";
export type TicketStatus = "new" | "processing" | "replied" | "closed";
export type TicketPriority = "normal" | "high" | "urgent";
export type TicketSource = "web_widget" | "email" | "agent";
export type TicketMessageDirection = "inbound" | "outbound";

export interface TicketAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  mimeType: string;
  url?: string;
}

export interface TicketReply {
  id: string;
  channel: "email";
  from: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface TicketThreadMessage {
  id: string;
  direction: TicketMessageDirection;
  source: TicketSource;
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  sentAt: string;
  attachments: TicketAttachment[];
  deliveryStatus?: "sent" | "failed";
  includeSignature?: boolean;
}

export interface SupportTicket {
  id: string;
  issueType: TicketIssueType;
  title: string;
  description: string;
  contact: string;
  attachments: TicketAttachment[];
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  customerName: string;
  submittedAt: string;
  lastUpdatedAt: string;
  sourceSessionId?: string;
  relatedOrderId?: string;
  replies: TicketReply[];
  mailbox?: string;
  threadId?: string;
  unread?: boolean;
  messages?: TicketThreadMessage[];
}

export interface TicketEmailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface SendTicketEmailInput {
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: TicketAttachment[];
  from?: string;
}

export const ISSUE_TYPE_LABELS: Record<TicketIssueType, string> = {
  order: "订单问题",
  logistics: "物流配送",
  refund: "退款售后",
  product: "产品咨询",
  technical: "技术问题",
  other: "其他问题",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: "持续处理",
  processing: "持续处理",
  replied: "持续处理",
  closed: "处理完毕",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

export const TICKET_SOURCE_LABELS: Record<TicketSource, string> = {
  web_widget: "工单留言",
  email: "邮箱来信",
  agent: "客服邮箱",
};

const supportMailbox = "service@neewer.com";

export const initialSupportTickets: SupportTicket[] = [
  {
    id: "TK-WEB-20260818-0042",
    issueType: "logistics",
    title: "订单迟迟未发货",
    description:
      "订单 N210948 已经三天没有物流更新，页面一直显示仓库处理中。请帮我确认预计发货时间。",
    contact: "jane.cooper@example.com",
    attachments: [
      {
        id: "att-widget-order",
        name: "order-status.png",
        sizeLabel: "428 KB",
        mimeType: "image/png",
      },
    ],
    status: "new",
    priority: "high",
    source: "web_widget",
    customerName: "Jane Cooper",
    submittedAt: "2026-08-18 09:42",
    lastUpdatedAt: "2026-08-18 09:42",
    sourceSessionId: "S2025001",
    relatedOrderId: "N210948",
    replies: [],
    mailbox: supportMailbox,
    threadId: "TH-JANE-210948",
    unread: true,
    messages: [
      {
        id: "mail-widget-0042",
        direction: "inbound",
        source: "web_widget",
        from: "jane.cooper@example.com",
        to: supportMailbox,
        subject: "订单迟迟未发货",
        body: "订单 N210948 已经三天没有物流更新，页面一直显示仓库处理中。请帮我确认预计发货时间。",
        sentAt: "2026-08-18 09:42",
        attachments: [
          {
            id: "att-widget-order",
            name: "order-status.png",
            sizeLabel: "428 KB",
            mimeType: "image/png",
          },
        ],
      },
    ],
  },
  {
    id: "TK-MAIL-20260818-0038",
    issueType: "order",
    title: "Re: Action Required - Verification Needed for Order #N210948",
    description: "客户直接发送邮件，询问订单验证材料和预计处理时间。",
    contact: "odwascanio@gmail.com",
    attachments: [],
    status: "processing",
    priority: "urgent",
    source: "email",
    customerName: "Odw Ascanio",
    submittedAt: "2026-08-18 08:06",
    lastUpdatedAt: "2026-08-18 09:18",
    relatedOrderId: "N210948",
    replies: [
      {
        id: "reply-202608180842",
        channel: "email",
        from: supportMailbox,
        to: "odwascanio@gmail.com",
        subject: "Re: Action Required - Verification Needed for Order #N210948",
        body: "Hello,\n\nThanks for contacting NEEWER Customer Service. Please reply with a clear copy of the requested verification document. We will review it within one business day.",
        sentAt: "2026-08-18 08:42",
      },
    ],
    mailbox: supportMailbox,
    threadId: "TH-ODW-N210948",
    unread: true,
    messages: [
      {
        id: "mail-erp-23901",
        direction: "inbound",
        source: "email",
        from: "odwascanio@gmail.com",
        to: supportMailbox,
        subject: "Action Required - Verification Needed for Order #N210948",
        body: "Hello, I received a request to verify my order. Could you confirm which document is required and whether this will delay shipment?",
        sentAt: "2026-08-18 08:06",
        attachments: [],
      },
      {
        id: "mail-erp-23908",
        direction: "outbound",
        source: "agent",
        from: supportMailbox,
        to: "odwascanio@gmail.com",
        subject: "Re: Action Required - Verification Needed for Order #N210948",
        body: "Hello,\n\nThanks for contacting NEEWER Customer Service. Please reply with a clear copy of the requested verification document. We will review it within one business day.",
        sentAt: "2026-08-18 08:42",
        attachments: [],
        deliveryStatus: "sent",
        includeSignature: true,
      },
      {
        id: "mail-erp-23914",
        direction: "inbound",
        source: "email",
        from: "odwascanio@gmail.com",
        to: supportMailbox,
        subject: "Re: Action Required - Verification Needed for Order #N210948",
        body: "Thanks. I have attached the verification document. Please let me know when the order can be released.",
        sentAt: "2026-08-18 09:18",
        attachments: [
          {
            id: "att-verification",
            name: "verification-document.pdf",
            sizeLabel: "1.8 MB",
            mimeType: "application/pdf",
          },
        ],
      },
    ],
  },
  {
    id: "TK-WEB-20260818-0031",
    issueType: "refund",
    title: "退款超过 7 天还没到账",
    description: "退款申请已经通过，但支付账户还没有收到退款，请确认退款流水和到账时间。",
    contact: "maria.refund@example.com",
    attachments: [],
    status: "replied",
    priority: "high",
    source: "web_widget",
    customerName: "Maria Hill",
    submittedAt: "2026-08-18 07:28",
    lastUpdatedAt: "2026-08-18 08:12",
    sourceSessionId: "S2025005",
    relatedOrderId: "ORD-1003",
    replies: [
      {
        id: "reply-202608180812",
        channel: "email",
        from: supportMailbox,
        to: "maria.refund@example.com",
        subject: "Re: 退款超过 7 天还没到账",
        body: "您好，我们已联系财务核对支付渠道流水，预计一个工作日内通过邮件同步结果。",
        sentAt: "2026-08-18 08:12",
      },
    ],
    mailbox: supportMailbox,
    threadId: "TH-MARIA-REFUND",
    unread: false,
    messages: [
      {
        id: "mail-widget-0031",
        direction: "inbound",
        source: "web_widget",
        from: "maria.refund@example.com",
        to: supportMailbox,
        subject: "退款超过 7 天还没到账",
        body: "退款申请已经通过，但支付账户还没有收到退款，请确认退款流水和到账时间。",
        sentAt: "2026-08-18 07:28",
        attachments: [],
      },
      {
        id: "mail-agent-0031",
        direction: "outbound",
        source: "agent",
        from: supportMailbox,
        to: "maria.refund@example.com",
        subject: "Re: 退款超过 7 天还没到账",
        body: "您好，我们已联系财务核对支付渠道流水，预计一个工作日内通过邮件同步结果。",
        sentAt: "2026-08-18 08:12",
        attachments: [],
        deliveryStatus: "sent",
        includeSignature: true,
      },
    ],
  },
  {
    id: "TK-MAIL-20260817-0096",
    issueType: "product",
    title: "Neewer F100 7 inch monitor compatibility",
    description: "客户直接来信咨询 F100 监视器与 Sony A7 IV 的兼容性。",
    contact: "stalal@rogers.com",
    attachments: [
      {
        id: "att-camera-setup",
        name: "camera-setup.jpg",
        sizeLabel: "864 KB",
        mimeType: "image/jpeg",
      },
    ],
    status: "new",
    priority: "normal",
    source: "email",
    customerName: "Stan Lal",
    submittedAt: "2026-08-17 23:20",
    lastUpdatedAt: "2026-08-17 23:20",
    replies: [],
    mailbox: "support@neewer.com",
    threadId: "TH-STAN-F100",
    unread: true,
    messages: [
      {
        id: "mail-erp-23877",
        direction: "inbound",
        source: "email",
        from: "stalal@rogers.com",
        to: "support@neewer.com",
        subject: "Neewer F100 7 inch monitor compatibility",
        body: "Hi, is the Neewer F100 7 inch monitor compatible with the Sony A7 IV? I have attached a photo of my current camera setup.",
        sentAt: "2026-08-17 23:20",
        attachments: [
          {
            id: "att-camera-setup",
            name: "camera-setup.jpg",
            sizeLabel: "864 KB",
            mimeType: "image/jpeg",
          },
        ],
      },
    ],
  },
];

export function getTicketMessages(ticket: SupportTicket): TicketThreadMessage[] {
  if (ticket.messages?.length) return ticket.messages;

  const initialMessage: TicketThreadMessage = {
    id: `mail-${ticket.id}`,
    direction: "inbound",
    source: ticket.source,
    from: ticket.contact,
    to: ticket.mailbox ?? supportMailbox,
    subject: ticket.title,
    body: ticket.description,
    sentAt: ticket.submittedAt,
    attachments: ticket.attachments,
  };
  return [
    initialMessage,
    ...ticket.replies.map((reply) => ({
      id: reply.id,
      direction: "outbound" as const,
      source: "agent" as const,
      from: reply.from,
      to: reply.to,
      subject: reply.subject,
      body: reply.body,
      sentAt: reply.sentAt,
      attachments: [],
      deliveryStatus: "sent" as const,
      includeSignature: true,
    })),
  ];
}

export function buildTicketReplyDraft(ticket: SupportTicket): TicketEmailDraft {
  return {
    to: ticket.contact,
    subject: ticket.title.startsWith("Re:") ? ticket.title : `Re: ${ticket.title}`,
    body: [
      `${ticket.customerName} 您好，`,
      "",
      `我们已经收到您提交的工单 ${ticket.id}，问题类型为「${ISSUE_TYPE_LABELS[ticket.issueType]}」。`,
      `您提交的详情：${ticket.description}`,
      "",
      "我们会继续核实并通过邮件同步处理结果。",
      "",
      "客服团队",
    ].join("\n"),
  };
}

export function sendTicketEmail(
  ticket: SupportTicket,
  input: SendTicketEmailInput,
  sentAt = formatDateTime(new Date()),
): SupportTicket {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("请输入有效的收件邮箱");
  if (!subject) throw new Error("邮件主题不能为空");
  if (!body) throw new Error("邮件正文不能为空");
  if (ticket.status === "closed") throw new Error("已关闭工单不能发送邮件");

  const from = input.from ?? ticket.mailbox ?? supportMailbox;
  const id = `mail-${sentAt.replace(/\D/g, "").slice(0, 12)}-${ticket.id.slice(-4)}`;
  const reply: TicketReply = {
    id,
    channel: "email",
    from,
    to,
    subject,
    body,
    sentAt,
  };
  const message: TicketThreadMessage = {
    id,
    direction: "outbound",
    source: "agent",
    from,
    to,
    subject,
    body,
    bodyHtml: input.bodyHtml?.trim() || undefined,
    sentAt,
    attachments: input.attachments ?? [],
    deliveryStatus: "sent",
    includeSignature: true,
  };

  return {
    ...ticket,
    contact: to,
    status: "replied",
    unread: false,
    lastUpdatedAt: sentAt,
    replies: [...ticket.replies, reply],
    messages: [...getTicketMessages(ticket), message],
  };
}

export function appendTicketReply(
  ticket: SupportTicket,
  body: string,
  from: string,
  sentAt = formatDateTime(new Date()),
): SupportTicket {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error("邮件回复内容不能为空");

  const draft = buildTicketReplyDraft(ticket);
  const reply: TicketReply = {
    id: `reply-${sentAt.replace(/\D/g, "").slice(0, 12)}`,
    channel: "email",
    from,
    to: draft.to,
    subject: draft.subject,
    body: trimmedBody,
    sentAt,
  };

  return {
    ...ticket,
    status: "replied",
    unread: false,
    lastUpdatedAt: sentAt,
    replies: [...ticket.replies, reply],
    messages: [
      ...getTicketMessages(ticket),
      {
        id: reply.id,
        direction: "outbound",
        source: "agent",
        from,
        to: reply.to,
        subject: reply.subject,
        body: reply.body,
        sentAt,
        attachments: [],
        deliveryStatus: "sent",
        includeSignature: true,
      },
    ],
  };
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
