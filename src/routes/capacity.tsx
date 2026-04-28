import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { sessions as allSessions } from "@/lib/mock-data";
import { StatusBadge, ChannelIcon, TagBadge } from "@/components/StatusBadge";
import { Gauge, Users, Clock, ArrowRight, Minus, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/capacity")({
  head: () => ({
    meta: [
      { title: "接待配置 — 智能客服系统" },
      { name: "description", content: "管理当前接待状态、最大接待人数、查看接待中与排队中的会话。" },
    ],
  }),
  component: CapacityPage,
});

function CapacityPage() {
  const [maxCapacity, setMaxCapacity] = useState(5);
  const [tab, setTab] = useState<"serving" | "queue">("serving");

  const serving = useMemo(
    () => allSessions.filter((s) => s.status === "human" && !s.queued),
    []
  );
  const queued = useMemo(
    () => allSessions.filter((s) => s.queued || (s.status === "waiting")),
    []
  );

  const usage = Math.min(100, (serving.length / maxCapacity) * 100);
  const isFull = serving.length >= maxCapacity;

  const list = tab === "serving" ? serving : queued;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Gauge className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">接待配置</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">管理您的接待上限并查看当前接待与排队状态</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="接待中"
              value={serving.length}
              hint={`上限 ${maxCapacity}`}
              accent="success"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="排队中"
              value={queued.length}
              hint={queued.length > 0 ? "等待人工接入" : "暂无排队"}
              accent="warning"
            />
            <StatCard
              icon={<Gauge className="h-5 w-5" />}
              label="使用率"
              value={`${Math.round(usage)}%`}
              hint={isFull ? "已满载，新会话将进入排队" : "可继续接待"}
              accent={isFull ? "destructive" : "primary"}
            />
          </div>

          {/* Max capacity setting */}
          <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">最大接待人数</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  超过最大接待人数的新会话将自动进入排队，或由 AI 继续接待
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaxCapacity((v) => Math.max(1, v - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 w-16 rounded-lg border bg-background text-center text-base font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={() => setMaxCapacity((v) => Math.min(50, v + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toast.success("接待上限已更新", { description: `最大接待人数：${maxCapacity}` })}
                  className="ml-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                >
                  保存
                </button>
              </div>
            </div>
            {/* Progress */}
            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>当前负载 {serving.length} / {maxCapacity}</span>
                <span className={cn(isFull && "text-destructive font-medium")}>
                  {isFull ? "已达上限" : `还可接待 ${maxCapacity - serving.length} 位客户`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFull ? "bg-destructive" : usage > 70 ? "bg-status-waiting" : "bg-gradient-primary"
                  )}
                  style={{ width: `${usage}%` }}
                />
              </div>
            </div>
            {isFull && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>您已达到接待上限，新进会话将进入排队或由 AI 继续接待。如需接入更多会话，请适当调高上限或结束部分已完成会话。</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center gap-1 border-b p-2">
              <TabBtn active={tab === "serving"} onClick={() => setTab("serving")} label="接待中" count={serving.length} />
              <TabBtn active={tab === "queue"} onClick={() => setTab("queue")} label="排队中" count={queued.length} />
            </div>

            <div className="divide-y">
              {list.length === 0 && (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  {tab === "serving" ? "当前没有接待中的会话" : "当前没有排队中的会话"}
                </div>
              )}
              {list.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40">
                  {tab === "queue" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-waiting/15 text-xs font-bold text-status-waiting">
                      {idx + 1}
                    </div>
                  )}
                  <img src={s.customer.avatar} className="h-10 w-10 shrink-0 rounded-full bg-muted" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{s.customer.name}</span>
                      <ChannelIcon channel={s.channel} className="h-3 w-3 text-muted-foreground" />
                      <StatusBadge status={s.status} />
                      {s.tags.slice(0, 1).map((t) => <TagBadge key={t} tag={t} />)}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{s.lastMessage}</p>
                  </div>
                  <div className="hidden text-right md:block">
                    <div className="text-xs text-muted-foreground">
                      {tab === "serving" ? "已接待" : "已等待"}
                    </div>
                    <div className="text-sm font-medium">
                      {tab === "serving"
                        ? s.lastTime
                        : s.waitingSeconds
                          ? `${Math.floor(s.waitingSeconds / 60)}分${s.waitingSeconds % 60}秒`
                          : s.lastTime}
                    </div>
                  </div>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                  >
                    查看 <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint: string;
  accent: "success" | "warning" | "destructive" | "primary";
}) {
  const colorMap = {
    success: "bg-success/15 text-success",
    warning: "bg-status-waiting/15 text-status-waiting",
    destructive: "bg-destructive/15 text-destructive",
    primary: "bg-primary/15 text-primary",
  };
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", colorMap[accent])}>
          {icon}
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function TabBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          active ? "bg-white/20 text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}
