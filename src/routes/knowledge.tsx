import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { sessions } from "@/lib/mock-data";
import type { KnowledgeArticle } from "@/lib/mock-data";
import { knowledgeStore, useKnowledge } from "@/lib/knowledge-store";
import {
  BookOpen, Search, Eye, Calendar, Tag, ArrowLeft, Plus, Sparkles,
  ShieldCheck, Clock, X, CheckCircle2, XCircle, TrendingUp, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/knowledge")({
  validateSearch: (s: Record<string, unknown>) => ({
    sessionId: typeof s.sessionId === "string" ? s.sessionId : (undefined as string | undefined),
    q: typeof s.q === "string" ? s.q : (undefined as string | undefined),
  }),
  head: () => ({
    meta: [
      { title: "知识库 — 智能客服系统" },
      { name: "description", content: "客服知识库：产品手册、政策、话术与故障排查，支持新增、审核与置信度。" },
    ],
  }),
  component: KnowledgePage,
});

type Tab = "approved" | "pending" | "rejected";

function KnowledgePage() {
  const { sessionId, q: initialQ } = useSearch({ from: "/knowledge" });
  const all = useKnowledge();
  const [q, setQ] = useState(initialQ ?? "");
  const [activeCat, setActiveCat] = useState<string>("全部");
  const [tab, setTab] = useState<Tab>("approved");
  const [isAdmin, setIsAdmin] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const cats = useMemo(
    () => ["全部", ...Array.from(new Set(all.map((a) => a.category)))],
    [all],
  );

  const session = sessionId ? sessions.find((s) => s.id === sessionId) : undefined;

  const filtered = useMemo(() => {
    return all.filter((a) => {
      if (a.status !== tab) return false;
      if (activeCat !== "全部" && a.category !== activeCat) return false;
      if (q && !(a.title.includes(q) || a.summary.includes(q) || a.tags.some((t) => t.includes(q)))) return false;
      return true;
    });
  }, [all, q, activeCat, tab]);

  const active = filtered.find((a) => a.id === activeId) ?? filtered[0];

  const counts = useMemo(() => ({
    approved: all.filter((a) => a.status === "approved").length,
    pending: all.filter((a) => a.status === "pending").length,
    rejected: all.filter((a) => a.status === "rejected").length,
  }), [all]);

  const handleCopy = (a: KnowledgeArticle) => {
    navigator.clipboard.writeText(a.content);
    knowledgeStore.incrementUse(a.id);
    toast.success("已复制到剪贴板", { description: "可粘贴到会话中发送给客户，置信度已 +1" });
  };

  const handleApprove = (a: KnowledgeArticle) => {
    knowledgeStore.approve(a.id);
    toast.success("已通过审核", { description: `「${a.title}」已发布到知识库` });
  };

  const handleReject = (a: KnowledgeArticle) => {
    const reason = window.prompt("请输入驳回原因", "内容不准确，需补充来源");
    if (!reason) return;
    knowledgeStore.reject(a.id, reason);
    toast.error("已驳回", { description: `「${a.title}」已被驳回` });
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="flex w-[380px] flex-col border-r bg-card">
          <div className="border-b p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-base font-bold">知识库</h1>
                <p className="text-[11px] text-muted-foreground">{counts.approved} 篇已发布 · {counts.pending} 篇待审核</p>
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

            {/* Role toggle */}
            <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted/30 px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                当前身份
              </div>
              <button
                onClick={() => setIsAdmin((v) => !v)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
                  isAdmin ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
                title="模拟切换身份"
              >
                {isAdmin ? "后台管理员" : "客服"}
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-2 flex gap-1 rounded-lg bg-muted/40 p-0.5">
              {([
                { k: "approved", label: "已发布", n: counts.approved },
                { k: "pending", label: "审核中", n: counts.pending },
                { k: "rejected", label: "已驳回", n: counts.rejected },
              ] as const).map((t) => (
                <button
                  key={t.k}
                  onClick={() => { setTab(t.k); setActiveId(null); }}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    tab === t.k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label} <span className="ml-0.5 opacity-60">{t.n}</span>
                </button>
              ))}
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
            <button
              onClick={() => setShowNew(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />新增知识
            </button>
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
                  <div className="flex items-center gap-1">
                    {a.source === "session" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-status-human/10 px-1.5 py-0.5 text-[9px] font-medium text-status-human">
                        <MessageSquare className="h-2.5 w-2.5" />会话
                      </span>
                    )}
                    <ConfidenceChip value={a.confidence} compact />
                  </div>
                </div>
                <h3 className="mt-1 truncate text-sm font-semibold">{a.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5"><Eye className="h-3 w-3" />{a.views}</span>
                  <span className="inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />引用 {a.useCount}</span>
                  <span>{a.updatedAt}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {tab === "pending" ? "暂无待审核条目" : tab === "rejected" ? "暂无被驳回条目" : "未找到相关文档"}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {active ? (
            <article className="mx-auto max-w-3xl p-8">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {active.category}
                </span>
                <StatusChip status={active.status} />
                <ConfidenceChip value={active.confidence} />
                {active.source === "session" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-status-human/10 px-2 py-0.5 text-[11px] font-medium text-status-human">
                    <MessageSquare className="h-3 w-3" />来自会话 {active.sourceSessionId}
                  </span>
                )}
                {sessionId && (
                  <span className="rounded-full bg-status-human/10 px-2 py-0.5 text-[11px] font-medium text-status-human">
                    会话 {sessionId} 引用
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold">{active.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{active.updatedAt}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{active.views} 次查看</span>
                <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />AI 引用 {active.useCount} 次</span>
                <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" />{active.tags.join(" / ")}</span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                提交人：{active.submittedBy} · {active.submittedAt}
                {active.reviewedBy && <> · 审核：{active.reviewedBy} {active.reviewedAt}</>}
              </div>

              {/* Confidence detail */}
              <div className="mt-5 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">置信度</span>
                  <span className="text-sm font-bold text-primary">{active.confidence}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                    style={{ width: `${active.confidence}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  随 AI 客服引用次数自动提升，当前已被引用 {active.useCount} 次。
                </p>
              </div>

              <div className="mt-5 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                {active.summary}
              </div>
              <div className="prose prose-sm mt-6 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {active.content}
              </div>
              {active.status === "rejected" && active.rejectReason && (
                <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <b>驳回原因：</b>{active.rejectReason}
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-wrap gap-2">
                {active.status === "approved" && sessionId && (
                  <button
                    onClick={() => handleCopy(active)}
                    className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                  >
                    复制内容到会话
                  </button>
                )}
                {active.status === "approved" && !sessionId && (
                  <button
                    onClick={() => handleCopy(active)}
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                  >
                    模拟 AI 引用 (+ 置信度)
                  </button>
                )}
                {active.status === "pending" && isAdmin && (
                  <>
                    <button
                      onClick={() => handleApprove(active)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground shadow-sm hover:opacity-90"
                    >
                      <CheckCircle2 className="h-4 w-4" />通过审核
                    </button>
                    <button
                      onClick={() => handleReject(active)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />驳回
                    </button>
                  </>
                )}
                {active.status === "pending" && !isAdmin && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-status-waiting/40 bg-status-waiting/10 px-3 py-2 text-xs text-status-waiting">
                    <Clock className="h-3.5 w-3.5" />等待后台管理员审核中
                  </span>
                )}
                {sessionId && (
                  <Link
                    to="/"
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                  >
                    返回会话
                  </Link>
                )}
              </div>
            </article>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              请选择一篇知识查看详情
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewKnowledgeDialog
          onClose={() => setShowNew(false)}
          presetSession={session ? { id: session.id, title: session.aiSummary?.l3_intent ?? session.lastMessage, content: session.messages.map((m) => `[${m.senderName ?? m.sender}] ${m.content}`).join("\n") } : undefined}
          existingCategories={cats.filter((c) => c !== "全部")}
        />
      )}
    </div>
  );
}

function StatusChip({ status }: { status: KnowledgeArticle["status"] }) {
  const map = {
    approved: { label: "已发布", cls: "bg-success/15 text-success", Icon: CheckCircle2 },
    pending: { label: "审核中", cls: "bg-status-waiting/15 text-status-waiting", Icon: Clock },
    rejected: { label: "已驳回", cls: "bg-destructive/15 text-destructive", Icon: XCircle },
  } as const;
  const { label, cls, Icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", cls)}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function ConfidenceChip({ value, compact }: { value: number; compact?: boolean }) {
  const tone =
    value >= 85 ? "bg-success/15 text-success" :
    value >= 60 ? "bg-primary/10 text-primary" :
    value >= 40 ? "bg-status-waiting/15 text-status-waiting" :
    "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium", tone, compact ? "text-[9px]" : "text-[11px]")}>
      <Sparkles className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {compact ? `${value}` : `置信度 ${value}%`}
    </span>
  );
}

function NewKnowledgeDialog({
  onClose,
  presetSession,
  existingCategories,
}: {
  onClose: () => void;
  presetSession?: { id: string; title: string; content: string };
  existingCategories: string[];
}) {
  const [title, setTitle] = useState(presetSession ? `来自会话 ${presetSession.id}：${presetSession.title}` : "");
  const [category, setCategory] = useState(existingCategories[0] ?? "其他");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState(presetSession?.content ?? "");
  const [tags, setTags] = useState("");
  const fromSession = !!presetSession;

  const submit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请填写标题与内容");
      return;
    }
    knowledgeStore.add({
      title: title.trim().slice(0, 120),
      category: category.trim().slice(0, 30) || "其他",
      summary: (summary.trim() || content.trim().slice(0, 60)).slice(0, 200),
      content: content.trim().slice(0, 5000),
      tags: tags.split(/[,，\s]+/).filter(Boolean).slice(0, 8),
      source: fromSession ? "session" : "manual",
      sourceSessionId: presetSession?.id,
      submittedBy: fromSession ? "客服小美" : "客服小美",
      status: "pending",
    });
    toast.success("已提交审核", { description: "等待后台管理员审核通过后将发布到知识库" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-elegant">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h3 className="text-base font-bold">新增知识</h3>
            <p className="text-[11px] text-muted-foreground">
              {fromSession ? `来源：会话 ${presetSession!.id}` : "手动新增 · 提交后进入审核"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="标题 *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>
          <Field label="分类">
            <input value={category} onChange={(e) => setCategory(e.target.value)} list="cat-list" maxLength={30} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <datalist id="cat-list">
              {existingCategories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="摘要（可选，留空将自动截取）">
            <input value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={200} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>
          <Field label="正文 *">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={5000} className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>
          <Field label="标签（逗号分隔）">
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：物流, 退货" className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-muted">取消</button>
          <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />提交审核
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
