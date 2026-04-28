import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { auditLogs } from "@/lib/mock-data";
import { FileText, Shield } from "lucide-react";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "审计日志 — 智能客服系统" },
      { name: "description", content: "查看客服导出操作的完整审计记录，保障数据安全合规。" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">审计日志</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">所有聊天记录导出操作将被自动记录</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left">操作人</th>
                  <th className="px-5 py-3 text-left">操作</th>
                  <th className="px-5 py-3 text-left">对象</th>
                  <th className="px-5 py-3 text-left">时间</th>
                  <th className="px-5 py-3 text-left">IP 地址</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium">{log.agent}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <FileText className="h-3 w-3" />{log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{log.target}</td>
                    <td className="px-5 py-4 font-mono text-xs">{log.time}</td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            仅显示最近 30 天的记录 · 共 {auditLogs.length} 条
          </p>
        </div>
      </div>
    </div>
  );
}
