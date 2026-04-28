import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { quickReplies } from "@/lib/mock-data";
import { Zap, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "设置 — 智能客服系统" },
      { name: "description", content: "管理快捷回复、接待偏好和个人账号设置。" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const grouped = quickReplies.reduce<Record<string, typeof quickReplies>>((acc, q) => {
    (acc[q.category] ||= []).push(q);
    return acc;
  }, {});

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <SettingsIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">设置</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">管理您的快捷回复和接待偏好</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">快捷回复库</h2>
            </div>
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h3>
                  <div className="space-y-2">
                    {items.map((q) => (
                      <div key={q.id} className="rounded-xl border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{q.title}</p>
                          <span className="text-[10px] text-muted-foreground">{q.id}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{q.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
