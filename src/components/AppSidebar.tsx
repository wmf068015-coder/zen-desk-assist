import { Link, useLocation } from "@tanstack/react-router";
import { MessageSquare, BarChart3, Users, Settings, Headphones, FileText, Bell, Gauge, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "工作台", icon: MessageSquare },
  { to: "/capacity", label: "接待配置", icon: Gauge },
  { to: "/knowledge", label: "知识库", icon: BookOpen },
  { to: "/stats", label: "接待统计", icon: BarChart3 },
  { to: "/customers", label: "客户管理", icon: Users },
  { to: "/audit", label: "审计日志", icon: FileText },
  { to: "/settings", label: "设置", icon: Settings },
];

export function AppSidebar() {
  const { pathname } = useLocation();
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
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
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
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Agent"
          alt="agent"
          className="h-9 w-9 rounded-full ring-2 ring-primary-glow"
        />
      </div>
    </aside>
  );
}
