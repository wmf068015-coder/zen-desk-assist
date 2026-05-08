import { useState, useMemo } from "react";
import { type Session, type SessionStatus, CHANNEL_LABELS, TAG_LABELS } from "@/lib/mock-data";
import { StatusBadge, TagBadge, ChannelIcon } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { Search, Filter, ArrowRightLeft } from "lucide-react";

interface Props {
  sessions: Session[];
  activeId: string;
  onSelect: (id: string) => void;
  maxCapacity: number;
  onCapacityChange: (n: number) => void;
}

const statusFilters: { value: SessionStatus | "all" | "unread"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "unread", label: "未读" },
  { value: "ai", label: "AI处理中" },
  { value: "waiting", label: "待人工" },
  { value: "human", label: "人工中" },
  { value: "suspended", label: "已挂起" },
  { value: "ended", label: "已结束" },
  { value: "timeout", label: "已超时" },
];

export function SessionList({
  sessions,
  activeId,
  onSelect,
  maxCapacity,
  onCapacityChange,
}: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [transferredOnly, setTransferredOnly] = useState(false);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filter === "unread" && s.unread === 0) return false;
      if (filter !== "all" && filter !== "unread" && s.status !== filter) return false;
      if (channelFilter !== "all" && s.channel !== channelFilter) return false;
      if (tagFilter !== "all" && !s.tags.includes(tagFilter as never)) return false;
      if (transferredOnly && !s.transferred) return false;
      if (query && !s.customer.name.includes(query) && !s.lastMessage.includes(query)) return false;
      return true;
    });
  }, [sessions, filter, query, channelFilter, tagFilter, transferredOnly]);

  const activeCount = sessions.filter((s) => s.status === "human").length;

  return (
    <div className="flex h-full w-[340px] flex-col border-r bg-card">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">会话列表</h2>
            <p className="text-xs text-muted-foreground">共 {filtered.length} 个会话</p>
          </div>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              "rounded-lg p-2 transition-colors",
              showAdvanced ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索客户名称或消息"
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.value
                  ? "bg-gradient-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {showAdvanced && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <label className="w-12 shrink-0 text-xs text-muted-foreground">渠道</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-7 flex-1 rounded border bg-background px-2 text-xs"
              >
                <option value="all">全部渠道</option>
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-12 shrink-0 text-xs text-muted-foreground">标签</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="h-7 flex-1 rounded border bg-background px-2 text-xs"
              >
                <option value="all">全部标签</option>
                {Object.entries(TAG_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={transferredOnly}
                onChange={(e) => setTransferredOnly(e.target.checked)}
                className="accent-primary"
              />
              仅显示已转人工
            </label>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg border bg-accent/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs">
              接待中 <b className="text-foreground">{activeCount}</b> / {maxCapacity}
            </span>
          </div>
          <input
            type="number"
            min={1}
            max={50}
            value={maxCapacity}
            onChange={(e) => onCapacityChange(Number(e.target.value))}
            className="h-6 w-14 rounded border bg-background px-1 text-center text-xs"
          />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {filtered.map((s) => (
          <SessionItem
            key={s.id}
            session={s}
            active={s.id === activeId}
            onClick={() => onSelect(s.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">没有匹配的会话</div>
        )}
      </div>
    </div>
  );
}

function SessionItem({
  session,
  active,
  onClick,
}: {
  session: Session;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
        active && "bg-gradient-to-r from-primary/5 to-transparent border-l-2 border-l-primary",
      )}
    >
      <div className="relative shrink-0">
        <img
          src={session.customer.avatar}
          alt={session.customer.name}
          className="h-10 w-10 rounded-full bg-muted"
        />
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-card ring-1 ring-border">
          <ChannelIcon channel={session.channel} className="h-2.5 w-2.5 text-muted-foreground" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold">{session.customer.name}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">{session.lastTime}</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <StatusBadge status={session.status} />
          {session.transferred && (
            <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
              <ArrowRightLeft className="h-2.5 w-2.5" />
              转人工
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{session.lastMessage}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex gap-1">
            {session.tags.slice(0, 2).map((t) => (
              <TagBadge key={t} tag={t} />
            ))}
          </div>
          {session.unread > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
              {session.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
