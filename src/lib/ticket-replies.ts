export type TicketIssueType = "order" | "logistics" | "refund" | "product" | "technical" | "other";
export type TicketStatus = "new" | "processing" | "replied" | "closed";
export type TicketPriority = "normal" | "high" | "urgent";
export type TicketSource = "web_widget" | "email" | "agent";

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
}

export interface TicketEmailDraft {
  to: string;
  subject: string;
  body: string;
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
  new: "待查看",
  processing: "处理中",
  replied: "已回复",
  closed: "已关闭",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

export const initialSupportTickets: SupportTicket[] = [
  {
    id: "TK-WEB-20260511-0001",
    issueType: "logistics",
    title: "订单迟迟未发货",
    description:
      "订单 ORD-1004 显示仓库正在拣货，但已经 3 天没有物流更新。希望确认今天是否能发出。",
    contact: "jane.cooper@example.com",
    attachments: [
      {
        id: "att-logistics-1",
        name: "order-status.png",
        sizeLabel: "428 KB",
        mimeType: "image/png",
      },
    ],
    status: "new",
    priority: "high",
    source: "web_widget",
    customerName: "Jane Cooper",
    submittedAt: "2026-05-11 09:42",
    lastUpdatedAt: "2026-05-11 09:42",
    sourceSessionId: "S2025001",
    relatedOrderId: "ORD-1004",
    replies: [],
  },
  {
    id: "TK-WEB-20260511-0002",
    issueType: "refund",
    title: "退款超过 7 天还没到账",
    description:
      "退款申请已经通过，但支付账户还没有收到退款。用户希望客服确认退款流水和预计到账时间。",
    contact: "maria.refund@example.com",
    attachments: [],
    status: "processing",
    priority: "urgent",
    source: "web_widget",
    customerName: "Maria Hill",
    submittedAt: "2026-05-11 08:16",
    lastUpdatedAt: "2026-05-11 09:05",
    sourceSessionId: "S2025005",
    relatedOrderId: "ORD-1003",
    replies: [
      {
        id: "reply-202605110905",
        channel: "email",
        from: "客服小美",
        to: "maria.refund@example.com",
        subject: "Re: 退款超过 7 天还没到账",
        body: "您好，我们已经收到您的退款进度反馈，正在联系财务核对支付渠道流水。",
        sentAt: "2026-05-11 09:05",
      },
    ],
  },
  {
    id: "TK-WEB-20260510-0007",
    issueType: "technical",
    title: "设备连接 App 失败",
    description: "设备型号 NL-660，App 提示服务器错误，重装后仍然失败。用户已上传错误截图。",
    contact: "support.case@example.com",
    attachments: [
      {
        id: "att-tech-1",
        name: "app-error.jpg",
        sizeLabel: "1.2 MB",
        mimeType: "image/jpeg",
      },
      {
        id: "att-tech-2",
        name: "device-sn.txt",
        sizeLabel: "3 KB",
        mimeType: "text/plain",
      },
    ],
    status: "replied",
    priority: "high",
    source: "web_widget",
    customerName: "Kevin Lin",
    submittedAt: "2026-05-10 17:28",
    lastUpdatedAt: "2026-05-10 18:12",
    replies: [
      {
        id: "reply-202605101812",
        channel: "email",
        from: "客服小美",
        to: "support.case@example.com",
        subject: "Re: 设备连接 App 失败",
        body: "您好，请先确认 App 已更新到最新版本。我们也已将设备序列号提交给技术同事核查。",
        sentAt: "2026-05-10 18:12",
      },
    ],
  },
];

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

export function appendTicketReply(
  ticket: SupportTicket,
  body: string,
  from: string,
  sentAt = formatDateTime(new Date()),
): SupportTicket {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error("邮件回复内容不能为空");
  }

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
    lastUpdatedAt: sentAt,
    replies: [...ticket.replies, reply],
  };
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
