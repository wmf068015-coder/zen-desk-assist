import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SessionList } from "@/components/SessionList";
import { ChatPanel } from "@/components/ChatPanel";
import { CustomerPanel } from "@/components/CustomerPanel";
import {
  sessions as initialSessions,
  type BrowsingProduct,
  type Message,
  type Session,
} from "@/lib/mock-data";
import { toast } from "sonner";

const CUSTOMER_REMARK_PREFIX = "zen-desk-assist:customer-note:";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "客服工作台 — 智能客服系统" },
      {
        name: "description",
        content: "多渠道统一的客服接待工作台，支持AI协作、人工接管、会话筛选与接待管理。",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [sessions, setSessions] = useState(() => applyStoredCustomerRemarks(initialSessions));
  const [activeId, setActiveId] = useState(sessions[0].id);
  const [maxCapacity, setMaxCapacity] = useState(10);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];
  const revealedOrder = getRevealedOrder(active);

  const takeover = (id: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "human" as const,
              transferred: true,
              unread: 0,
              queued: false,
              messages: [
                ...s.messages,
                {
                  id: `sys${Date.now()}`,
                  sender: "system" as const,
                  type: "system" as const,
                  content: "已转接人工客服，由您继续为客户服务",
                  time: new Date().toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }
          : s,
      ),
    );
    toast.success("已成功开始接待", { description: "会话已转接人工客服" });
  };

  const end = (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "ended" as const } : s)));
    toast.success("会话已结束");
  };

  const suspendSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "suspended" as const,
              lastMessage: "会话已挂起",
              lastTime: "刚刚",
              messages: [
                ...s.messages,
                {
                  id: `sys${Date.now()}`,
                  sender: "system" as const,
                  type: "system" as const,
                  content: "会话已挂起，客服正在向其他同事确认问题",
                  time: new Date().toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }
          : s,
      ),
    );
    toast.success("会话已挂起", { description: "恢复后可继续回复客户" });
  };

  const resumeSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: "human" as const,
              lastMessage: "会话已恢复",
              lastTime: "刚刚",
              messages: [
                ...s.messages,
                {
                  id: `sys${Date.now()}`,
                  sender: "system" as const,
                  type: "system" as const,
                  content: "会话已恢复，客服继续处理",
                  time: new Date().toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }
          : s,
      ),
    );
    toast.success("会话已恢复");
  };

  const sendMessage = (id: string, content: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              lastMessage: content,
              lastTime: "刚刚",
              messages: [
                ...s.messages,
                {
                  id: `m${Date.now()}`,
                  sender: "agent" as const,
                  type: "text" as const,
                  content,
                  time: new Date().toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  senderName: "我",
                },
              ],
            }
          : s,
      ),
    );
  };

  const sendProduct = (id: string, product: BrowsingProduct) => {
    sendMessage(id, `为您推荐商品：${product.name}\n商品链接：${product.url}`);
    toast.success("商品已发送", { description: product.name });
    void publishProductToVisitorDemo(product).catch(() => {
      toast.error("访客端同步失败", { description: "请确认访客端 Demo 已启动" });
    });
  };

  const sendVideo = async (id: string, file: File) => {
    const mediaUrl = await readFileAsDataUrl(file);
    const message: Message = {
      id: `m${Date.now()}`,
      sender: "agent",
      senderName: "我",
      type: "video",
      content: mediaUrl,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      time: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === id
          ? {
              ...session,
              lastMessage: `[视频] ${file.name}`,
              lastTime: "刚刚",
              messages: [...session.messages, message],
            }
          : session,
      ),
    );
    toast.success("视频已发送", { description: file.name });

    try {
      await publishVideoToVisitorDemo({
        name: file.name,
        sizeLabel: formatFileSize(file.size),
        mimeType: file.type,
        dataUrl: mediaUrl,
      });
    } catch {
      toast.error("访客端同步失败", { description: "请确认访客端 Demo 已启动" });
    }
  };

  const recallMessage = (sessionId: string, messageId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const target = s.messages.find((m) => m.id === messageId);
        if (!target || target.sender === "system") return s;
        const latestMessage = [...s.messages].reverse().find((m) => m.sender !== "system");
        const messages = s.messages.map((m) =>
          m.id === messageId
            ? {
                id: m.id,
                sender: "system" as const,
                type: "system" as const,
                content: `${getMessageSenderLabel(m)}撤回了一条消息`,
                time: new Date().toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : m,
        );
        return {
          ...s,
          messages,
          ...(latestMessage?.id === messageId
            ? { lastMessage: "消息已撤回", lastTime: "刚刚" }
            : {}),
        };
      }),
    );
  };

  const exportSession = (id: string, messages?: Message[]) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    const exportMessages = messages ?? s.messages;
    const content = exportMessages
      .map(
        (m) =>
          `[${m.time}] ${m.senderName ?? (m.sender === "customer" ? s.customer.name : getMessageSenderLabel(m))}: ${getMessageContentText(m)}`,
      )
      .join("\n");
    const scope = messages ? `已选聊天记录（${messages.length} 条）` : "完整会话";
    const blob = new Blob(
      [
        `会话 ${s.id}\n客户: ${s.customer.name}\n开始时间: ${s.startTime}\n导出范围: ${scope}\n\n${content}`,
      ],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = messages ? `chat_${s.id}_selected.txt` : `chat_${s.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功", {
      description: messages ? `已导出 ${messages.length} 条聊天记录` : "已写入审计日志",
    });
  };

  const updateCustomerRemark = (customerId: string, remark: string) => {
    const nextName = remark.trim().slice(0, 30);
    const originalName = getOriginalCustomerName(customerId);
    const displayName = nextName || originalName;

    if (nextName) {
      window.localStorage.setItem(getCustomerRemarkKey(customerId), nextName);
    } else {
      window.localStorage.removeItem(getCustomerRemarkKey(customerId));
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.customer.id === customerId
          ? {
              ...s,
              customer: {
                ...s.customer,
                name: displayName,
              },
            }
          : s,
      ),
    );
    toast.success(nextName ? "用户备注已更新" : "用户备注已清除", {
      description: nextName ? "用户名称已按备注显示" : "已恢复原用户名称",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <SessionList
        sessions={sessions}
        activeId={active.id}
        onSelect={setActiveId}
        maxCapacity={maxCapacity}
        onCapacityChange={setMaxCapacity}
      />
      <ChatPanel
        session={active}
        onTakeover={takeover}
        onEnd={end}
        onSuspend={suspendSession}
        onResume={resumeSession}
        onSendMessage={sendMessage}
        onSendVideo={sendVideo}
        onExport={exportSession}
        onRecallMessage={recallMessage}
        onUpdateCustomerRemark={updateCustomerRemark}
      />
      <CustomerPanel
        key={active.id}
        customer={active.customer}
        sessionId={active.id}
        revealedOrder={revealedOrder}
        canSend={
          active.status !== "ended" &&
          active.status !== "timeout" &&
          active.status !== "suspended"
        }
        onSendProduct={(product) => sendProduct(active.id, product)}
      />
    </div>
  );
}

function getRevealedOrder(session: Session) {
  const fields = session.visitorForms?.flatMap((form) => form.fields) ?? [];
  const orderIdFromForm = [...fields]
    .reverse()
    .find((field) => field.slot === "order_id" && field.value.trim())
    ?.value.trim();
  const emailFromForm = [...fields]
    .reverse()
    .find((field) => field.slot === "email" && field.value.trim())
    ?.value.trim();
  const customerMessages = session.messages
    .filter((message) => message.sender === "customer")
    .map((message) => message.content)
    .join("\n");
  const orderId = orderIdFromForm ?? customerMessages.match(/\b[A-Z]\d{6,}\b/i)?.[0];
  const email =
    emailFromForm ??
    customerMessages.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

  return orderId && email ? { orderId, email } : undefined;
}

function applyStoredCustomerRemarks(sessionList: typeof initialSessions) {
  if (typeof window === "undefined") return sessionList;
  return sessionList.map((session) => {
    const storedRemark = window.localStorage
      .getItem(getCustomerRemarkKey(session.customer.id))
      ?.trim();
    if (!storedRemark) return session;
    return {
      ...session,
      customer: {
        ...session.customer,
        name: storedRemark.slice(0, 30),
      },
    };
  });
}

function getCustomerRemarkKey(customerId: string) {
  return `${CUSTOMER_REMARK_PREFIX}${customerId}`;
}

function getOriginalCustomerName(customerId: string) {
  return (
    initialSessions.find((session) => session.customer.id === customerId)?.customer.name ??
    "未命名客户"
  );
}

function getMessageSenderLabel(message: Message) {
  if (message.sender === "customer") return "客户";
  if (message.sender === "ai") return "AI助手";
  return message.senderName ?? "客服";
}

function getMessageContentText(message: Message) {
  if (message.type === "image") return `[图片] ${message.content}`;
  if (message.type === "video")
    return `[视频] ${message.fileName ?? message.content}${message.fileSize ? ` (${message.fileSize})` : ""}`;
  if (message.type === "file")
    return `[文件] ${message.fileName ?? message.content}${message.fileSize ? ` (${message.fileSize})` : ""}`;
  return message.content;
}

async function publishProductToVisitorDemo(product: BrowsingProduct) {
  if (!import.meta.env.DEV) return;
  const response = await fetch("http://127.0.0.1:5174/api/demo-product-messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  if (!response.ok) throw new Error("Failed to publish product to visitor demo");
}

async function publishVideoToVisitorDemo(video: {
  name: string;
  sizeLabel: string;
  mimeType: string;
  dataUrl: string;
}) {
  if (!import.meta.env.DEV) return;
  const response = await fetch("http://127.0.0.1:5174/api/demo-video-messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video }),
  });
  if (!response.ok) throw new Error("Failed to publish video to visitor demo");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read video"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
