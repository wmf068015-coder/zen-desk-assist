import { useState, useRef, useEffect } from "react";
import type { Session, Message } from "@/lib/mock-data";
import { quickReplies } from "@/lib/mock-data";
import { knowledgeStore } from "@/lib/knowledge-store";
import { StatusBadge, TagBadge, ChannelIcon } from "./StatusBadge";
import {
  Bot,
  User,
  Paperclip,
  Image as ImageIcon,
  Send,
  Zap,
  UserCheck,
  XCircle,
  Download,
  MoreVertical,
  FileText,
  Sparkles,
  ArrowRightLeft,
  BookOpen,
  BookPlus,
  Copy,
  Undo2,
  CheckSquare,
  Pencil,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  session: Session;
  onTakeover: (id: string) => void;
  onEnd: (id: string) => void;
  onSuspend: (id: string) => void;
  onResume: (id: string) => void;
  onSendMessage: (id: string, content: string) => void;
  onExport: (id: string, messages?: Message[]) => void;
  onRecallMessage: (sessionId: string, messageId: string) => void;
  onUpdateCustomerRemark: (customerId: string, remark: string) => void;
}

export function ChatPanel({
  session,
  onTakeover,
  onEnd,
  onSuspend,
  onResume,
  onSendMessage,
  onExport,
  onRecallMessage,
  onUpdateCustomerRemark,
}: Props) {
  const [input, setInput] = useState("");
  const [showQuick, setShowQuick] = useState(false);
  const [showAiHistory, setShowAiHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const [actionMessageId, setActionMessageId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length, session.id]);

  useEffect(() => {
    setActionMessageId(null);
    setSelectionMode(false);
    setSelectedMessageIds([]);
  }, [session.id]);

  const send = () => {
    if (!input.trim()) return;
    onSendMessage(session.id, input.trim());
    setInput("");
  };

  const canInput =
    session.status !== "ended" && session.status !== "timeout" && session.status !== "suspended";
  const selectableMessages = session.messages.filter((m) => m.sender !== "system");
  const selectedMessages = selectableMessages.filter((m) => selectedMessageIds.includes(m.id));

  const updateCustomerRemark = () => {
    const remark = window.prompt("修改用户备注名称（留空恢复原名）", session.customer.name);
    if (remark === null) return;
    onUpdateCustomerRemark(session.customer.id, remark);
  };

  const toggleMessageSelection = (id: string) => {
    setSelectedMessageIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const openMessageActions = (id: string) => {
    setActionMessageId(id);
    setSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const startMultiSelect = (id: string) => {
    setActionMessageId(null);
    setSelectionMode(true);
    setSelectedMessageIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  };

  const closeMessageActions = () => {
    setActionMessageId(null);
    setSelectionMode(false);
    setSelectedMessageIds([]);
  };

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-message-interactive]")) return;
    if (actionMessageId || selectionMode) closeMessageActions();
  };

  const copyMessage = async (message: Message) => {
    const text = getMessageContentText(message);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制消息内容");
    } catch {
      window.prompt("复制消息内容", text);
    }
    closeMessageActions();
  };

  const recallMessage = (message: Message) => {
    onRecallMessage(session.id, message.id);
    toast.success("消息已撤回");
    closeMessageActions();
  };

  const exportSelectedMessages = () => {
    if (selectedMessages.length === 0) {
      toast.warning("请先选择聊天记录");
      return;
    }
    onExport(session.id, selectedMessages);
    closeMessageActions();
  };

  const addSelectedToKnowledge = () => {
    if (selectedMessages.length === 0) {
      toast.warning("请先长按消息选择聊天记录");
      return;
    }
    const title = window.prompt("知识标题", session.aiSummary?.intent ?? `来自会话 ${session.id}`);
    if (!title) return;
    const content = window.prompt(
      "知识正文（已带入选中的聊天记录，可继续整理）",
      selectedMessages.map(formatKnowledgeMessage).join("\n"),
    );
    if (!content) return;
    knowledgeStore.add({
      title: title.slice(0, 120),
      category: "会话沉淀",
      summary: content.slice(0, 80),
      content: content.slice(0, 5000),
      tags: session.tags,
      source: "session",
      sourceSessionId: session.id,
      submittedBy: "客服小美",
      status: "pending",
    });
    closeMessageActions();
    toast.success("已提交审核", {
      description: `已导入 ${selectedMessages.length} 条聊天记录，等待后台管理员审核`,
    });
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-background" onClick={handlePanelClick}>
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={session.customer.avatar} className="h-10 w-10 rounded-full bg-muted" alt="" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{session.customer.name}</h3>
              <button
                onClick={updateCustomerRemark}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                title="修改用户备注名称"
              >
                <Pencil className="h-3 w-3" />
                修改备注
              </button>
              <ChannelIcon
                channel={session.channel}
                className="h-3.5 w-3.5 text-muted-foreground"
              />
              <StatusBadge status={session.status} />
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span>会话 {session.id}</span>
              <span>·</span>
              <span>{session.startTime} 开始</span>
              {session.tags.length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex gap-1">
                    {session.tags.map((t) => (
                      <TagBadge key={t} tag={t} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiHistory((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              showAiHistory
                ? "bg-status-ai/15 text-status-ai"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            AI 历史
          </button>
          {session.aiSummary && (
            <button
              onClick={() => setShowSummary((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                showSummary ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI 摘要
            </button>
          )}
          {session.status === "human" && (
            <Link
              to="/knowledge"
              search={{ sessionId: session.id, q: undefined }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              title="进入知识库"
            >
              <BookOpen className="h-3.5 w-3.5" />
              知识库
            </Link>
          )}
          {session.status === "human" && (
            <button
              onClick={addSelectedToKnowledge}
              className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/10"
              title="将选中的聊天记录沉淀为知识"
            >
              <BookPlus className="h-3.5 w-3.5" />
              添加到知识库{selectedMessages.length > 0 ? `(${selectedMessages.length})` : ""}
            </button>
          )}
          {session.status !== "human" && canInput && (
            <button
              onClick={() => onTakeover(session.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              <UserCheck className="h-3.5 w-3.5" />
              开始接待
            </button>
          )}
          {session.status === "human" && (
            <button
              onClick={() => onSuspend(session.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning-foreground hover:bg-warning/15"
            >
              <PauseCircle className="h-3.5 w-3.5" />
              挂起会话
            </button>
          )}
          {session.status === "suspended" && (
            <button
              onClick={() => onResume(session.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              恢复会话
            </button>
          )}
          {session.status === "human" && (
            <button
              onClick={() => onEnd(session.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" />
              结束会话
            </button>
          )}
          <button
            onClick={() => onExport(session.id)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            title="导出"
          >
            <Download className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AI Summary */}
      {showSummary && session.aiSummary && (
        <div className="border-b bg-gradient-to-r from-primary/5 via-status-ai/5 to-transparent px-6 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3 rounded-xl border border-status-ai/20 bg-card/70 p-3 shadow-sm backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-status-ai/15">
                <Sparkles className="h-4 w-4 text-status-ai" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">AI 摘要总结</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      session.aiSummary.sentiment === "positive" && "bg-success/15 text-success",
                      session.aiSummary.sentiment === "negative" &&
                        "bg-destructive/15 text-destructive",
                      session.aiSummary.sentiment === "neutral" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {session.aiSummary.sentiment === "positive"
                      ? "积极"
                      : session.aiSummary.sentiment === "negative"
                        ? "负面"
                        : "中性"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium">{session.aiSummary.intent}</p>
                <ul className="mt-1.5 space-y-0.5">
                  {session.aiSummary.keyPoints.map((k, i) => (
                    <li key={i} className="text-xs text-muted-foreground">
                      • {k}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 rounded-md bg-primary/5 px-2 py-1 text-xs text-primary">
                  <b>建议：</b>
                  {session.aiSummary.suggestedAction}
                </p>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-muted-foreground hover:text-foreground"
                title="收起"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {selectionMode && (
            <div
              className="sticky top-0 z-10 flex items-center justify-between rounded-lg border bg-card/95 px-3 py-2 text-xs shadow-sm backdrop-blur"
              data-message-interactive
            >
              <span className="font-medium text-success">
                已选择 {selectedMessages.length} 条聊天记录
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportSelectedMessages}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 font-medium text-primary hover:bg-primary/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  导出聊天记录
                </button>
                <button
                  onClick={() => setSelectedMessageIds(selectableMessages.map((m) => m.id))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  全选
                </button>
                <button
                  onClick={closeMessageActions}
                  className="text-muted-foreground hover:text-foreground"
                >
                  清空
                </button>
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
              今天 {session.startTime}
            </span>
          </div>
          {session.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              highlight={showAiHistory && m.sender === "ai"}
              selected={selectedMessageIds.includes(m.id)}
              actionOpen={actionMessageId === m.id}
              selectionMode={selectionMode}
              onToggleSelect={m.sender === "system" ? undefined : toggleMessageSelection}
              onLongPress={m.sender === "system" ? undefined : openMessageActions}
              onCopy={copyMessage}
              onRecall={recallMessage}
              onStartMultiSelect={startMultiSelect}
            />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* Quick replies */}
      {showQuick && (
        <div className="max-h-56 overflow-y-auto border-t bg-muted/30 p-3 scrollbar-thin">
          <div className="mx-auto max-w-3xl space-y-3">
            {["常用话术", "政策说明", "链接素材", "图片素材"].map((cat) => {
              const items = quickReplies.filter((q) => q.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          setInput(q.content);
                          setShowQuick(false);
                        }}
                        className="rounded-lg border bg-card px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                      >
                        {q.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center gap-1">
            <IconBtn icon={<ImageIcon className="h-4 w-4" />} label="图片" />
            <IconBtn icon={<Paperclip className="h-4 w-4" />} label="文件" />
            <button
              onClick={() => setShowQuick((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors",
                showQuick ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              快捷回复
            </button>
          </div>
          <div className="flex items-end gap-2 rounded-xl border bg-background p-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={!canInput}
              rows={2}
              placeholder={
                session.status === "suspended"
                  ? "会话已挂起，恢复后继续回复"
                  : canInput
                    ? "输入消息，Enter 发送，Shift+Enter 换行"
                    : "会话已结束"
              }
              className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || !canInput}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
      title={label}
    >
      {icon}
    </button>
  );
}

function formatKnowledgeMessage(message: Message) {
  const sender = getMessageSenderLabel(message);
  if (message.type === "image") return `[${message.time} ${sender}] [图片] ${message.content}`;
  if (message.type === "file")
    return `[${message.time} ${sender}] [文件] ${message.fileName ?? message.content}${message.fileSize ? ` (${message.fileSize})` : ""}`;
  return `[${message.time} ${sender}] ${message.content}`;
}

function getMessageSenderLabel(message: Message) {
  return message.sender === "customer"
    ? "客户"
    : (message.senderName ?? (message.sender === "ai" ? "AI助手" : "客服"));
}

function getMessageContentText(message: Message) {
  if (message.type === "image") return `[图片] ${message.content}`;
  if (message.type === "file")
    return `[文件] ${message.fileName ?? message.content}${message.fileSize ? ` (${message.fileSize})` : ""}`;
  return message.content;
}

function MessageBubble({
  message,
  highlight,
  selected,
  actionOpen,
  selectionMode,
  onToggleSelect,
  onLongPress,
  onCopy,
  onRecall,
  onStartMultiSelect,
}: {
  message: Message;
  highlight?: boolean;
  selected?: boolean;
  actionOpen?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
  onCopy?: (message: Message) => void;
  onRecall?: (message: Message) => void;
  onStartMultiSelect?: (id: string) => void;
}) {
  const isCustomer = message.sender === "customer";
  const isAi = message.sender === "ai";
  const isSystem = message.sender === "system";
  const selectable = Boolean(onToggleSelect);
  const longPressTimer = useRef<number | undefined>(undefined);
  const suppressNextClick = useRef(false);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  };

  const startLongPress = () => {
    if (!selectable || selectionMode) return;
    cancelLongPress();
    longPressTimer.current = window.setTimeout(() => {
      suppressNextClick.current = true;
      onLongPress?.(message.id);
      longPressTimer.current = undefined;
    }, 550);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
          <ArrowRightLeft className="h-3 w-3" />
          {message.content}
          <span className="text-primary/60">· {message.time}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex gap-2", isCustomer ? "justify-start" : "justify-end")}
      data-message-interactive
    >
      {selectionMode && selectable && isCustomer && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(message.id)}
          className="mt-7 h-4 w-4 shrink-0 accent-success"
          aria-label="选择聊天记录"
        />
      )}
      {isCustomer && (
        <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn("max-w-[70%] space-y-1", !isCustomer && "items-end")}>
        <div
          className={cn(
            "flex items-center gap-1.5 text-[11px] text-muted-foreground",
            !isCustomer && "justify-end",
          )}
        >
          {isAi && <Bot className="h-3 w-3 text-status-ai" />}
          <span>{isCustomer ? "客户" : (message.senderName ?? "客服")}</span>
          <span>·</span>
          <span>{message.time}</span>
        </div>
        <div
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onPointerMove={cancelLongPress}
          onClick={() => {
            if (suppressNextClick.current) {
              suppressNextClick.current = false;
              return;
            }
            if (selectionMode) onToggleSelect?.(message.id);
          }}
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
            isCustomer && "rounded-tl-sm bg-card border",
            isAi && "rounded-tr-sm bg-status-ai/10 text-foreground border border-status-ai/20",
            !isCustomer && !isAi && "rounded-tr-sm bg-gradient-primary text-primary-foreground",
            highlight && "ring-2 ring-status-ai/40",
            actionOpen && "ring-2 ring-primary/40",
            selected && "ring-2 ring-success/60",
            selectable && !selectionMode && "cursor-pointer select-none",
            selectionMode && selectable && "cursor-pointer",
          )}
        >
          {message.type === "text" && (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          )}
          {message.type === "image" && (
            <img src={message.content} className="max-w-xs rounded-lg" alt="" />
          )}
          {message.type === "file" && (
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <div>
                <p className="font-medium">{message.fileName}</p>
                <p className="text-xs opacity-70">{message.fileSize}</p>
              </div>
            </div>
          )}
        </div>
        {actionOpen && selectable && (
          <div className={cn("flex flex-wrap gap-1.5", !isCustomer && "justify-end")}>
            <MessageActionButton
              icon={<Copy className="h-3.5 w-3.5" />}
              label="复制"
              onClick={() => onCopy?.(message)}
            />
            <MessageActionButton
              icon={<Undo2 className="h-3.5 w-3.5" />}
              label="撤回"
              onClick={() => onRecall?.(message)}
            />
            <MessageActionButton
              icon={<CheckSquare className="h-3.5 w-3.5" />}
              label="多选"
              onClick={() => onStartMultiSelect?.(message.id)}
            />
          </div>
        )}
      </div>
      {!isCustomer && (
        <div
          className={cn(
            "h-8 w-8 shrink-0 rounded-full flex items-center justify-center",
            isAi ? "bg-status-ai/15" : "bg-gradient-primary",
          )}
        >
          {isAi ? (
            <Bot className="h-4 w-4 text-status-ai" />
          ) : (
            <User className="h-4 w-4 text-primary-foreground" />
          )}
        </div>
      )}
      {selectionMode && selectable && !isCustomer && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(message.id)}
          className="mt-7 h-4 w-4 shrink-0 accent-success"
          aria-label="选择聊天记录"
        />
      )}
    </div>
  );
}

function MessageActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:border-primary/40 hover:text-primary"
    >
      {icon}
      {label}
    </button>
  );
}
