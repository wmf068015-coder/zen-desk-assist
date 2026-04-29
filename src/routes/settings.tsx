import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { quickReplies as initialQuickReplies } from "@/lib/mock-data";
import { Zap, Settings as SettingsIcon, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "设置 — 智能客服系统" },
      { name: "description", content: "管理快捷回复、接待偏好和个人账号设置。" },
    ],
  }),
  component: SettingsPage,
});

interface QR {
  id: string;
  category: string;
  title: string;
  content: string;
}

const CATEGORIES = ["常用话术", "政策说明", "链接素材", "图片素材"];

function SettingsPage() {
  const [items, setItems] = useState<QR[]>(initialQuickReplies);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QR | null>(null);

  const grouped = useMemo(() => {
    return items.reduce<Record<string, QR[]>>((acc, q) => {
      (acc[q.category] ||= []).push(q);
      return acc;
    }, {});
  }, [items]);

  const startEdit = (q: QR) => {
    setEditingId(q.id);
    setDraft({ ...q });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("标题与内容不能为空");
      return;
    }
    setItems((prev) => prev.map((q) => (q.id === draft.id ? draft : q)));
    toast.success("已保存", { description: draft.title });
    cancelEdit();
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((q) => q.id !== id));
    toast.success("已删除");
    if (editingId === id) cancelEdit();
  };

  const addNew = (category: string) => {
    const id = `q${Date.now()}`;
    const fresh: QR = { id, category, title: "新话术", content: "" };
    setItems((prev) => [...prev, fresh]);
    startEdit(fresh);
  };

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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">快捷回复库</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{items.length} 条</span>
              </div>
            </div>
            <div className="space-y-6">
              {CATEGORIES.map((cat) => {
                const list = grouped[cat] ?? [];
                return (
                  <div key={cat}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{cat}</h3>
                      <button
                        onClick={() => addNew(cat)}
                        className="inline-flex items-center gap-1 rounded-lg border border-dashed px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <Plus className="h-3 w-3" />新增
                      </button>
                    </div>
                    <div className="space-y-2">
                      {list.length === 0 && (
                        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                          暂无话术，点击右上角「新增」添加
                        </div>
                      )}
                      {list.map((q) => {
                        const isEditing = editingId === q.id;
                        return (
                          <div
                            key={q.id}
                            className={cn(
                              "rounded-xl border bg-muted/30 p-4 transition-colors",
                              isEditing && "border-primary bg-primary/5"
                            )}
                          >
                            {isEditing && draft ? (
                              <div className="space-y-2">
                                <input
                                  value={draft.title}
                                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                  placeholder="标题"
                                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <textarea
                                  value={draft.content}
                                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                                  placeholder="话术内容"
                                  rows={3}
                                  className="w-full resize-none rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                                <div className="flex items-center justify-between">
                                  <select
                                    value={draft.category}
                                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                                    className="rounded-lg border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                                  >
                                    {CATEGORIES.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={cancelEdit}
                                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs hover:bg-muted"
                                    >
                                      <X className="h-3 w-3" />取消
                                    </button>
                                    <button
                                      onClick={saveEdit}
                                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                                    >
                                      <Save className="h-3 w-3" />保存
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{q.title}</p>
                                    <span className="text-[10px] text-muted-foreground">{q.id}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-all">{q.content}</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <button
                                    onClick={() => startEdit(q)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                                    title="编辑"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => remove(q.id)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    title="删除"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
