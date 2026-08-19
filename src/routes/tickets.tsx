import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildTicketReplyDraft,
  formatDateTime,
  getTicketMessages,
  initialSupportTickets,
  ISSUE_TYPE_LABELS,
  sendTicketEmail,
  type SupportTicket,
  type TicketAttachment,
  type TicketIssueType,
  type TicketThreadMessage,
} from "@/lib/ticket-replies";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Eye,
  Facebook,
  FileText,
  Globe2,
  Inbox,
  Instagram,
  Italic,
  Link2,
  List,
  ListOrdered,
  Mail,
  MailOpen,
  Maximize2,
  Minimize2,
  Music2,
  Paperclip,
  Redo2,
  Reply,
  Search,
  Send,
  Twitter,
  Underline,
  Undo2,
  User,
  X,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "邮件工单 — 智能客服系统" },
      {
        name: "description",
        content: "统一查看访客工单留言和客服邮箱来信，并通过邮件回复链持续处理。",
      },
    ],
  }),
  component: TicketsPage,
});

type TicketFilter = "all" | "read" | "unread";
type TimeRange = "7" | "30" | "90" | "180" | "custom";
type TicketSourceFilter = "all" | "web_widget" | "service@neewer.com" | "support@neewer.com";

interface ReplyDraftState {
  to: string;
  subject: string;
  body: string;
  bodyHtml: string;
  attachments: TicketAttachment[];
}

const statusFilters: Array<{ value: TicketFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "read", label: "已读" },
  { value: "unread", label: "未读" },
];

function TicketsPage() {
  const [tickets, setTickets] = useState(initialSupportTickets);
  const [activeId, setActiveId] = useState(initialSupportTickets[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<TicketFilter>("all");
  const [issueFilter, setIssueFilter] = useState<TicketIssueType | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<TicketSourceFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("90");
  const [customStartDate, setCustomStartDate] = useState("2026-05-18");
  const [customEndDate, setCustomEndDate] = useState("2026-08-18");
  const [query, setQuery] = useState("");
  const [replyExpanded, setReplyExpanded] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<TicketAttachment | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, ReplyDraftState>>({});
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const importedTicketIdsRef = useRef(new Set<string>());

  useEffect(() => {
    let disposed = false;

    const loadVisitorTickets = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5174/api/demo-ticket-submissions");
        if (!response.ok) return;
        const payload = (await response.json()) as { submissions?: DemoTicketSubmission[] };
        const submissions = (payload.submissions ?? []).filter(
          (submission) => !importedTicketIdsRef.current.has(submission.id),
        );
        if (disposed || submissions.length === 0) return;

        submissions.forEach((submission) => importedTicketIdsRef.current.add(submission.id));
        const incomingTickets = submissions.map(ticketFromSubmission);
        setTickets((current) => [
          ...incomingTickets.filter(
            (incoming) => !current.some((ticket) => ticket.id === incoming.id),
          ),
          ...current,
        ]);
        toast.info(`收到 ${incomingTickets.length} 条访客工单留言`, {
          description: incomingTickets[0]?.contact,
        });
      } catch {
        // The workbench remains usable when the visitor demo is not running.
      }
    };

    void loadVisitorTickets();
    const timer = window.setInterval(loadVisitorTickets, 2000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  const latestTimestamp = useMemo(
    () => Math.max(...tickets.map((ticket) => parseTicketDate(ticket.lastUpdatedAt).getTime())),
    [tickets],
  );
  const customRangeError =
    timeRange !== "custom"
      ? ""
      : !customStartDate || !customEndDate
        ? "请选择完整的开始和结束日期"
        : customStartDate > customEndDate
          ? "开始日期不能晚于结束日期"
          : "";
  const filteredTickets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const customStart = new Date(`${customStartDate}T00:00:00`).getTime();
    const customEnd = new Date(`${customEndDate}T23:59:59`).getTime();
    const customRangeValid = !customRangeError;
    const cutoff =
      timeRange === "custom"
        ? customStart
        : latestTimestamp - Number(timeRange) * 24 * 60 * 60 * 1000;

    return tickets
      .filter((ticket) => {
        const updatedAt = parseTicketDate(ticket.lastUpdatedAt).getTime();
        if (timeRange === "custom") {
          if (!customRangeValid || updatedAt < customStart || updatedAt > customEnd) return false;
        } else if (updatedAt < cutoff) {
          return false;
        }
        if (statusFilter === "read" && ticket.unread) return false;
        if (statusFilter === "unread" && !ticket.unread) return false;
        if (issueFilter !== "all" && ticket.issueType !== issueFilter) return false;
        if (sourceFilter === "web_widget" && ticket.source !== "web_widget") return false;
        if (
          sourceFilter !== "all" &&
          sourceFilter !== "web_widget" &&
          (ticket.source === "web_widget" || ticket.mailbox !== sourceFilter)
        ) {
          return false;
        }
        if (!keyword) return true;
        return [
          ticket.id,
          ticket.title,
          ticket.contact,
          ticket.customerName,
          ticket.relatedOrderId ?? "",
          ...getTicketMessages(ticket).map((message) => message.body),
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort(
        (a, b) =>
          parseTicketDate(b.lastUpdatedAt).getTime() - parseTicketDate(a.lastUpdatedAt).getTime(),
      );
  }, [
    customEndDate,
    customRangeError,
    customStartDate,
    issueFilter,
    latestTimestamp,
    query,
    sourceFilter,
    statusFilter,
    tickets,
    timeRange,
  ]);

  const activeTicket =
    filteredTickets.find((ticket) => ticket.id === activeId) ?? filteredTickets[0] ?? null;
  const activeMessages = activeTicket ? getTicketMessages(activeTicket) : [];
  const defaultDraft = activeTicket ? buildTicketReplyDraft(activeTicket) : null;
  const activeDraft = activeTicket
    ? (replyDrafts[activeTicket.id] ?? {
        to: defaultDraft?.to ?? "",
        subject: defaultDraft?.subject ?? "",
        body: "",
        bodyHtml: "",
        attachments: [],
      })
    : null;
  const unreadCount = tickets.filter((ticket) => ticket.unread).length;

  const updateTicket = (ticketId: string, updater: (ticket: SupportTicket) => SupportTicket) => {
    setTickets((current) =>
      current.map((ticket) => (ticket.id === ticketId ? updater(ticket) : ticket)),
    );
  };

  const selectTicket = (ticketId: string) => {
    setActiveId(ticketId);
    updateTicket(ticketId, (ticket) => ({ ...ticket, unread: false }));
  };

  const updateDraft = (patch: Partial<ReplyDraftState>) => {
    if (!activeTicket || !activeDraft) return;
    setReplyDrafts((current) => ({
      ...current,
      [activeTicket.id]: { ...activeDraft, ...patch },
    }));
  };

  const addReplyAttachments = (files: FileList | null) => {
    if (!files || !activeDraft) return;
    const attachments = Array.from(files).map((file, index) => ({
      id: `reply-att-${Date.now()}-${index}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      mimeType: file.type || "application/octet-stream",
      url: URL.createObjectURL(file),
    }));
    updateDraft({ attachments: [...activeDraft.attachments, ...attachments].slice(0, 5) });
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
  };

  const sendReply = () => {
    if (!activeTicket || !activeDraft) return;
    try {
      const sentAt = formatDateTime(new Date());
      const updated = sendTicketEmail(
        activeTicket,
        {
          to: activeDraft.to,
          subject: activeDraft.subject,
          body: activeDraft.body,
          bodyHtml: sanitizeRichTextHtml(activeDraft.bodyHtml),
          attachments: activeDraft.attachments,
        },
        sentAt,
      );
      updateTicket(activeTicket.id, () => updated);
      setReplyDrafts((current) => ({
        ...current,
        [activeTicket.id]: {
          ...activeDraft,
          body: "",
          bodyHtml: "",
          attachments: [],
        },
      }));
      setReplyExpanded(false);
      toast.success("邮件已发送", {
        description: `已发送至 ${updated.contact}，后续回复会进入当前回复链`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "邮件发送失败，请重试");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <section className="flex h-full w-[420px] shrink-0 flex-col border-r bg-card">
        <header className="border-b px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">邮件工单</h1>
                {unreadCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filteredTickets.length} 个回复链
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs text-success">
              <span className="h-2 w-2 rounded-full bg-success" />
              邮箱同步正常
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as TimeRange)}
              aria-label="邮件时间范围"
              className="h-9 min-w-0 rounded-md border bg-background px-2 text-[11px] outline-none focus:border-primary"
            >
              <option value="7">近 7 天</option>
              <option value="30">近 1 个月</option>
              <option value="90">近 3 个月</option>
              <option value="180">近 6 个月</option>
              <option value="custom">自定义时间</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value as TicketSourceFilter)}
              aria-label="工单来源"
              className="h-9 min-w-0 rounded-md border bg-background px-2 text-[11px] outline-none focus:border-primary"
            >
              <option value="all">全部来源</option>
              <option value="web_widget">工单留言</option>
              <option value="service@neewer.com">service 邮箱</option>
              <option value="support@neewer.com">support 邮箱</option>
            </select>
            <select
              value={issueFilter}
              onChange={(event) => setIssueFilter(event.target.value as TicketIssueType | "all")}
              aria-label="问题类型"
              className="h-9 min-w-0 rounded-md border bg-background px-2 text-[11px] outline-none focus:border-primary"
            >
              <option value="all">全部问题类型</option>
              {Object.entries(ISSUE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {timeRange === "custom" && (
            <div className="mt-2">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  aria-label="开始日期"
                  aria-invalid={Boolean(customRangeError)}
                  className="h-8 min-w-0 rounded-md border bg-background px-2 text-[11px] outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-foreground">至</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  aria-label="结束日期"
                  aria-invalid={Boolean(customRangeError)}
                  className="h-8 min-w-0 rounded-md border bg-background px-2 text-[11px] outline-none focus:border-primary"
                />
              </div>
              {customRangeError && (
                <p className="mt-1 text-[10px] text-destructive">{customRangeError}</p>
              )}
            </div>
          )}

          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索客户邮箱、主题、正文或订单号"
              className="h-9 w-full rounded-md border bg-background pl-8 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                aria-label="清空搜索"
                title="清空"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  statusFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              active={ticket.id === activeTicket?.id}
              onSelect={() => selectTicket(ticket.id)}
            />
          ))}
          {filteredTickets.length === 0 && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 px-8 text-center text-sm text-muted-foreground">
              <Inbox className="h-6 w-6 opacity-50" />
              当前条件下没有邮件工单
            </div>
          )}
        </div>
      </section>

      {activeTicket && activeDraft ? (
        <main className="flex min-w-0 flex-1 flex-col bg-muted/15">
          <header className="border-b bg-card px-5 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <ReadStatusPill unread={Boolean(activeTicket.unread)} />
                <ReplyStatusPill sent={activeMessages.at(-1)?.direction === "outbound"} />
                <SourcePill source={activeTicket.source} mailbox={activeTicket.mailbox} />
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {ISSUE_TYPE_LABELS[activeTicket.issueType]}
                </span>
              </div>
              <h2 className="mt-1.5 truncate text-base font-semibold">{activeTicket.title}</h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {activeTicket.contact} · {activeMessages.length} 封邮件 · {activeTicket.id}
                {activeTicket.relatedOrderId ? ` · 订单 ${activeTicket.relatedOrderId}` : ""}
              </p>
            </div>
          </header>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mx-auto max-w-4xl space-y-3">
              <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                回复链起始于 {activeTicket.submittedAt}
                <span className="h-px flex-1 bg-border" />
              </div>
              {activeMessages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  message={message}
                  onPreviewAttachment={setPreviewAttachment}
                />
              ))}
            </div>
          </div>

          <section
            className={cn(
              "scrollbar-thin overflow-y-auto border-t bg-card px-5",
              replyExpanded ? "max-h-[430px] py-3" : "py-2",
            )}
          >
            <div className="mx-auto max-w-4xl">
              <button
                type="button"
                onClick={() => setReplyExpanded((expanded) => !expanded)}
                aria-expanded={replyExpanded}
                aria-label={replyExpanded ? "缩小邮件回复框" : "放大邮件回复框"}
                title={replyExpanded ? "缩小邮件回复框" : "放大邮件回复框"}
                className={cn(
                  "flex h-8 w-full items-center justify-between gap-3 rounded px-1 text-left hover:bg-muted/50",
                  replyExpanded && "mb-2",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Reply className="h-4 w-4 shrink-0 text-primary" />
                  <span className="shrink-0 text-sm font-semibold">邮件回复</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    发件邮箱：{activeTicket.mailbox ?? "service@neewer.com"}
                  </span>
                </span>
                {replyExpanded ? (
                  <Minimize2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Maximize2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {replyExpanded && (
                <>
                  <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center border-b text-xs">
                    <label htmlFor="ticket-reply-to" className="text-muted-foreground">
                      收件人
                    </label>
                    <input
                      id="ticket-reply-to"
                      value={activeDraft.to}
                      onChange={(event) => updateDraft({ to: event.target.value })}
                      disabled={activeTicket.status === "closed"}
                      className="h-8 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground disabled:opacity-50"
                      placeholder="访客邮箱"
                    />
                  </div>
                  <div className="grid grid-cols-[52px_minmax(0,1fr)] items-center border-b text-xs">
                    <label htmlFor="ticket-reply-subject" className="text-muted-foreground">
                      主题
                    </label>
                    <input
                      id="ticket-reply-subject"
                      value={activeDraft.subject}
                      onChange={(event) => updateDraft({ subject: event.target.value })}
                      disabled={activeTicket.status === "closed"}
                      className="h-8 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground disabled:opacity-50"
                      placeholder="邮件主题"
                    />
                  </div>
                  <RichTextEditor
                    key={activeTicket.id}
                    value={activeDraft.bodyHtml}
                    disabled={activeTicket.status === "closed"}
                    placeholder={
                      activeTicket.status === "closed"
                        ? "工单已关闭，无法继续回复"
                        : "输入邮件内容，Enter 换行..."
                    }
                    onChange={({ html, text }) => updateDraft({ bodyHtml: html, body: text })}
                  />
                  <EmailSignature />

                  {activeDraft.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {activeDraft.attachments.map((attachment) => (
                        <span
                          key={attachment.id}
                          className="inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-[11px]"
                        >
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          {attachment.name}
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft({
                                attachments: activeDraft.attachments.filter(
                                  (item) => item.id !== attachment.id,
                                ),
                              })
                            }
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`移除附件 ${attachment.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={(event) => addReplyAttachments(event.target.files)}
                      />
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        disabled={activeTicket.status === "closed"}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        添加附件
                      </button>
                      <span className="text-[10px] text-muted-foreground">最多 5 个附件</span>
                    </div>
                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={!activeDraft.body.trim() || activeTicket.status === "closed"}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                      发送邮件
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </main>
      ) : (
        <main className="flex flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <MailOpen className="h-8 w-8 opacity-50" />
          请选择一封邮件工单
        </main>
      )}
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
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
  const messages = getTicketMessages(ticket);
  const latestInboundMessage = [...messages]
    .reverse()
    .find((message) => message.direction === "inbound");
  const receivedAt = latestInboundMessage?.sentAt ?? ticket.submittedAt;
  const source = latestInboundMessage?.source ?? ticket.source;
  const sourceMailbox = latestInboundMessage?.to ?? ticket.mailbox;
  const replySent = messages.at(-1)?.direction === "outbound";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
        active && "bg-primary/5",
      )}
    >
      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
      <dl className="grid grid-cols-[42px_minmax(0,1fr)_52px_max-content] items-center gap-x-2 gap-y-1.5">
        <dt className="text-[10px] text-muted-foreground">来源</dt>
        <dd className="min-w-0">
          <SourcePill source={source} mailbox={sourceMailbox} />
        </dd>
        <dt className="text-[10px] text-muted-foreground">收件日期</dt>
        <dd className="whitespace-nowrap text-[10px] text-muted-foreground">
          <time>{receivedAt}</time>
        </dd>

        <dt className="text-[10px] text-muted-foreground">主题</dt>
        <dd
          className={cn(
            "col-span-3 line-clamp-2 text-xs leading-5",
            ticket.unread ? "font-semibold" : "font-medium",
          )}
        >
          {ticket.title}
        </dd>

        <dt className="text-[10px] text-muted-foreground">买家邮箱</dt>
        <dd className="col-span-3 truncate text-[11px] text-muted-foreground">{ticket.contact}</dd>

        <dt className="text-[10px] text-muted-foreground">状态</dt>
        <dd>
          <ReadStatusPill unread={Boolean(ticket.unread)} />
        </dd>
        <dt className="text-[10px] text-muted-foreground">回复状态</dt>
        <dd>
          <ReplyStatusPill sent={replySent} />
        </dd>
      </dl>
    </button>
  );
}

function ThreadMessage({
  message,
  onPreviewAttachment,
}: {
  message: TicketThreadMessage;
  onPreviewAttachment: (attachment: TicketAttachment) => void;
}) {
  const inbound = message.direction === "inbound";

  return (
    <article
      className={cn(
        "rounded-md border bg-card px-4 py-3 shadow-sm",
        inbound ? "mr-10" : "ml-10 border-primary/25 bg-primary/[0.025]",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            inbound ? "bg-muted text-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {inbound ? <User className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate text-xs font-semibold">{message.from}</span>
                <MessageSourcePill message={message} />
                {message.deliveryStatus === "sent" && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-success">
                    <Check className="h-2.5 w-2.5" />
                    已发送
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                发送至 {message.to}
              </p>
            </div>
            <time className="shrink-0 text-[10px] text-muted-foreground">{message.sentAt}</time>
          </div>

          <div className="mt-3 border-t pt-3">
            <p className="mb-2 text-xs font-medium">{message.subject}</p>
            {message.bodyHtml ? (
              <div
                className="text-sm leading-6 text-foreground/90 [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                {message.body}
              </p>
            )}
            {message.includeSignature && <EmailSignature compact />}
          </div>

          {message.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
              {message.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => onPreviewAttachment(attachment)}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-primary"
                  aria-label={`预览附件 ${attachment.name}`}
                  title={`预览 ${attachment.name}`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  {attachment.name}
                  <span className="opacity-70">{attachment.sizeLabel}</span>
                  <Eye className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AttachmentPreviewDialog({
  attachment,
  onClose,
}: {
  attachment: TicketAttachment | null;
  onClose: () => void;
}) {
  const previewUrl = attachment ? getAttachmentPreviewUrl(attachment) : undefined;

  return (
    <Dialog open={Boolean(attachment)} onOpenChange={(open) => !open && onClose()}>
      {attachment && (
        <DialogContent className="max-h-[88vh] max-w-4xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-3 pr-12">
            <DialogTitle className="truncate text-sm">{attachment.name}</DialogTitle>
            <DialogDescription className="text-xs">
              {attachment.sizeLabel} · {attachment.mimeType}
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-h-[440px] items-center justify-center overflow-auto bg-muted/30 p-5">
            {attachment.mimeType.startsWith("image/") && previewUrl ? (
              <img
                src={previewUrl}
                alt={attachment.name}
                className="max-h-[68vh] max-w-full object-contain"
              />
            ) : attachment.mimeType.startsWith("video/") && previewUrl ? (
              <video
                src={previewUrl}
                controls
                preload="metadata"
                className="max-h-[68vh] max-w-full bg-black"
              >
                当前浏览器无法播放该视频。
              </video>
            ) : attachment.mimeType === "application/pdf" && previewUrl ? (
              <iframe
                src={previewUrl}
                title={attachment.name}
                className="h-[68vh] w-full border bg-white"
              />
            ) : attachment.id === "att-widget-order" ? (
              <OrderStatusAttachmentPreview />
            ) : attachment.mimeType === "application/pdf" ? (
              <PdfAttachmentPreview attachment={attachment} />
            ) : (
              <GenericAttachmentPreview attachment={attachment} />
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

function OrderStatusAttachmentPreview() {
  return (
    <div className="w-full max-w-2xl border bg-white p-6 text-slate-900 shadow-sm">
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-xs text-slate-500">Order status</p>
          <h3 className="mt-1 text-xl font-semibold">Order #N210948</h3>
        </div>
        <span className="rounded bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
          Warehouse processing
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 border-b py-5 text-sm">
        <div>
          <p className="text-xs text-slate-500">Order date</p>
          <p className="mt-1 font-medium">2026-08-15</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Payment</p>
          <p className="mt-1 font-medium">Paid</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tracking number</p>
          <p className="mt-1 text-slate-400">Not available</p>
        </div>
      </div>
      <div className="space-y-4 pt-5 text-sm">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="w-36 font-medium">Payment confirmed</span>
          <span className="text-xs text-slate-500">2026-08-15 11:28</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="w-36 font-medium">Warehouse processing</span>
          <span className="text-xs text-slate-500">2026-08-18 08:56</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="w-36">Shipped</span>
          <span className="text-xs">Pending</span>
        </div>
      </div>
    </div>
  );
}

function PdfAttachmentPreview({ attachment }: { attachment: TicketAttachment }) {
  return (
    <div className="min-h-[520px] w-full max-w-lg bg-white p-10 text-slate-900 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">NEEWER CUSTOMER SERVICE</p>
      <h3 className="mt-8 text-2xl font-semibold">Verification Document</h3>
      <p className="mt-2 text-sm text-slate-500">Order #N210948</p>
      <div className="mt-8 space-y-4 border-y py-6 text-sm">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">File</span>
          <span className="font-medium">{attachment.name}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Customer email</span>
          <span className="font-medium">odwascanio@gmail.com</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Received</span>
          <span className="font-medium">2026-08-18 09:18</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Review status</span>
          <span className="font-medium text-amber-700">Pending review</span>
        </div>
      </div>
      <p className="mt-8 text-sm leading-6 text-slate-600">
        This preview represents the verification attachment received in the customer email thread.
      </p>
    </div>
  );
}

function GenericAttachmentPreview({ attachment }: { attachment: TicketAttachment }) {
  return (
    <div className="flex min-h-64 w-full max-w-lg flex-col items-center justify-center border bg-white px-8 text-center shadow-sm">
      <FileText className="h-12 w-12 text-muted-foreground" />
      <p className="mt-4 max-w-full truncate text-sm font-semibold">{attachment.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {attachment.sizeLabel} · {attachment.mimeType}
      </p>
    </div>
  );
}

function getAttachmentPreviewUrl(attachment: TicketAttachment) {
  if (attachment.url) return attachment.url;
  if (attachment.id === "att-camera-setup") {
    return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop";
  }
  return undefined;
}

function RichTextEditor({
  value,
  disabled,
  placeholder,
  onChange,
}: {
  value: string;
  disabled: boolean;
  placeholder: string;
  onChange: (value: { html: string; text: string }) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const visuallyEmpty = !value.replace(/<[^>]+>/g, "").replace(/&nbsp;|\s/g, "");

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) editor.innerHTML = value;
  }, [value]);

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange({
      html: editor.innerHTML,
      text: editor.innerText.replace(/\u00a0/g, " ").trim(),
    });
  };

  const runCommand = (command: string, commandValue?: string) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const insertLink = () => {
    const href = window.prompt("输入链接地址", "https://");
    if (!href) return;
    runCommand("createLink", href);
  };

  return (
    <div className="mt-2 overflow-hidden rounded-md border bg-background">
      <div className="flex min-h-9 flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
        <select
          defaultValue="p"
          disabled={disabled}
          onChange={(event) => runCommand("formatBlock", event.target.value)}
          aria-label="段落样式"
          className="h-7 w-20 rounded border bg-background px-1.5 text-[11px] outline-none"
        >
          <option value="p">正文</option>
          <option value="h1">标题 1</option>
          <option value="h2">标题 2</option>
          <option value="h3">标题 3</option>
        </select>
        <select
          defaultValue="system-ui"
          disabled={disabled}
          onChange={(event) => runCommand("fontName", event.target.value)}
          aria-label="字体"
          className="h-7 w-24 rounded border bg-background px-1.5 text-[11px] outline-none"
        >
          <option value="system-ui">默认字体</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
        <ToolbarDivider />
        <EditorToolbarButton
          label="加粗"
          icon={<Bold className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("bold")}
        />
        <EditorToolbarButton
          label="斜体"
          icon={<Italic className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("italic")}
        />
        <EditorToolbarButton
          label="下划线"
          icon={<Underline className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("underline")}
        />
        <ToolbarDivider />
        <EditorToolbarButton
          label="左对齐"
          icon={<AlignLeft className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("justifyLeft")}
        />
        <EditorToolbarButton
          label="居中"
          icon={<AlignCenter className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("justifyCenter")}
        />
        <EditorToolbarButton
          label="右对齐"
          icon={<AlignRight className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("justifyRight")}
        />
        <ToolbarDivider />
        <EditorToolbarButton
          label="项目符号"
          icon={<List className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("insertUnorderedList")}
        />
        <EditorToolbarButton
          label="编号列表"
          icon={<ListOrdered className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("insertOrderedList")}
        />
        <EditorToolbarButton
          label="插入链接"
          icon={<Link2 className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={insertLink}
        />
        <ToolbarDivider />
        <EditorToolbarButton
          label="撤销"
          icon={<Undo2 className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("undo")}
        />
        <EditorToolbarButton
          label="重做"
          icon={<Redo2 className="h-3.5 w-3.5" />}
          disabled={disabled}
          onAction={() => runCommand("redo")}
        />
      </div>
      <div className="relative">
        {visuallyEmpty && (
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-label="邮件正文"
          aria-multiline="true"
          onInput={syncValue}
          onBlur={syncValue}
          className="scrollbar-thin min-h-24 max-h-44 overflow-y-auto px-3 py-2 text-sm leading-6 outline-none disabled:opacity-50 [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
    </div>
  );
}

function EditorToolbarButton({
  label,
  icon,
  disabled,
  onAction,
}: {
  label: string;
  icon: ReactNode;
  disabled: boolean;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onAction();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAction();
        }
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-0.5 h-5 w-px bg-border" />;
}

function EmailSignature({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "mt-2 grid grid-cols-2 overflow-hidden border border-dashed bg-background text-foreground",
        compact ? "max-w-xl text-[10px]" : "text-[11px]",
      )}
    >
      <div className="flex min-h-12 items-center border-b border-r px-3 font-semibold">
        Customer Service
      </div>
      <div className="flex min-h-12 flex-col justify-center gap-1 border-b px-3">
        <span className="inline-flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          service@neewer.com
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Globe2 className="h-3.5 w-3.5" />
          www.neewer.com
        </span>
      </div>
      <div className="flex min-h-14 items-center border-r px-3 text-2xl font-black tracking-normal">
        NEEWER
      </div>
      <div className="flex min-h-14 items-center justify-center gap-3 px-3">
        <Music2 className="h-4 w-4" aria-label="TikTok" />
        <Instagram className="h-4 w-4 text-pink-600" aria-label="Instagram" />
        <Youtube className="h-4 w-4 text-red-600" aria-label="YouTube" />
        <Facebook className="h-4 w-4 text-blue-700" aria-label="Facebook" />
        <Twitter className="h-4 w-4 text-sky-500" aria-label="X" />
      </div>
    </div>
  );
}

function ReadStatusPill({ unread }: { unread: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold",
        unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      {unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {unread ? "未读" : "已读"}
    </span>
  );
}

function ReplyStatusPill({ sent }: { sent: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold",
        sent ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground",
      )}
    >
      {sent ? "已发送" : "未发送"}
    </span>
  );
}

function SourcePill({ source, mailbox }: { source: SupportTicket["source"]; mailbox?: string }) {
  const isWidget = source === "web_widget";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium",
        isWidget ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
      )}
    >
      {isWidget ? <Inbox className="h-2.5 w-2.5" /> : <Mail className="h-2.5 w-2.5" />}
      {isWidget ? "工单留言" : formatMailboxSource(mailbox)}
    </span>
  );
}

function MessageSourcePill({ message }: { message: TicketThreadMessage }) {
  const isWidget = message.source === "web_widget";
  const mailbox = message.direction === "inbound" ? message.to : message.from;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium",
        isWidget ? "bg-primary/10 text-primary" : "bg-info/10 text-info",
      )}
    >
      {isWidget ? <Inbox className="h-2.5 w-2.5" /> : <Mail className="h-2.5 w-2.5" />}
      {isWidget ? "工单留言" : formatMailboxSource(mailbox)}
    </span>
  );
}

function formatMailboxSource(mailbox?: string) {
  const localPart = mailbox?.split("@")[0]?.trim();
  return localPart ? `${localPart} 邮箱` : "客服邮箱";
}

function parseTicketDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function sanitizeRichTextHtml(html: string) {
  if (!html.trim() || typeof DOMParser === "undefined") return "";
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const allowedTags = new Set([
    "A",
    "B",
    "BLOCKQUOTE",
    "BR",
    "DIV",
    "EM",
    "FONT",
    "H1",
    "H2",
    "H3",
    "I",
    "LI",
    "OL",
    "P",
    "SPAN",
    "STRONG",
    "U",
    "UL",
  ]);
  const allowedStyles = new Set([
    "background-color",
    "color",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "text-align",
    "text-decoration",
  ]);

  Array.from(documentNode.body.querySelectorAll("*")).forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (!["href", "style", "face", "color", "size"].includes(attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      if (!/^(https?:|mailto:)/i.test(href)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer noopener");
      }
    } else {
      element.removeAttribute("href");
    }

    const style = element.getAttribute("style");
    if (style) {
      const safeStyle = style
        .split(";")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) => {
          const [property, ...parts] = rule.split(":");
          const value = parts.join(":");
          return (
            allowedStyles.has(property.trim().toLowerCase()) &&
            !/(expression|javascript:|url\s*\()/i.test(value)
          );
        })
        .join("; ");
      if (safeStyle) element.setAttribute("style", safeStyle);
      else element.removeAttribute("style");
    }
  });

  return documentNode.body.innerHTML;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DemoTicketSubmission {
  id: string;
  createdAt: string;
  ticketId: string;
  ticket: {
    issueType: TicketIssueType;
    title: string;
    orderId: string;
    email: string;
    description: string;
    contact: string;
    attachments: TicketAttachment[];
  };
}

function ticketFromSubmission(submission: DemoTicketSubmission): SupportTicket {
  const submittedAt = formatDateTime(new Date(submission.createdAt));
  const email = submission.ticket.email.trim() || submission.ticket.contact.trim();
  return {
    id: submission.ticketId,
    issueType: submission.ticket.issueType,
    title: submission.ticket.title,
    description: submission.ticket.description,
    contact: email,
    attachments: submission.ticket.attachments,
    status: "new",
    priority: "normal",
    source: "web_widget",
    customerName: email.split("@")[0] || "网站访客",
    submittedAt,
    lastUpdatedAt: submittedAt,
    relatedOrderId: submission.ticket.orderId || undefined,
    replies: [],
    mailbox: "service@neewer.com",
    threadId: `TH-${submission.id}`,
    unread: true,
    messages: [
      {
        id: submission.id,
        direction: "inbound",
        source: "web_widget",
        from: email,
        to: "service@neewer.com",
        subject: submission.ticket.title,
        body: submission.ticket.description,
        sentAt: submittedAt,
        attachments: submission.ticket.attachments,
      },
    ],
  };
}
