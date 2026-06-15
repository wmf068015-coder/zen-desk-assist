import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  MessageSquare,
  BarChart3,
  Settings,
  Headphones,
  FileText,
  Bell,
  Gauge,
  BookOpen,
  Inbox,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "工作台", icon: MessageSquare },
  { to: "/tickets", label: "工单", icon: Inbox },
  { to: "/capacity", label: "接待配置", icon: Gauge },
  { to: "/knowledge", label: "知识库", icon: BookOpen },
  { to: "/stats", label: "接待统计", icon: BarChart3 },
  { to: "/audit", label: "审计日志", icon: FileText },
  { to: "/settings", label: "设置", icon: Settings },
];

const agentStatuses = [
  { value: "idle", label: "空闲", dot: "bg-success" },
  { value: "busy", label: "繁忙", dot: "bg-warning" },
  { value: "offline", label: "离线", dot: "bg-muted-foreground" },
] as const;

export function AppSidebar() {
  const { pathname } = useLocation();
  const [agentStatus, setAgentStatus] = useState<(typeof agentStatuses)[number]["value"]>("idle");
  const [showAgentStatus, setShowAgentStatus] = useState(false);
  const currentAgentStatus = agentStatuses.find((status) => status.value === agentStatus) ?? agentStatuses[0];

  return (
    <aside className="flex h-screen w-[72px] flex-col items-center bg-gradient-sidebar text-sidebar-foreground shadow-elegant">
      <div className="flex h-16 w-full items-center justify-center border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Headphones className="h-5 w-5 text-white" />
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-2">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group relative flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              {active && <span className="absolute left-0 h-6 w-0.5 rounded-r bg-primary-glow" />}
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mb-3 flex flex-col items-center gap-3">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent/50">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </button>
        <div className="relative">
          {showAgentStatus && (
            <div className="absolute bottom-0 left-[calc(100%+0.5rem)] z-20 w-28 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg">
              {agentStatuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setAgentStatus(status.value);
                    setShowAgentStatus(false);
                  }}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-lg px-2 text-xs font-medium transition-colors",
                    agentStatus === status.value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                  {status.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowAgentStatus((value) => !value)}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              showAgentStatus && "bg-sidebar-accent/60 text-sidebar-accent-foreground",
            )}
            title={`客服状态：${currentAgentStatus.label}`}
          >
            <User className="h-4 w-4" />
            <span
              className={cn(
                "absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar",
                currentAgentStatus.dot,
              )}
            />
          </button>
        </div>
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Agent"
          alt="agent"
          className="h-9 w-9 rounded-full ring-2 ring-primary-glow"
        />
      </div>
    </aside>
  );
}
