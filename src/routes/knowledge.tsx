import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Copy,
  CreditCard,
  Database,
  Eye,
  File,
  FileUp,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Hash,
  Layers3,
  LoaderCircle,
  MessageCircleQuestion,
  MessageSquare,
  PackageSearch,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { knowledgeStore, useKnowledge } from "@/lib/knowledge-store";
import { type KnowledgeArticle } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/knowledge")({
  validateSearch: (search: Record<string, unknown>) => ({
    sessionId:
      typeof search.sessionId === "string" ? search.sessionId : (undefined as string | undefined),
    q: typeof search.q === "string" ? search.q : (undefined as string | undefined),
  }),
  head: () => ({
    meta: [
      { title: "知识库 — 智能客服系统" },
      {
        name: "description",
        content: "按业务大类管理知识文档、分段、文档信息和索引状态，支持客服提交与管理员审核。",
      },
    ],
  }),
  component: KnowledgePage,
});

const KNOWLEDGE_CATEGORIES = [
  {
    name: "产品咨询",
    description: "产品参数、功能和使用指导",
    icon: PackageSearch,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    name: "配件与兼容",
    description: "配件选型、接口与兼容关系",
    icon: Boxes,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    name: "支付与财税",
    description: "付款、发票、税费与账单",
    icon: CreditCard,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    name: "退换货政策",
    description: "退货、换货和退款规则",
    icon: RotateCcw,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    name: "物流履约",
    description: "发货、配送和物流追踪",
    icon: Truck,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "产品故障排查",
    description: "故障识别、诊断和处理步骤",
    icon: Wrench,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    name: "保修与售后",
    description: "保修范围、维修和售后服务",
    icon: ShieldCheck,
    tone: "bg-violet-50 text-violet-700",
  },
] as const;

type UploadStep = 1 | 2 | 3;

interface UploadFlowState {
  category: string;
  step: UploadStep;
  fileName?: string;
  segmentCount?: number;
}

function KnowledgePage() {
  const { sessionId, q: initialQuery } = useSearch({ from: "/knowledge" });
  const allArticles = useKnowledge();
  const [isAdmin, setIsAdmin] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set([KNOWLEDGE_CATEGORIES[0].name]),
  );
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addChooserCategory, setAddChooserCategory] = useState<string | null>(null);
  const [qaCategory, setQaCategory] = useState<string | null>(null);
  const [uploadFlow, setUploadFlow] = useState<UploadFlowState | null>(null);
  const [customCategories, setCustomCategories] = useState<
    Array<{ name: string; description: string; icon: typeof FolderOpen; tone: string }>
  >([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [previewArticleId, setPreviewArticleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCategoryRef = useRef<string>(KNOWLEDGE_CATEGORIES[0].name);
  const categories = useMemo(
    () => [...KNOWLEDGE_CATEGORIES, ...customCategories],
    [customCategories],
  );

  const normalizedArticles = useMemo(
    () =>
      allArticles.map((article) => ({
        ...article,
        category: normalizeKnowledgeCategory(article.category),
      })),
    [allArticles],
  );
  const visibleArticles = useMemo(
    () =>
      isAdmin
        ? normalizedArticles
        : normalizedArticles.filter(
            (article) => article.status === "approved" || article.submittedBy.startsWith("客服"),
          ),
    [isAdmin, normalizedArticles],
  );
  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category.name,
          visibleArticles.filter((article) => article.category === category.name).length,
        ]),
      ),
    [categories, visibleArticles],
  );
  const documents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return visibleArticles.filter((article) => {
      if (!normalizedQuery) return true;
      return [article.title, article.summary, article.content, ...article.tags].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [query, visibleArticles]);
  const activeArticle = documents.find((article) => article.id === activeId) ?? documents[0];
  const previewArticle = visibleArticles.find((article) => article.id === previewArticleId);
  const activeSegments = activeArticle ? buildSegments(activeArticle) : [];
  const activeStats = activeArticle ? getDocumentStats(activeArticle, activeSegments) : null;

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const selectArticle = (article: KnowledgeArticle) => {
    setActiveId(article.id);
  };

  const openAddChooser = (category: string) => {
    setAddChooserCategory(category);
  };

  const startFileUpload = (category: string) => {
    uploadCategoryRef.current = category;
    setAddChooserCategory(null);
    setUploadFlow({ category, step: 1 });
    fileInputRef.current?.click();
  };

  const startQaCreation = (category: string) => {
    setAddChooserCategory(null);
    setQaCategory(category);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const category = uploadCategoryRef.current;
    setUploadFlow({ category, step: 2, fileName: file.name });
    try {
      const [content] = await Promise.all([extractUploadedFile(file), wait(900)]);
      if (!content.trim()) {
        toast.error("文件没有可用于分段的内容");
        setUploadFlow({ category, step: 1 });
        return;
      }
      const title = file.name.replace(/\.[^.]+$/, "").trim() || file.name;
      const article = knowledgeStore.add({
        category,
        title,
        summary: content.replace(/\s+/g, " ").trim().slice(0, 120),
        content,
        originalContent: content,
        tags: [getUploadedFileExtension(file.name).toUpperCase(), "文件上传"],
        source: "manual",
        submittedBy: isAdmin ? "管理员 Lee" : "客服小美",
        status: isAdmin ? "approved" : "pending",
        reviewedBy: isAdmin ? "管理员 Lee" : undefined,
        reviewedAt: isAdmin ? new Date().toISOString().slice(0, 10) : undefined,
        originalFileName: file.name,
        originalFileSize: file.size,
      });
      const segmentCount = buildSegments({ ...article, category }).length;
      setUploadFlow({ category, step: 3, fileName: file.name, segmentCount });
      await wait(1200);
      setExpandedCategories((current) => new Set(current).add(category));
      setActiveId(article.id);
      setUploadFlow(null);
      toast.success("文件处理完成", {
        description: isAdmin
          ? `已自动生成 ${segmentCount} 个分段并进入索引`
          : `已自动生成 ${segmentCount} 个分段，等待管理员审核`,
      });
    } catch (error) {
      setUploadFlow({ category, step: 1 });
      toast.error("文件处理失败", {
        description: error instanceof Error ? error.message : "请检查文件格式后重试",
      });
    }
  };

  const addKnowledgeQa = (question: string, answer: string) => {
    if (!qaCategory) return;
    const category = qaCategory;
    const article = knowledgeStore.add({
      category,
      title: question.trim().slice(0, 80),
      summary: answer.trim().slice(0, 120),
      content: `问题：${question.trim()}\n答案：${answer.trim()}`,
      originalContent: `问题：${question.trim()}\n答案：${answer.trim()}`,
      tags: ["Q&A", "零散知识"],
      source: "manual",
      submittedBy: isAdmin ? "管理员 Lee" : "客服小美",
      status: isAdmin ? "approved" : "pending",
      reviewedBy: isAdmin ? "管理员 Lee" : undefined,
      reviewedAt: isAdmin ? new Date().toISOString().slice(0, 10) : undefined,
    });
    setExpandedCategories((current) => new Set(current).add(category));
    setActiveId(article.id);
    setQaCategory(null);
    toast.success(isAdmin ? "知识 QA 已添加" : "知识 QA 已提交审核");
  };

  const addKnowledgeCategory = (name: string, description: string) => {
    const normalizedName = name.trim();
    if (categories.some((category) => category.name === normalizedName)) {
      toast.error("该知识大类已存在");
      return false;
    }
    setCustomCategories((current) => [
      ...current,
      {
        name: normalizedName,
        description: description.trim() || "自定义知识分类",
        icon: FolderOpen,
        tone: "bg-slate-100 text-slate-700",
      },
    ]);
    setExpandedCategories((current) => new Set(current).add(normalizedName));
    setShowNewCategory(false);
    toast.success("知识大类已创建");
    return true;
  };

  const approveArticle = (article: KnowledgeArticle) => {
    knowledgeStore.approve(article.id);
    toast.success("审核通过", { description: `「${article.title}」已发布并进入索引` });
  };

  const rejectArticle = (article: KnowledgeArticle) => {
    const reason = window.prompt("请输入驳回原因", "内容或来源需要补充");
    if (!reason?.trim()) return;
    knowledgeStore.reject(article.id, reason.trim());
    toast.error("知识申请未通过，文档已停用");
  };

  const toggleArticleStatus = (article: KnowledgeArticle) => {
    const nextStatus = article.status === "approved" ? "disabled" : "approved";
    knowledgeStore.setStatus(article.id, nextStatus);
    toast.success(nextStatus === "approved" ? "文档已启用" : "文档已停用");
  };

  const removeArticle = (article: KnowledgeArticle) => {
    if (!window.confirm(`确认删除「${article.title}」？此操作不可撤销。`)) return;
    knowledgeStore.remove(article.id);
    setActiveId(null);
    toast.success("文档已删除");
  };

  const copyArticle = async (article: KnowledgeArticle) => {
    try {
      await navigator.clipboard.writeText(article.content);
      knowledgeStore.incrementUse(article.id);
      toast.success("内容已复制", { description: sessionId ? "可返回会话直接发送" : undefined });
    } catch {
      toast.error("复制失败，请重试");
    }
  };

  const saveSegment = (segmentId: string, content: string) => {
    if (!activeArticle || !content.trim()) {
      toast.error("分段内容不能为空");
      return false;
    }
    const nextContent = activeSegments
      .map((segment) => (segment.id === segmentId ? content.trim() : segment.content))
      .join("\n\n");
    knowledgeStore.update(activeArticle.id, {
      content: nextContent,
      originalContent: activeArticle.originalContent ?? activeArticle.content,
    });
    toast.success("分段已更新", { description: "文档索引内容已同步更新" });
    return true;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b bg-card px-4 2xl:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">知识库</h1>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {visibleArticles.filter((article) => article.status === "approved").length}{" "}
                  个使用中文档
                </span>
              </div>
              <p className="hidden truncate text-xs text-muted-foreground lg:block">
                按业务大类维护可检索、可追溯的客服知识
              </p>
            </div>
            {sessionId && (
              <Link
                to="/"
                className="ml-2 inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                返回会话 {sessionId}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center rounded-md border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setIsAdmin(false)}
                className={cn(
                  "h-7 rounded px-2.5 text-xs font-medium transition-colors",
                  !isAdmin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                客服视图
              </button>
              <button
                type="button"
                onClick={() => setIsAdmin(true)}
                className={cn(
                  "h-7 rounded px-2.5 text-xs font-medium transition-colors",
                  isAdmin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                管理员视图
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.md,.json"
              onChange={(event) => void handleFileUpload(event)}
              className="hidden"
              aria-label="选择知识文档"
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <section className="flex w-[290px] shrink-0 flex-col border-r bg-card lg:w-[320px] xl:w-[360px] 2xl:w-[440px]">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">知识文档</h2>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {categories.length} 个大类 · {documents.length} 个匹配文档
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(true)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                    aria-label="新增知识大类"
                    title="新增知识大类"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="relative mt-2.5">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索文档名称、正文或标签"
                  className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_42px_46px_64px] gap-2 border-b bg-muted/30 px-4 py-2 text-[10px] font-medium text-muted-foreground">
              <span>大类 / 文档名称</span>
              <span className="text-right">分段</span>
              <span className="text-right">召回</span>
              <span className="text-right">状态</span>
            </div>
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              {categories.map((category) => {
                const Icon = category.icon;
                const expanded = expandedCategories.has(category.name);
                const categoryDocuments = documents.filter(
                  (article) => article.category === category.name,
                );
                return (
                  <div key={category.name} className="border-b">
                    <div className="flex items-center bg-muted/20 pr-2 hover:bg-muted/45">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        aria-expanded={expanded}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3 text-left"
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                            category.tone,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">
                            {category.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                            {category.description}
                          </span>
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {categoryCounts[category.name] ?? 0}
                        </span>
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddChooser(category.name)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                        aria-label={`在${category.name}中添加文档`}
                        title={`在${category.name}中添加文档`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {expanded && (
                      <div>
                        {categoryDocuments.map((article) => {
                          const segments = buildSegments(article);
                          const selected = activeArticle?.id === article.id;
                          return (
                            <div
                              key={article.id}
                              className={cn(
                                "group border-t px-4 py-3 transition-colors",
                                selected ? "bg-primary/5" : "hover:bg-muted/25",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => selectArticle(article)}
                                className="grid w-full grid-cols-[minmax(0,1fr)_42px_46px_64px] items-center gap-2 text-left"
                              >
                                <span className="flex min-w-0 items-center gap-2 pl-2">
                                  <DocumentIcon article={article} />
                                  <span className="min-w-0">
                                    <DocumentFileName
                                      article={article}
                                      className="text-xs font-semibold"
                                    />
                                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                      {article.updatedAt} ·{" "}
                                      {formatFileSize(article.content.length * 2)}
                                    </span>
                                  </span>
                                </span>
                                <span className="text-right text-[11px] tabular-nums text-muted-foreground">
                                  {segments.length}
                                </span>
                                <span className="text-right text-[11px] tabular-nums text-muted-foreground">
                                  {article.useCount}
                                </span>
                                <StatusBadge status={article.status} compact />
                              </button>

                              {isAdmin && selected && (
                                <div className="mt-2 flex items-center justify-end gap-1 border-t border-dashed pt-2">
                                  {article.status === "pending" ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => approveArticle(article)}
                                        className="inline-flex h-7 items-center gap-1 rounded border border-success/30 px-2 text-[10px] font-medium text-success hover:bg-success/10"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        通过
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => rejectArticle(article)}
                                        className="inline-flex h-7 items-center gap-1 rounded border border-destructive/30 px-2 text-[10px] font-medium text-destructive hover:bg-destructive/10"
                                      >
                                        <XCircle className="h-3 w-3" />
                                        不通过
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleArticleStatus(article)}
                                      className="inline-flex h-7 items-center gap-1 rounded border px-2 text-[10px] text-muted-foreground hover:border-primary hover:text-primary"
                                    >
                                      {article.status === "approved" ? "停用" : "启用"}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeArticle(article)}
                                    className="inline-flex h-7 items-center gap-1 rounded border px-2 text-[10px] text-muted-foreground hover:border-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    删除
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {categoryDocuments.length === 0 && (
                          <div className="border-t px-12 py-4 text-[10px] text-muted-foreground">
                            当前筛选条件下暂无文档
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {documents.length === 0 && (
                <div className="flex h-36 flex-col items-center justify-center px-8 text-center">
                  <FolderOpen className="h-7 w-7 text-muted-foreground/40" />
                  <p className="mt-2 text-xs font-medium">暂无匹配文档</p>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-w-0 flex-1 flex-col bg-background">
            {activeArticle && activeStats ? (
              <>
                <div className="border-b bg-card px-3 py-3 xl:px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <DocumentIcon article={activeArticle} large />
                        <h2 className="min-w-0 text-base font-bold">
                          <DocumentFileName article={activeArticle} />
                        </h2>
                        <StatusBadge status={activeArticle.status} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        <span>{activeArticle.category}</span>
                        <span>{activeStats.characters.toLocaleString("zh-CN")} 字符</span>
                        <span>{activeSegments.length} 个分段</span>
                        <span>召回 {activeArticle.useCount} 次</span>
                        <span>更新于 {activeArticle.updatedAt}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {activeArticle.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => void copyArticle(activeArticle)}
                          aria-label="复制文档内容"
                          title="复制文档内容"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs text-muted-foreground hover:border-primary hover:text-primary xl:px-2.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">复制内容</span>
                        </button>
                      )}
                      {activeArticle.source === "session" && (
                        <span className="inline-flex h-8 items-center gap-1.5 rounded-md bg-info/10 px-2.5 text-xs text-info">
                          <MessageSquare className="h-3.5 w-3.5" />
                          会话沉淀
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1">
                  <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
                    <div className="sticky top-0 z-10 flex h-11 items-center gap-2 border-b bg-card px-4 text-xs font-semibold">
                      <Layers3 className="h-4 w-4 text-primary" />
                      分段
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {activeSegments.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewArticleId(activeArticle.id)}
                        className="ml-auto inline-flex h-7 items-center gap-1.5 rounded border px-2 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        预览原始文档
                      </button>
                    </div>
                    <SegmentsView
                      key={activeArticle.id}
                      segments={activeSegments}
                      status={activeArticle.status}
                      canEdit={isAdmin}
                      onSave={saveSegment}
                    />
                  </div>
                  <aside className="scrollbar-thin w-[250px] shrink-0 overflow-y-auto border-l bg-card xl:w-[280px] 2xl:w-[340px]">
                    <DocumentInfoView article={activeArticle} stats={activeStats} />
                    <IndexView article={activeArticle} stats={activeStats} />
                  </aside>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium">请选择文档</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  从左侧选择知识大类，再点击文档查看分段、文档信息和索引情况。
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
      {addChooserCategory && (
        <AddKnowledgeChooser
          category={addChooserCategory}
          onUpload={() => startFileUpload(addChooserCategory)}
          onQa={() => startQaCreation(addChooserCategory)}
          onClose={() => setAddChooserCategory(null)}
        />
      )}
      {uploadFlow && (
        <UploadProgressDialog
          flow={uploadFlow}
          onChooseFile={() => fileInputRef.current?.click()}
          onClose={() => uploadFlow.step === 1 && setUploadFlow(null)}
        />
      )}
      {qaCategory && (
        <KnowledgeQaDialog
          category={qaCategory}
          isAdmin={isAdmin}
          onSubmit={addKnowledgeQa}
          onClose={() => setQaCategory(null)}
        />
      )}
      {showNewCategory && (
        <NewCategoryDialog
          onSubmit={addKnowledgeCategory}
          onClose={() => setShowNewCategory(false)}
        />
      )}
      {previewArticle && (
        <OriginalDocumentPreview
          article={previewArticle}
          onClose={() => setPreviewArticleId(null)}
        />
      )}
    </div>
  );
}

function NewCategoryDialog({
  onSubmit,
  onClose,
}: {
  onSubmit: (name: string, description: string) => boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const submit = () => {
    if (!name.trim()) {
      toast.error("请输入大类名称");
      return;
    }
    onSubmit(name, description);
  };
  return (
    <ModalShell title="新增知识大类" onClose={onClose}>
      <div className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
            大类名称 *
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            placeholder="例如：会员与账户"
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
            大类说明
          </span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={60}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            placeholder="简要说明该大类包含的知识范围"
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t bg-muted/20 px-5 py-3">
        <button type="button" onClick={onClose} className="h-8 rounded-md border px-3 text-xs">
          取消
        </button>
        <button
          type="button"
          onClick={submit}
          className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
        >
          创建大类
        </button>
      </div>
    </ModalShell>
  );
}

function AddKnowledgeChooser({
  category,
  onUpload,
  onQa,
  onClose,
}: {
  category: string;
  onUpload: () => void;
  onQa: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title={`向「${category}」添加知识`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 p-5">
        <button
          type="button"
          onClick={onUpload}
          className="flex min-h-28 flex-col items-start justify-center rounded-md border p-4 text-left hover:border-primary hover:bg-primary/5"
        >
          <FileUp className="h-5 w-5 text-primary" />
          <span className="mt-3 text-sm font-semibold">上传文档</span>
          <span className="mt-1 text-[10px] leading-4 text-muted-foreground">
            支持 XLSX、XLS、CSV、TXT、MD、JSON，上传后自动清洗与分段。
          </span>
        </button>
        <button
          type="button"
          onClick={onQa}
          className="flex min-h-28 flex-col items-start justify-center rounded-md border p-4 text-left hover:border-primary hover:bg-primary/5"
        >
          <MessageCircleQuestion className="h-5 w-5 text-primary" />
          <span className="mt-3 text-sm font-semibold">添加知识 QA</span>
          <span className="mt-1 text-[10px] leading-4 text-muted-foreground">
            直接录入一个问题和答案，适合零散、短小的客服知识。
          </span>
        </button>
      </div>
    </ModalShell>
  );
}

function UploadProgressDialog({
  flow,
  onChooseFile,
  onClose,
}: {
  flow: UploadFlowState;
  onChooseFile: () => void;
  onClose: () => void;
}) {
  const steps = [
    { step: 1 as const, label: "选择数据源" },
    { step: 2 as const, label: "文本分段与清洗" },
    { step: 3 as const, label: "处理并完成" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-md border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h3 className="text-sm font-bold">上传文档</h3>
            <p className="mt-0.5 text-[10px] text-muted-foreground">知识大类：{flow.category}</p>
          </div>
          {flow.step === 1 && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted"
              aria-label="关闭上传"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center px-6 py-5">
          {steps.map((item, index) => {
            const active = flow.step === item.step;
            const completed = flow.step > item.step;
            return (
              <div key={item.step} className="contents">
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 items-center justify-center rounded-full border text-xs font-semibold",
                      active ? "px-2.5" : "w-8 px-0",
                      active && "border-primary bg-primary text-primary-foreground",
                      completed && "border-success bg-success/10 text-success",
                      !active && !completed && "border-border text-muted-foreground",
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : active ? (
                      `STEP ${item.step}`
                    ) : (
                      item.step
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <span className="mx-3 h-px min-w-6 flex-1 bg-border" />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex min-h-52 flex-col items-center justify-center border-t bg-muted/10 px-8 py-8 text-center">
          {flow.step === 1 && (
            <>
              <FileUp className="h-9 w-9 text-primary" />
              <h4 className="mt-3 text-sm font-semibold">选择上传文件</h4>
              <p className="mt-1 text-xs text-muted-foreground">单个文件不超过 10 MB</p>
              <button
                type="button"
                onClick={onChooseFile}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground"
              >
                <Upload className="h-4 w-4" />
                选择文件
              </button>
            </>
          )}
          {flow.step === 2 && (
            <>
              <LoaderCircle className="h-9 w-9 animate-spin text-primary" />
              <h4 className="mt-3 text-sm font-semibold">正在进行文本分段与清洗</h4>
              <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                {flow.fileName} · 正在提取内容、清洗格式并生成语义分段
              </p>
            </>
          )}
          {flow.step === 3 && (
            <>
              <CheckCircle2 className="h-9 w-9 text-success" />
              <h4 className="mt-3 text-sm font-semibold">处理完成</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                已生成 {flow.segmentCount ?? 0} 个分段，即将进入分段列表
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KnowledgeQaDialog({
  category,
  isAdmin,
  onSubmit,
  onClose,
}: {
  category: string;
  isAdmin: boolean;
  onSubmit: (question: string, answer: string) => void;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const submit = () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("请完整填写问题和答案");
      return;
    }
    onSubmit(question, answer);
  };
  return (
    <ModalShell title={`添加知识 QA · ${category}`} onClose={onClose}>
      <div className="space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">问题 *</span>
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={200}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            placeholder="输入客户可能提出的问题"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">答案 *</span>
          <textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={6}
            maxLength={2000}
            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:border-primary"
            placeholder="输入准确、可直接引用的答案"
          />
        </label>
      </div>
      <div className="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
        <span className="text-[10px] text-muted-foreground">
          {isAdmin ? "保存后直接进入使用中" : "提交后等待管理员审核"}
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="h-8 rounded-md border px-3 text-xs">
            取消
          </button>
          <button
            type="button"
            onClick={submit}
            className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            {isAdmin ? "保存 QA" : "提交审核"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-md border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function OriginalDocumentPreview({
  article,
  onClose,
}: {
  article: KnowledgeArticle;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const originalContent = article.originalContent ?? article.content;
  const stats = getDocumentStats(article, buildSegments(article));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="original-document-title"
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border bg-card shadow-xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-4">
          <div className="min-w-0">
            <h3 id="original-document-title" className="text-sm font-semibold">
              预览原始文档
            </h3>
            <p className="mt-1 truncate text-xs text-muted-foreground" title={getFileName(article)}>
              {getFileName(article)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="关闭原始文档预览"
            title="关闭"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto sm:grid sm:grid-cols-[minmax(0,1fr)_240px]">
          <section className="min-w-0 p-5" aria-label="完整文档内容">
            <h4 className="mb-3 text-xs font-semibold">完整文档内容</h4>
            <div className="whitespace-pre-wrap break-words rounded-md border bg-background p-4 text-sm leading-6">
              {originalContent}
            </div>
          </section>
          <aside className="border-t bg-muted/20 sm:border-l sm:border-t-0">
            <DocumentInfoView article={article} stats={stats} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function SegmentsView({
  segments,
  status,
  canEdit,
  onSave,
}: {
  segments: KnowledgeSegment[];
  status: KnowledgeStatus;
  canEdit: boolean;
  onSave: (segmentId: string, content: string) => boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (segmentId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(segmentId)) next.delete(segmentId);
      else next.add(segmentId);
      return next;
    });
  };

  const startEditing = (segment: KnowledgeSegment) => {
    setExpandedIds((current) => new Set(current).add(segment.id));
    setEditingId(segment.id);
    setDraft(segment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft("");
  };

  const submitEditing = (segmentId: string) => {
    if (onSave(segmentId, draft)) cancelEditing();
  };

  return (
    <div className="divide-y px-3 2xl:px-5">
      {segments.map((segment) => {
        const editing = editingId === segment.id;
        const expanded = expandedIds.has(segment.id);
        return (
          <article
            key={segment.id}
            className={cn(
              "py-4 transition-[height]",
              !expanded && !editing && "h-[148px] overflow-hidden",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold 2xl:text-xs">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                {segment.label}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px]",
                    status === "approved" ? "text-success" : "text-muted-foreground",
                  )}
                >
                  <CircleDot className="h-3 w-3" />
                  {status === "approved" ? "已启用" : "未进入索引"}
                </span>
                {canEdit && !editing && (
                  <button
                    type="button"
                    onClick={() => startEditing(segment)}
                    className="flex h-6 w-6 items-center justify-center rounded border text-muted-foreground hover:border-primary hover:text-primary"
                    aria-label={`编辑${segment.label}`}
                    title="编辑分段"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                {!editing && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(segment.id)}
                    className="flex h-6 w-6 items-center justify-center rounded border text-muted-foreground hover:border-primary hover:text-primary"
                    aria-label={`${expanded ? "收起" : "展开"}${segment.label}`}
                    title={expanded ? "收起详情" : "展开详情"}
                  >
                    <ChevronDown
                      className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
                    />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1 pl-5 text-[10px] text-muted-foreground">
              {segment.characters} 字符 · {segment.references} 次召回
            </div>
            {editing ? (
              <div className="mt-2">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={6}
                  className="w-full resize-y rounded-md border bg-background px-2.5 py-2 text-xs leading-5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  aria-label={`${segment.label}内容`}
                />
                <div className="mt-2 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="h-7 rounded border px-2 text-[10px] text-muted-foreground"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => submitEditing(segment.id)}
                    className="inline-flex h-7 items-center gap-1 rounded bg-primary px-2 text-[10px] font-medium text-primary-foreground"
                  >
                    <Save className="h-3 w-3" />
                    保存分段
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleExpanded(segment.id)}
                className="mt-2 block w-full text-left"
                aria-label={`${expanded ? "收起" : "展开"}${segment.label}详情`}
              >
                <p
                  className={cn(
                    "whitespace-pre-wrap text-xs leading-5 text-foreground/85 2xl:text-sm 2xl:leading-6",
                    !expanded && "line-clamp-3",
                  )}
                >
                  {segment.content}
                </p>
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

function DocumentInfoView({ article, stats }: { article: KnowledgeArticle; stats: DocumentStats }) {
  const values = [
    ["原始文件名称", getFileName(article)],
    ["文件类型", getFileExtension(article).toUpperCase()],
    ["原始文件大小", formatFileSize(article.originalFileSize ?? stats.bytes)],
    ["上传时间", article.submittedAt],
    ["最后更新时间", article.updatedAt],
    ["来源", article.source === "session" ? "客服会话沉淀" : "文件/手动录入"],
    ["提交人", article.submittedBy],
    ["审核人", article.reviewedBy ?? "--"],
  ];
  return (
    <section className="border-b p-3 2xl:p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold">
        <FileText className="h-3.5 w-3.5 text-primary" />
        文档信息
      </h3>
      <dl className="mt-2 border-t">
        {values.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[72px_minmax(0,1fr)] border-b py-1.5">
            <dt className="text-[9px] text-muted-foreground 2xl:text-[10px]">{label}</dt>
            <dd className="break-all text-[9px] font-medium 2xl:text-[10px]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function IndexView({ article, stats }: { article: KnowledgeArticle; stats: DocumentStats }) {
  const indexed = article.status === "approved";
  const values = [
    ["索引状态", indexed ? "索引可用" : article.status === "pending" ? "等待审核" : "未进入索引"],
    ["分段规则", "通用语义分段"],
    ["最大段落长度", "4,000 characters"],
    ["平均分段长度", `${stats.averageSegmentLength} characters`],
    ["段落数量", `${stats.segmentCount} paragraphs`],
    ["索引覆盖率", indexed ? "100%" : "0%"],
    ["嵌入耗时", indexed ? `${stats.embeddingSeconds} sec` : "--"],
    ["嵌入花费", indexed ? `${stats.tokens.toLocaleString("zh-CN")} tokens` : "--"],
    ["召回次数", article.useCount.toLocaleString("zh-CN")],
  ];
  return (
    <section className="p-3 2xl:p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold">
          <Activity className="h-3.5 w-3.5 text-primary" />
          索引情况
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-1 text-[9px] font-medium",
            indexed ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          <Database className="h-3.5 w-3.5" />
          {indexed ? "可检索" : "不可检索"}
        </span>
      </div>
      <dl className="mt-2 border-t">
        {values.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-2 border-b py-1.5">
            <dt className="text-[9px] text-muted-foreground 2xl:text-[10px]">{label}</dt>
            <dd className="text-right text-[9px] font-medium 2xl:text-[10px]">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function StatusBadge({ status, compact }: { status: KnowledgeStatus; compact?: boolean }) {
  const config = {
    approved: { label: "使用中", className: "bg-success/10 text-success" },
    disabled: { label: "已停用", className: "bg-muted text-muted-foreground" },
    pending: { label: "待审核", className: "bg-warning/10 text-warning-foreground" },
  } as const;
  const item = config[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded font-medium",
        item.className,
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
      )}
    >
      {item.label}
    </span>
  );
}

function DocumentIcon({ article, large }: { article: KnowledgeArticle; large?: boolean }) {
  const extension = getFileExtension(article);
  const Icon = extension === "xlsx" ? FileSpreadsheet : extension === "txt" ? File : FileText;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded",
        extension === "xlsx" ? "bg-success/10 text-success" : "bg-info/10 text-info",
        large ? "h-8 w-8" : "h-7 w-7",
      )}
    >
      <Icon className={large ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </span>
  );
}

interface KnowledgeSegment {
  id: string;
  label: string;
  content: string;
  characters: number;
  references: number;
}

interface DocumentStats {
  bytes: number;
  characters: number;
  segmentCount: number;
  averageSegmentLength: number;
  embeddingSeconds: string;
  tokens: number;
}

function buildSegments(article: KnowledgeArticle): KnowledgeSegment[] {
  const rawSegments = article.content
    .split(/\n{2,}|\n(?=\d+[.、])/)
    .map((item) => item.trim())
    .filter(Boolean);
  const contentSegments = rawSegments.length > 1 ? rawSegments : splitLongText(article.content);
  return contentSegments.map((content, index) => ({
    id: `${article.id}-segment-${index + 1}`,
    label: `分段-${String(index + 1).padStart(2, "0")}`,
    content,
    characters: content.length,
    references:
      article.useCount > 0
        ? Math.floor(article.useCount / contentSegments.length) +
          (index < article.useCount % contentSegments.length ? 1 : 0)
        : 0,
  }));
}

function splitLongText(value: string) {
  const sentences = value
    .split(/(?<=[。！？.!?])\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return [value.trim()];
  const result: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    result.push(sentences.slice(index, index + 2).join(" "));
  }
  return result;
}

function getDocumentStats(article: KnowledgeArticle, segments: KnowledgeSegment[]): DocumentStats {
  const characters = article.content.length;
  return {
    bytes: Math.max(1024, characters * 2),
    characters,
    segmentCount: segments.length,
    averageSegmentLength: Math.round(characters / Math.max(1, segments.length)),
    embeddingSeconds: (1.2 + segments.length * 0.18).toFixed(2),
    tokens: Math.max(64, Math.round(characters * 1.35)),
  };
}

function normalizeKnowledgeCategory(category: string) {
  const aliases: Record<string, string> = {
    产品手册: "产品咨询",
    物流配送: "物流履约",
    售后服务: "保修与售后",
    技术支持: "产品故障排查",
    投诉处理: "退换货政策",
  };
  return aliases[category] ?? category;
}

function getFileExtension(article: KnowledgeArticle) {
  if (article.originalFileName) return getUploadedFileExtension(article.originalFileName);
  if (article.tags.includes("零散知识")) return "txt";
  if (article.tags.some((tag) => /表格|参数|Q&A/i.test(tag))) return "xlsx";
  if (article.source === "session") return "txt";
  return "md";
}

function getFileName(article: KnowledgeArticle) {
  if (article.originalFileName) return article.originalFileName;
  const base = article.title
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 60);
  const extension = getFileExtension(article);
  return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`;
}

function DocumentFileName({
  article,
  className,
}: {
  article: KnowledgeArticle;
  className?: string;
}) {
  const fileName = getFileName(article);
  const extension = getFileExtension(article);
  const suffix = `.${extension}`;
  const base = fileName.slice(0, -suffix.length);
  return (
    <span className={cn("flex min-w-0", className)} title={fileName}>
      <span className="min-w-0 truncate">{base}</span>
      <span className="shrink-0">{suffix}</span>
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function getUploadedFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "txt";
}

async function extractUploadedFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("文件不能超过 10 MB");
  }

  const extension = getUploadedFileExtension(file.name);
  if (["xlsx", "xls"].includes(extension)) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    return workbook.SheetNames.map((sheetName) => {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { blankrows: false });
      return `工作表：${sheetName}\n${csv.trim()}`;
    })
      .filter((section) => !section.endsWith("\n"))
      .join("\n\n");
  }

  if (!["csv", "txt", "md", "json"].includes(extension)) {
    throw new Error("暂仅支持 XLSX、XLS、CSV、TXT、MD 和 JSON 文件");
  }
  return (await file.text()).trim();
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
}
