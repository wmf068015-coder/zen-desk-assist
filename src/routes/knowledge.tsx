import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { knowledgeBase } from "@/lib/mock-data";
import { BookOpen, Search, Eye, Calendar, Tag, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/knowledge")({
  validateSearch: (s: Record<string, unknown>) => ({
    sessionId: typeof s.sessionId === "string" ? s.sessionId : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "知识库 — 智能客服系统" },
      { name: "description", content: "客服知识库：产品手册、政策、话术与故障排查。" },
    ],
  }),
  component: KnowledgePage,
});

function KnowledgePage() {
  const { sessionId, q: initialQ } = useSearch({ from: "/knowledge" });
  const [q, setQ] = useState(initialQ ?? "");
  const [activeCat, setActiveCat] = useState<string>("全部");
  const [activeId, setActiveId] = useState<string>(knowledgeBase[0].id);

  const cats = useMemo(() => ["全部", ...Array.from(new Set(knowledgeBase.map((a) => a.category)))], []);
  const filtered = useMemo(() => {
    return knowledgeBase.filter((a) => {
      if (activeCat !== "全部" && a.category !== activeCat) return false;
      if (q && !(a.title.includes(q) || a.summary.includes(q) || a.tags.some((t) => t.includes(q)))) return false;
      return true;
    });
  }, [q, activeCat]);

  const active = knowledgeBase.find((a) => a.id === activeId) ?? filtered[0] ?? knowledgeBase[0];

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="flex w-[360px] flex-col border-r bg-card">
          <div className="border-b p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold">知识库</h1>
                <p className="text-[11px] text-muted-foreground">{knowledgeBase.length} 篇文档</p>
              </div>
              {sessionId && (
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <ArrowLeft className="h-3 w-3" />返回会话
                </Link>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索标题、摘要、标签…"
                className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
                    activeCat === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveId(a.id)}
                className={cn(
                  "block w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/40",
                  active?.id === a.id && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-primary">{a.category}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Eye className="h-3 w-3" />{a.views}
                  </span>
                </div>
                <h3 className="mt-1 truncate text-sm font-semibold">{a.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">未找到相关文档</div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {active && (
            <article className="mx-auto max-w-3xl p-8">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {active.category}
                </span>
                {sessionId && (
                  <span className="rounded-full bg-status-human/10 px-2 py-0.5 text-[11px] font-medium text-status-human">
                    会话 {sessionId} 引用
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold">{active.title}</h1>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{active.updatedAt}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{active.views} 次查看</span>
                <span className="inline-flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {active.tags.join(" / ")}
                </span>
              </div>
              <div className="mt-5 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                {active.summary}
              </div>
              <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {active.content}
              </div>
              {sessionId && (
                <div className="mt-8 flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(active.content);
                      toast.success("已复制到剪贴板", { description: "可粘贴到会话中发送给客户" });
                    }}
                    className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                  >
                    复制内容到会话
                  </button>
                  <Link
                    to="/"
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                  >
                    返回会话
                  </Link>
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
