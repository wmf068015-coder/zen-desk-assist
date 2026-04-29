import { useSyncExternalStore } from "react";
import { knowledgeBase, type KnowledgeArticle } from "./mock-data";

let articles: KnowledgeArticle[] = [...knowledgeBase];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const knowledgeStore = {
  getAll(): KnowledgeArticle[] {
    return articles;
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  add(a: Omit<KnowledgeArticle, "id" | "views" | "updatedAt" | "status" | "confidence" | "useCount" | "submittedAt"> & {
    submittedAt?: string;
    status?: KnowledgeArticle["status"];
  }) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${dateStr} ${now.toTimeString().slice(0, 5)}`;
    const next: KnowledgeArticle = {
      id: `kb${Date.now()}`,
      views: 0,
      updatedAt: dateStr,
      status: a.status ?? "pending",
      confidence: 20,
      useCount: 0,
      submittedAt: a.submittedAt ?? timeStr,
      ...a,
    };
    articles = [next, ...articles];
    emit();
    return next;
  },
  approve(id: string, reviewer = "管理员 Lee") {
    const now = new Date();
    articles = articles.map((a) =>
      a.id === id
        ? {
            ...a,
            status: "approved" as const,
            reviewedBy: reviewer,
            reviewedAt: now.toISOString().slice(0, 10),
            confidence: Math.max(a.confidence, 50),
          }
        : a
    );
    emit();
  },
  reject(id: string, reason: string, reviewer = "管理员 Lee") {
    const now = new Date();
    articles = articles.map((a) =>
      a.id === id
        ? {
            ...a,
            status: "rejected" as const,
            reviewedBy: reviewer,
            reviewedAt: now.toISOString().slice(0, 10),
            rejectReason: reason,
          }
        : a
    );
    emit();
  },
  /** 模拟 AI 引用知识：使用次数 +1，置信度按 log 增长，封顶 99 */
  incrementUse(id: string) {
    articles = articles.map((a) => {
      if (a.id !== id) return a;
      const useCount = a.useCount + 1;
      // 置信度增长曲线：每次 +(100-current)*0.05，缓慢逼近上限
      const confidence = Math.min(99, Math.round(a.confidence + (100 - a.confidence) * 0.05));
      return { ...a, useCount, confidence, views: a.views + 1 };
    });
    emit();
  },
};

export function useKnowledge() {
  return useSyncExternalStore(
    knowledgeStore.subscribe,
    knowledgeStore.getAll,
    knowledgeStore.getAll,
  );
}
