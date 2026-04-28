import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SessionList } from "@/components/SessionList";
import { ChatPanel } from "@/components/ChatPanel";
import { CustomerPanel } from "@/components/CustomerPanel";
import { sessions as initialSessions } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "客服工作台 — 智能客服系统" },
      { name: "description", content: "多渠道统一的客服接待工作台，支持AI协作、人工接管、会话筛选与接待管理。" },
    ],
  }),
  component: Index,
});

function Index() {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeId, setActiveId] = useState(sessions[0].id);
  const [maxCapacity, setMaxCapacity] = useState(10);

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0];

  const takeover = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "human" as const, transferred: true, unread: 0 } : s))
    );
    toast.success("已成功接管会话", { description: "现在由您与客户对话" });
  };

  const end = (id: string) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "ended" as const } : s)));
    toast.success("会话已结束");
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
                  time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
                  senderName: "我",
                },
              ],
            }
          : s
      )
    );
  };

  const exportSession = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    const content = s.messages
      .map((m) => `[${m.time}] ${m.senderName ?? (m.sender === "customer" ? s.customer.name : "客服")}: ${m.content}`)
      .join("\n");
    const blob = new Blob([`会话 ${s.id}\n客户: ${s.customer.name}\n开始时间: ${s.startTime}\n\n${content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_${s.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("导出成功", { description: "已写入审计日志" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <SessionList
        activeId={active.id}
        onSelect={setActiveId}
        maxCapacity={maxCapacity}
        onCapacityChange={setMaxCapacity}
      />
      <ChatPanel
        session={active}
        onTakeover={takeover}
        onEnd={end}
        onSendMessage={sendMessage}
        onExport={exportSession}
      />
      <CustomerPanel customer={active.customer} />
    </div>
  );
}
