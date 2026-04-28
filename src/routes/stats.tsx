import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { stats } from "@/lib/mock-data";
import { TrendingUp, MessageSquare, CheckCircle2, XCircle, Clock, Timer, Hourglass, Smile, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "接待统计 — 智能客服系统" },
      { name: "description", content: "查看客服接待的实时数据指标：总会话数、响应时间、会话时长和渠道分布。" },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const maxTrend = Math.max(...stats.trend.map((t) => t.total));
  const maxChannel = Math.max(...stats.channelDist.map((c) => c.count));

  const cards = [
    { label: "总会话数", value: stats.totalSessions, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
    { label: "有效会话", value: stats.validSessions, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "未接待数", value: stats.missedSessions, icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "满意度", value: `${stats.satisfaction}%`, icon: Smile, color: "text-warning", bg: "bg-warning/15" },
    { label: "平均响应时间", value: stats.avgResponseTime, icon: Clock, color: "text-info", bg: "bg-info/10" },
    { label: "平均接待时长", value: stats.avgHandleTime, icon: Timer, color: "text-status-ai", bg: "bg-status-ai/10" },
    { label: "平均会话时长", value: stats.avgSessionDuration, icon: Hourglass, color: "text-primary-glow", bg: "bg-primary-glow/10" },
    { label: "接待人效", value: "112/人", icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  ];

  const exportAll = () => {
    const csv = ["指标,数值", ...cards.map((c) => `${c.label},${c.value}`)].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats_export.csv";
    a.click();
    toast.success("导出成功", { description: "已写入审计日志" });
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">接待统计</h1>
              <p className="mt-1 text-sm text-muted-foreground">过去 7 天的客服接待数据概览</p>
            </div>
            <button
              onClick={exportAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Download className="h-4 w-4" />导出报表
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="rounded-2xl border bg-gradient-card p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold">{c.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold">7日会话趋势</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">总会话数 vs 有效会话</p>
              <div className="mt-6 flex h-56 items-end gap-4">
                {stats.trend.map((t) => (
                  <div key={t.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end gap-1">
                      <div
                        className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary-glow transition-all hover:opacity-80"
                        style={{ height: `${(t.total / maxTrend) * 100}%` }}
                        title={`总数: ${t.total}`}
                      />
                      <div
                        className="flex-1 rounded-t-md bg-success/70 transition-all hover:opacity-80"
                        style={{ height: `${(t.valid / maxTrend) * 100}%` }}
                        title={`有效: ${t.valid}`}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{t.day}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-gradient-primary" />总会话</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-success/70" />有效会话</div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold">渠道分布</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">各渠道接入会话占比</p>
              <div className="mt-6 space-y-4">
                {stats.channelDist.map((c) => (
                  <div key={c.channel}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{c.channel}</span>
                      <span className="text-muted-foreground">{c.count} 条</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all"
                        style={{ width: `${(c.count / maxChannel) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
