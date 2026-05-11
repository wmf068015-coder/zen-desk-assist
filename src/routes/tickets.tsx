import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import {
  appendTicketReply,
  buildTicketReplyDraft,
  formatDateTime,
  initialSupportTickets,
  ISSUE_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type SupportTicket,
  type TicketIssueType,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/ticket-replies";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  Mail,
  Paperclip,
  Search,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "工单中心 — 智能客服系统" },
      {
        name: "description",
        content: "查看独立站聊天组件提交的工单，并以邮件形式回复用户。",
      },
    ],
  }),
  component: TicketsPage,
});

const statusFilters: Array<{ value: TicketStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "new", label: "待查看" },
  { value: "processing", label: "处理中" },
  { value: "replied", label: "已回复" },
  { value: "closed", label: "已关闭" },
];

const issueFilters: Array<{ value: TicketIssueType | "all"; label: string }> = [
  { value: "all", label: "全部类型" },
  ...Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => ({
    value: value as TicketIssueType,
    label,
  })),
];

function TicketsPage() {
  const [tickets, setTickets] = useState(initialSupportTickets);
  const [activeId, setActiveId] = useState(initialSupportTickets[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [issueFilter, setIssueFilter] = useState<TicketIssueType | "all">("all");
  const [query, setQuery] = useState("");
  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});

  const filteredTickets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (issueFilter !== "all" && ticket.issueType !== issueFilter) return false;
      if (!keyword) return true;
      return [ticket.id, ticket.title, ticket.description, ticket.customerName, ticket.contact]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [tickets, statusFilter, issueFilter, query]);

  const activeTicket =
    tickets.find((ticket) => ticket.id === activeId) ?? filteredTickets[0] ?? tickets[0];
  const draft = activeTicket ? buildTicketReplyDraft(activeTicket) : null;
  const replyBody =
    activeTicket && Object.prototype.hasOwnProperty.call(replyBodies, activeTicket.id)
      ? replyBodies[activeTicket.id]
      : (draft?.body ?? "");

  const updateTicket = (ticketId: string, updater: (ticket: SupportTicket) => SupportTicket) => {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket)),
    );
  };

  const markProcessing = () => {
    if (!activeTicket || activeTicket.status === "processing") return;
    const now = formatDateTime(new Date());
    updateTicket(activeTicket.id, (ticket) => ({
      ...ticket,
      status: "processing",
      lastUpdatedAt: now,
    }));
    toast.success("工单已标记处理中", { description: activeTicket.id });
  };

  const sendReply = () => {
    if (!activeTicket) return;
    try {
      const sentAt = formatDateTime(new Date());
      const updated = appendTicketReply(activeTicket, replyBody, "客服小美", sentAt);
      updateTicket(activeTicket.id, () => updated);
      setReplyBodies((current) => ({ ...current, [activeTicket.id]: "" }));
      toast.success("邮件回复已发送", {
        description: `${updated.id} 已回复至 ${updated.contact}`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "邮件回复发送失败");
    }
  };

  const closeTicket = () => {
    if (!activeTicket) return;
    const now = formatDateTime(new Date());
    updateTicket(activeTicket.id, (ticket) => ({
      ...ticket,
      status: "closed",
      lastUpdatedAt: now,
    }));
    toast.success("工单已关闭", { description: activeTicket.id });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <section className="flex h-full w-[380px] shrink-0 flex-col border-r bg-card">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">工单中心</h1>
              <p className="text-xs text-muted-foreground">共 {filteredTickets.length} 张工单</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索工单、客户或联系方式"
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  statusFilter === filter.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <select
            value={issueFilter}
            onChange={(event) => setIssueFilter(event.target.value as TicketIssueType | "all")}
            className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {issueFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              active={ticket.id === activeTicket?.id}
              onSelect={() => setActiveId(ticket.id)}
            />
          ))}
          {filteredTickets.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">没有匹配的工单</div>
          )}
        </div>
      </section>

      {activeTicket && draft ? (
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between border-b bg-card px-6 py-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusPill status={activeTicket.status} />
                <PriorityPill priority={activeTicket.priority} />
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {ISSUE_TYPE_LABELS[activeTicket.issueType]}
                </span>
              </div>
              <h2 className="truncate text-xl font-semibold">{activeTicket.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeTicket.id} · {activeTicket.submittedAt} 提交 · 最近更新{" "}
                {activeTicket.lastUpdatedAt}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={markProcessing}
                disabled={activeTicket.status === "processing" || activeTicket.status === "closed"}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Clock3 className="h-3.5 w-3.5" />
                处理中
              </button>
              <button
                onClick={closeTicket}
                disabled={activeTicket.status === "closed"}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-success hover:text-success disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                关闭
              </button>
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-5">
            <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-5">
                <section className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">用户提交详情</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoItem label="客户" value={activeTicket.customerName} />
                    <InfoItem label="联系方式" value={activeTicket.contact} />
                    <InfoItem label="来源" value="独立站聊天组件" />
                    <InfoItem label="关联会话" value={activeTicket.sourceSessionId ?? "未关联"} />
                    <InfoItem label="关联订单" value={activeTicket.relatedOrderId ?? "未填写"} />
                    <InfoItem label="附件数" value={`${activeTicket.attachments.length} 个`} />
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/40 p-4">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">问题描述</p>
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {activeTicket.description}
                    </p>
                  </div>
                  {activeTicket.attachments.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activeTicket.attachments.map((attachment) => (
                        <span
                          key={attachment.id}
                          className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          {attachment.name}
                          <span className="text-muted-foreground/70">{attachment.sizeLabel}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">邮件回复</h3>
                  </div>
                  <div className="space-y-3">
                    <ReadonlyField label="收件人" value={draft.to} />
                    <ReadonlyField label="主题" value={draft.subject} />
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        正文
                      </span>
                      <textarea
                        value={replyBody}
                        onChange={(event) =>
                          setReplyBodies((current) => ({
                            ...current,
                            [activeTicket.id]: event.target.value,
                          }))
                        }
                        rows={10}
                        disabled={activeTicket.status === "closed"}
                        className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                      />
                    </label>
                    <div className="flex justify-end">
                      <button
                        onClick={sendReply}
                        disabled={!replyBody.trim() || activeTicket.status === "closed"}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send className="h-4 w-4" />
                        发送邮件回复
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">处理记录</h3>
                  </div>
                  <div className="space-y-3">
                    <TimelineItem
                      title="用户提交工单"
                      description={`${activeTicket.customerName} 通过聊天组件提交`}
                      time={activeTicket.submittedAt}
                    />
                    {activeTicket.replies.map((reply) => (
                      <TimelineItem
                        key={reply.id}
                        title="邮件回复"
                        description={`${reply.from} 回复至 ${reply.to}`}
                        time={reply.sentAt}
                      />
                    ))}
                    {activeTicket.status === "closed" && (
                      <TimelineItem
                        title="工单关闭"
                        description="客服已完成本次处理"
                        time={activeTicket.lastUpdatedAt}
                      />
                    )}
                  </div>
                </section>

                <section className="rounded-lg border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <h3 className="font-semibold">风险提示</h3>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    涉及退款、赔付、投诉或支付问题时，回复中只同步核实进展，不直接承诺退款金额、补发结果或具体赔付。
                  </p>
                </section>
              </aside>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          暂无工单
        </main>
      )}
    </div>
  );
}

function TicketListItem({
  ticket,
  active,
  onSelect,
}: {
  ticket: SupportTicket;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-2 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
        active && "border-l-2 border-l-primary bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{ticket.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{ticket.id}</p>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">{ticket.lastUpdatedAt}</span>
      </div>
      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{ticket.description}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <StatusPill status={ticket.status} />
          <span className="truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ISSUE_TYPE_LABELS[ticket.issueType]}
          </span>
        </div>
        {ticket.attachments.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            {ticket.attachments.length}
          </span>
        )}
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
        status === "new" && "bg-warning/20 text-warning-foreground",
        status === "processing" && "bg-info/15 text-info",
        status === "replied" && "bg-success/15 text-success",
        status === "closed" && "bg-muted text-muted-foreground",
      )}
    >
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

function PriorityPill({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
        priority === "normal" && "bg-muted text-muted-foreground",
        priority === "high" && "bg-warning/20 text-warning-foreground",
        priority === "urgent" && "bg-destructive/15 text-destructive",
      )}
    >
      {TICKET_PRIORITY_LABELS[priority]}优先级
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        readOnly
        className="h-9 w-full rounded-lg border bg-muted/40 px-3 text-sm outline-none"
      />
    </label>
  );
}

function TimelineItem({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="border-l-2 border-primary/20 pl-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{title}</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">{time}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
