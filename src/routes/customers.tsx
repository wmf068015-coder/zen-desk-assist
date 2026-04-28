import { createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/AppSidebar";
import { sessions, CHANNEL_LABELS } from "@/lib/mock-data";
import { Search, Crown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "客户管理 — 智能客服系统" },
      { name: "description", content: "查看并管理客户档案，包含联系方式、订单和历史会话。" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [q, setQ] = useState("");
  const customers = sessions.map((s) => s.customer);
  const filtered = customers.filter((c) => !q || c.name.includes(q) || c.phone.includes(q));

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">客户管理</h1>
              <p className="mt-1 text-sm text-muted-foreground">共 {filtered.length} 位客户</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索客户"
                className="h-9 w-64 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="rounded-2xl border bg-gradient-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <img src={c.avatar} className="h-12 w-12 rounded-full bg-muted" alt="" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate font-semibold">{c.name}</h3>
                      {c.vipLevel && <Crown className="h-3.5 w-3.5 text-warning" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">渠道</p>
                    <p className="text-xs font-medium">{CHANNEL_LABELS[c.channel]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">订单</p>
                    <p className="text-xs font-medium">{c.orders.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">会话</p>
                    <p className="text-xs font-medium">{c.historySessions.length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
