import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_SUPPORT_ACCOUNTS,
  readSupportAccounts,
  saveSupportAccount,
  subscribeSupportAccounts,
  SUPPORT_ACCOUNT_PRESENCE_LABELS,
  SUPPORT_ACCOUNT_ROLE_LABELS,
  SUPPORT_MODULE_LABELS,
  SUPPORT_MODULES,
  type SupportAccount,
  type SupportAccountPresence,
  type SupportAccountRole,
  type SupportModule,
} from "@/lib/support-accounts";
import {
  applyTicketAssignments,
  readTicketAssignments,
  saveTicketAssignment,
  saveTicketAssignments,
  subscribeTicketAssignments,
  SUPPORT_AGENTS,
} from "@/lib/ticket-assignments";
import { getTicketMessages, initialSupportTickets, type SupportTicket } from "@/lib/ticket-replies";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Headphones,
  Inbox,
  KeyRound,
  Mail,
  Monitor,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "管理员 · 运营与权限 — 智能客服系统" },
      { name: "description", content: "由管理员统一查看客服处理情况并管理账号权限。" },
    ],
  }),
  component: AdminPage,
});

type AssignmentFilter = "all" | "unassigned" | (typeof SUPPORT_AGENTS)[number];
type AssignmentTimeRange = "all" | "1" | "7" | "30" | "90" | "180" | "custom";
type AdminView = "assignments" | "accounts";
type AgentWorkload = {
  account: SupportAccount;
  assigned: number;
  processing: number;
  completed: number;
  unread: number;
  completionRate: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ASSIGNMENT_PAGE_SIZE = 50;

function parseAdminDate(value: string) {
  const timestamp = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTicketReceivedAt(ticket: SupportTicket) {
  return getTicketMessages(ticket).reduce((latest, message) => {
    if (message.direction !== "inbound") return latest;
    return parseAdminDate(message.sentAt) > parseAdminDate(latest) ? message.sentAt : latest;
  }, ticket.submittedAt);
}

function formatDateInput(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const initialLatestTicketTimestamp = Math.max(
  0,
  ...initialSupportTickets.map((ticket) => parseAdminDate(getTicketReceivedAt(ticket))),
);
const initialCustomEndDate = formatDateInput(initialLatestTicketTimestamp);
const initialCustomStartDate = formatDateInput(initialLatestTicketTimestamp - 30 * DAY_IN_MS);

function AdminPage() {
  const [tickets, setTickets] = useState(initialSupportTickets);
  const [accounts, setAccounts] = useState(DEFAULT_SUPPORT_ACCOUNTS);
  const [activeView, setActiveView] = useState<AdminView>("assignments");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all");
  const [assignmentTimeRange, setAssignmentTimeRange] = useState<AssignmentTimeRange>("all");
  const [customStartDate, setCustomStartDate] = useState(initialCustomStartDate);
  const [customEndDate, setCustomEndDate] = useState(initialCustomEndDate);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchAssignee, setBatchAssignee] = useState<string>(SUPPORT_AGENTS[0]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncAssignments = (assignments = readTicketAssignments()) => {
      setTickets((current) => applyTicketAssignments(current, assignments));
    };
    syncAssignments();
    return subscribeTicketAssignments(syncAssignments);
  }, []);

  useEffect(() => {
    const syncAccounts = (nextAccounts = readSupportAccounts()) => setAccounts(nextAccounts);
    syncAccounts();
    return subscribeSupportAccounts(syncAccounts);
  }, []);

  const ticketRows = useMemo(
    () =>
      tickets.map((ticket) => {
        const receivedAt = getTicketReceivedAt(ticket);
        return { ticket, receivedAt, timestamp: parseAdminDate(receivedAt) };
      }),
    [tickets],
  );
  const latestTicketTimestamp = useMemo(
    () => Math.max(0, ...ticketRows.map((row) => row.timestamp)),
    [ticketRows],
  );
  const customRangeError =
    assignmentTimeRange !== "custom"
      ? ""
      : !customStartDate || !customEndDate
        ? "请选择完整的开始和结束日期"
        : customStartDate > customEndDate
          ? "开始日期不能晚于结束日期"
          : "";
  const filteredTickets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const customStart = new Date(`${customStartDate}T00:00:00`).getTime();
    const customEnd = new Date(`${customEndDate}T23:59:59`).getTime();
    const cutoff =
      assignmentTimeRange === "all" || assignmentTimeRange === "custom"
        ? 0
        : latestTicketTimestamp - Number(assignmentTimeRange) * DAY_IN_MS;

    return ticketRows
      .filter(({ ticket, timestamp }) => {
        if (assignmentTimeRange === "custom") {
          if (customRangeError || timestamp < customStart || timestamp > customEnd) return false;
        } else if (assignmentTimeRange !== "all" && timestamp < cutoff) {
          return false;
        }
        if (assignmentFilter === "unassigned" && ticket.assignee) return false;
        if (
          assignmentFilter !== "all" &&
          assignmentFilter !== "unassigned" &&
          ticket.assignee !== assignmentFilter
        ) {
          return false;
        }
        if (!keyword) return true;
        return [ticket.id, ticket.title, ticket.contact, ticket.assignee ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(({ ticket }) => ticket);
  }, [
    assignmentFilter,
    assignmentTimeRange,
    customEndDate,
    customRangeError,
    customStartDate,
    latestTicketTimestamp,
    query,
    ticketRows,
  ]);
  const totalAssignmentPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / ASSIGNMENT_PAGE_SIZE),
  );
  const currentAssignmentPage = Math.min(assignmentPage, totalAssignmentPages);
  const paginatedTickets = useMemo(() => {
    const start = (currentAssignmentPage - 1) * ASSIGNMENT_PAGE_SIZE;
    return filteredTickets.slice(start, start + ASSIGNMENT_PAGE_SIZE);
  }, [currentAssignmentPage, filteredTickets]);

  const unassignedCount = tickets.filter((ticket) => !ticket.assignee).length;
  const processingCount = tickets.filter((ticket) => ticket.status !== "closed").length;
  const completedCount = tickets.length - processingCount;
  const onlineAccountCount = accounts.filter((account) => account.role === "online").length;
  const emailAccountCount = accounts.length - onlineAccountCount;
  const presentAccountCount = accounts.filter(
    (account) => account.role === "online" && account.presence !== "offline",
  ).length;
  const workloadRows = useMemo(
    () =>
      accounts.map((account) => {
        const assigned = tickets.filter((ticket) => ticket.assignee === account.name);
        const completed = assigned.filter((ticket) => ticket.status === "closed").length;
        return {
          account,
          assigned: assigned.length,
          processing: assigned.length - completed,
          completed,
          unread: assigned.filter((ticket) => ticket.unread).length,
          completionRate:
            assigned.length === 0 ? 0 : Math.round((completed / assigned.length) * 100),
        };
      }),
    [accounts, tickets],
  );
  const visibleIds = paginatedTickets.map((ticket) => ticket.id);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((ticketId) => selectedIdSet.has(ticketId));
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((ticketId) => selectedIdSet.has(ticketId));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  useEffect(() => {
    setAssignmentPage((current) => Math.min(current, totalAssignmentPages));
  }, [totalAssignmentPages]);

  const assignTicket = (ticket: SupportTicket, value: string) => {
    const assignee = value === "unassigned" ? undefined : value;
    saveTicketAssignment(ticket.id, assignee);
    toast.success(assignee ? "处理人已分配" : "已取消处理人分配", {
      description: assignee ? `${ticket.id} → ${assignee}` : ticket.id,
    });
  };

  const toggleTicket = (ticketId: string) => {
    setSelectedIds((current) =>
      current.includes(ticketId)
        ? current.filter((selectedId) => selectedId !== ticketId)
        : [...current, ticketId],
    );
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const currentSet = new Set(current);
      if (visibleIds.every((ticketId) => currentSet.has(ticketId))) {
        return current.filter((ticketId) => !visibleIds.includes(ticketId));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  };

  const assignSelectedTickets = () => {
    if (selectedIds.length === 0) return;
    const assignee = batchAssignee === "unassigned" ? undefined : batchAssignee;
    saveTicketAssignments(selectedIds, assignee);
    toast.success(assignee ? "工单已批量分配" : "已批量取消处理人分配", {
      description: assignee
        ? `${selectedIds.length} 个工单 → ${assignee}`
        : `共 ${selectedIds.length} 个工单`,
    });
    setSelectedIds([]);
  };

  const changeAssignmentFilter = (value: AssignmentFilter) => {
    setAssignmentFilter(value);
    setAssignmentPage(1);
    setSelectedIds([]);
  };

  const changeAssignmentTimeRange = (value: AssignmentTimeRange) => {
    setAssignmentTimeRange(value);
    setAssignmentPage(1);
    setSelectedIds([]);
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setAssignmentPage(1);
    setSelectedIds([]);
  };

  const changeAccountRole = (account: SupportAccount, role: SupportAccountRole) => {
    saveSupportAccount(account.id, { role });
    toast.success("账号权限已更新", {
      description: `${account.name} → ${SUPPORT_ACCOUNT_ROLE_LABELS[role]}`,
    });
  };

  const changeAccountPresence = (account: SupportAccount, presence: SupportAccountPresence) => {
    saveSupportAccount(account.id, { presence });
    toast.success("在线状态已更新", {
      description: `${account.name} → ${SUPPORT_ACCOUNT_PRESENCE_LABELS[presence]}`,
    });
  };

  const toggleAccountPermission = (account: SupportAccount, module: SupportModule) => {
    const enabled = account.permissions.includes(module);
    const permissions = enabled
      ? account.permissions.filter((permission) => permission !== module)
      : [...account.permissions, module];
    saveSupportAccount(account.id, { permissions });
    toast.success(enabled ? "模块权限已删除" : "模块权限已新增", {
      description: `${account.name} · ${SUPPORT_MODULE_LABELS[module]}`,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AppSidebar />
      <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        <header className="border-b bg-card px-7 py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">管理员</h1>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    运营管理
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  查看客服处理情况，统一管理工单分配和账号权限
                </p>
              </div>
            </div>
            <Link
              to="/tickets"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium hover:border-primary/40 hover:text-primary"
            >
              查看工单
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <div className="border-b bg-card px-7">
          <div
            role="tablist"
            aria-label="管理员功能"
            className="mx-auto flex h-11 max-w-7xl items-end gap-5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "assignments"}
              onClick={() => setActiveView("assignments")}
              className={cn(
                "flex h-11 items-center gap-1.5 border-b-2 px-1 text-xs font-medium transition-colors",
                activeView === "assignments"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              工单分配与处理
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "accounts"}
              onClick={() => setActiveView("accounts")}
              className={cn(
                "flex h-11 items-center gap-1.5 border-b-2 px-1 text-xs font-medium transition-colors",
                activeView === "accounts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <KeyRound className="h-3.5 w-3.5" />
              账号权限
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-4 p-7">
          {activeView === "assignments" ? (
            <>
              <dl className="grid grid-cols-4 overflow-hidden rounded-md border bg-card">
                <AssignmentStat label="全部工单" value={tickets.length} icon={<Inbox />} />
                <AssignmentStat
                  label="待分配"
                  value={unassignedCount}
                  icon={<CircleDashed />}
                  alert={unassignedCount > 0}
                />
                <AssignmentStat label="持续处理" value={processingCount} icon={<Users />} />
                <AssignmentStat label="处理完毕" value={completedCount} icon={<CheckCircle2 />} />
              </dl>

              <div className="grid min-w-0 items-start gap-4 md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.6fr)]">
                <section className="min-w-0 overflow-hidden rounded-md border bg-card">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h2 className="text-sm font-semibold">客服处理概览</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        按当前工单处理人统计
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {accounts.length} 个客服账号
                    </span>
                  </div>
                  <div className="max-h-[680px] divide-y overflow-y-auto">
                    {workloadRows.map((row) => (
                      <AgentWorkloadItem key={row.account.id} row={row} />
                    ))}
                  </div>
                </section>

                <section className="min-w-0 overflow-hidden rounded-md border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                    <div>
                      <h2 className="text-sm font-semibold">工单处理人分配</h2>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        当前显示 {filteredTickets.length} 条工单 · 收件时间由近到远
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <select
                        value={assignmentTimeRange}
                        onChange={(event) =>
                          changeAssignmentTimeRange(event.target.value as AssignmentTimeRange)
                        }
                        aria-label="按收件时间筛选"
                        className="h-9 rounded-md border bg-background px-2.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="all">全部时间</option>
                        <option value="1">近 24 小时</option>
                        <option value="7">近 7 天</option>
                        <option value="30">近 1 个月</option>
                        <option value="90">近 3 个月</option>
                        <option value="180">近 6 个月</option>
                        <option value="custom">自定义时间</option>
                      </select>
                      <select
                        value={assignmentFilter}
                        onChange={(event) =>
                          changeAssignmentFilter(event.target.value as AssignmentFilter)
                        }
                        aria-label="按处理人筛选"
                        className="h-9 rounded-md border bg-background px-2.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="all">全部处理人</option>
                        <option value="unassigned">未分配</option>
                        {SUPPORT_AGENTS.map((agent) => (
                          <option key={agent} value={agent}>
                            {agent}
                          </option>
                        ))}
                      </select>
                      <div className="relative w-72">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={query}
                          onChange={(event) => changeQuery(event.target.value)}
                          placeholder="搜索工单号、主题、邮箱或处理人"
                          className="h-9 w-full rounded-md border bg-background pl-8 pr-8 text-xs outline-none focus:border-primary"
                        />
                        {query && (
                          <button
                            type="button"
                            onClick={() => changeQuery("")}
                            aria-label="清空搜索"
                            className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {assignmentTimeRange === "custom" && (
                    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/15 px-4 py-2">
                      <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                        开始日期
                        <input
                          type="date"
                          value={customStartDate}
                          max={customEndDate || undefined}
                          onChange={(event) => {
                            setCustomStartDate(event.target.value);
                            setAssignmentPage(1);
                            setSelectedIds([]);
                          }}
                          className="h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </label>
                      <span className="text-xs text-muted-foreground">至</span>
                      <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                        结束日期
                        <input
                          type="date"
                          value={customEndDate}
                          min={customStartDate || undefined}
                          onChange={(event) => {
                            setCustomEndDate(event.target.value);
                            setAssignmentPage(1);
                            setSelectedIds([]);
                          }}
                          className="h-8 rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:border-primary"
                        />
                      </label>
                      {customRangeError && (
                        <span className="text-[11px] font-medium text-destructive">
                          {customRangeError}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b bg-muted/15 px-4 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">已选择 {selectedIds.length} 项</span>
                      {selectedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedIds([])}
                          className="inline-flex h-7 items-center gap-1 rounded px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          清空选择
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={batchAssignee}
                        onChange={(event) => setBatchAssignee(event.target.value)}
                        aria-label="选择批量分配处理人"
                        className="h-8 min-w-32 rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
                      >
                        <option value="unassigned">未分配</option>
                        {SUPPORT_AGENTS.map((agent) => (
                          <option key={agent} value={agent}>
                            {agent}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={assignSelectedTickets}
                        disabled={selectedIds.length === 0}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        批量分配
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[1200px] overflow-y-auto">
                    <table className="w-full table-fixed text-left">
                      <thead className="sticky top-0 z-10 bg-muted text-[11px] text-muted-foreground">
                        <tr>
                          <th className="w-[9%] px-2 py-2.5 font-medium">
                            <input
                              ref={selectAllRef}
                              type="checkbox"
                              checked={allVisibleSelected}
                              onChange={toggleAllVisible}
                              disabled={visibleIds.length === 0}
                              aria-label="全选当前页"
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                          </th>
                          <th className="w-[31%] px-2 py-2.5 font-medium">工单</th>
                          <th className="w-[22%] px-2 py-2.5 font-medium">买家邮箱</th>
                          <th className="w-[14%] px-2 py-2.5 font-medium">来源</th>
                          <th className="w-[24%] px-2 py-2.5 font-medium">处理人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedTickets.map((ticket) => (
                          <TicketAssignmentRow
                            key={ticket.id}
                            ticket={ticket}
                            selected={selectedIdSet.has(ticket.id)}
                            onToggle={() => toggleTicket(ticket.id)}
                            onAssign={(value) => assignTicket(ticket, value)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredTickets.length === 0 && (
                    <div className="flex h-44 flex-col items-center justify-center text-sm text-muted-foreground">
                      <UserCog className="mb-2 h-6 w-6 opacity-50" />
                      当前条件下没有工单
                    </div>
                  )}

                  <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-t bg-card px-4 py-2.5 text-[11px] text-muted-foreground">
                    <span>共 {filteredTickets.length} 条</span>
                    {totalAssignmentPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAssignmentPage((page) => Math.max(1, page - 1))}
                          disabled={currentAssignmentPage === 1}
                          aria-label="上一页"
                          title="上一页"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="min-w-16 text-center text-xs tabular-nums text-foreground">
                          {currentAssignmentPage} / {totalAssignmentPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAssignmentPage((page) => Math.min(totalAssignmentPages, page + 1))
                          }
                          disabled={currentAssignmentPage === totalAssignmentPages}
                          aria-label="下一页"
                          title="下一页"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <>
              <dl className="grid grid-cols-4 overflow-hidden rounded-md border bg-card">
                <AssignmentStat label="客服账号" value={accounts.length} icon={<Users />} />
                <AssignmentStat
                  label="在线客服账号"
                  value={onlineAccountCount}
                  icon={<Headphones />}
                />
                <AssignmentStat label="邮件客服账号" value={emailAccountCount} icon={<Mail />} />
                <AssignmentStat label="当前在线" value={presentAccountCount} icon={<Monitor />} />
              </dl>

              <section className="overflow-hidden rounded-md border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">账号权限分配</h2>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      共 {accounts.length} 个客服账号
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Headphones className="h-3.5 w-3.5" />
                      在线客服默认：工作台、工单
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      邮件客服默认：仅工单
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[940px] table-fixed text-left">
                    <thead className="bg-muted/40 text-[11px] text-muted-foreground">
                      <tr>
                        <th className="w-[25%] px-4 py-2.5 font-medium">客服账号</th>
                        <th className="w-[21%] px-4 py-2.5 font-medium">账号类型</th>
                        <th className="w-[22%] px-4 py-2.5 font-medium">可访问模块</th>
                        <th className="w-[32%] px-4 py-2.5 font-medium">在线状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {accounts.map((account) => (
                        <AccountPermissionRow
                          key={account.id}
                          account={account}
                          onRoleChange={(role) => changeAccountRole(account, role)}
                          onPermissionToggle={(module) => toggleAccountPermission(account, module)}
                          onPresenceChange={(presence) => changeAccountPresence(account, presence)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function AgentWorkloadItem({ row }: { row: AgentWorkload }) {
  return (
    <article className="px-3 py-3 transition-colors hover:bg-muted/25">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{row.account.name}</p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{row.account.email}</p>
        </div>
        <AccountRoleBadge role={row.account.role} />
      </div>
      <dl className="mt-2 grid grid-cols-5 gap-1.5">
        <WorkloadMetric label="已分配" value={row.assigned} />
        <WorkloadMetric label="持续处理" value={row.processing} tone="info" />
        <WorkloadMetric label="处理完毕" value={row.completed} tone="success" />
        <WorkloadMetric
          label="未读"
          value={row.unread}
          tone={row.unread > 0 ? "warning" : "default"}
        />
        <WorkloadMetric label="完成率" value={`${row.completionRate}%`} />
      </dl>
    </article>
  );
}

function WorkloadMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "info" | "success" | "warning";
}) {
  return (
    <div className="min-w-0 rounded bg-muted/45 px-1 py-1.5 text-center">
      <dt className="truncate text-[9px] text-muted-foreground" title={label}>
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-xs font-semibold tabular-nums",
          tone === "info" && Number(value) > 0 && "text-info",
          tone === "success" && Number(value) > 0 && "text-success",
          tone === "warning" && Number(value) > 0 && "text-warning-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function AccountPermissionRow({
  account,
  onRoleChange,
  onPermissionToggle,
  onPresenceChange,
}: {
  account: SupportAccount;
  onRoleChange: (role: SupportAccountRole) => void;
  onPermissionToggle: (module: SupportModule) => void;
  onPresenceChange: (presence: SupportAccountPresence) => void;
}) {
  return (
    <tr className="transition-colors hover:bg-muted/25">
      <td className="px-2 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {account.role === "online" ? (
              <Headphones className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{account.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{account.email}</p>
          </div>
        </div>
      </td>
      <td className="px-2 py-3">
        <select
          value={account.role}
          onChange={(event) => onRoleChange(event.target.value as SupportAccountRole)}
          aria-label={`设置 ${account.name} 的账号类型`}
          className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus:border-primary"
        >
          <option value="online">在线客服账号</option>
          <option value="email">邮件客服账号</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {account.permissions.length === 0 && (
            <span className="text-[10px] text-muted-foreground">无访问权限</span>
          )}
          {account.permissions.map((permission) => (
            <span
              key={permission}
              className="inline-flex h-6 items-center gap-1 rounded bg-primary/8 pl-2 pr-1 text-[10px] font-medium text-primary"
            >
              {SUPPORT_MODULE_LABELS[permission]}
              <button
                type="button"
                onClick={() => onPermissionToggle(permission)}
                aria-label={`删除 ${account.name} 的${SUPPORT_MODULE_LABELS[permission]}权限`}
                title={`删除${SUPPORT_MODULE_LABELS[permission]}权限`}
                className="inline-flex h-4 w-4 items-center justify-center rounded hover:bg-primary/10"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`编辑 ${account.name} 的可访问模块`}
                title="编辑可访问模块"
                className="inline-flex h-6 w-6 items-center justify-center rounded border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-2">
              <p className="px-2 pb-1.5 text-[10px] font-medium text-muted-foreground">
                可访问模块
              </p>
              <div className="space-y-0.5">
                {SUPPORT_MODULES.map((module) => {
                  const selected = account.permissions.includes(module);
                  return (
                    <button
                      key={module}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={selected}
                      onClick={() => onPermissionToggle(module)}
                      className="flex h-8 w-full items-center justify-between rounded px-2 text-xs hover:bg-muted"
                    >
                      {SUPPORT_MODULE_LABELS[module]}
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </td>
      <td className="px-4 py-3">
        {account.role === "online" ? (
          <div
            role="group"
            aria-label={`设置 ${account.name} 的在线状态`}
            className="inline-flex rounded-md border bg-muted/30 p-0.5"
          >
            {(Object.keys(SUPPORT_ACCOUNT_PRESENCE_LABELS) as SupportAccountPresence[]).map(
              (presence) => (
                <button
                  key={presence}
                  type="button"
                  onClick={() => onPresenceChange(presence)}
                  aria-pressed={account.presence === presence}
                  className={cn(
                    "inline-flex h-7 min-w-14 items-center justify-center gap-1.5 rounded px-2 text-[11px] font-medium transition-colors",
                    account.presence === presence
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      presence === "idle" && "bg-success",
                      presence === "busy" && "bg-warning",
                      presence === "offline" && "bg-muted-foreground",
                    )}
                  />
                  {SUPPORT_ACCOUNT_PRESENCE_LABELS[presence]}
                </button>
              ),
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">不适用</span>
        )}
      </td>
    </tr>
  );
}

function AccountRoleBadge({ role }: { role: SupportAccountRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
        role === "online" ? "bg-info/10 text-info" : "bg-primary/8 text-primary",
      )}
    >
      {role === "online" ? <Headphones className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
      {SUPPORT_ACCOUNT_ROLE_LABELS[role]}
    </span>
  );
}

function AssignmentStat({
  label,
  value,
  icon,
  alert = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-r px-4 py-3 last:border-r-0">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4",
          alert && "bg-warning/15 text-warning-foreground",
        )}
      >
        {icon}
      </span>
      <div>
        <dt className="text-[10px] text-muted-foreground">{label}</dt>
        <dd className="text-lg font-semibold leading-5">{value}</dd>
      </div>
    </div>
  );
}

function TicketAssignmentRow({
  ticket,
  selected,
  onToggle,
  onAssign,
}: {
  ticket: SupportTicket;
  selected: boolean;
  onToggle: () => void;
  onAssign: (value: string) => void;
}) {
  const latestInbound = [...getTicketMessages(ticket)]
    .reverse()
    .find((message) => message.direction === "inbound");
  const source = ticket.source === "web_widget" ? "工单留言" : formatMailbox(ticket.mailbox);

  return (
    <tr className={cn("transition-colors hover:bg-muted/25", selected && "bg-primary/[0.04]")}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`选择 ${ticket.id}`}
          className="h-4 w-4 rounded border-border accent-primary"
        />
      </td>
      <td className="px-4 py-3">
        <Link to="/tickets" className="group block min-w-0">
          <p className="truncate text-xs font-semibold group-hover:text-primary">{ticket.title}</p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            {ticket.id} · 收件于 {latestInbound?.sentAt ?? ticket.submittedAt}
          </p>
        </Link>
      </td>
      <td className="truncate px-2 py-3 text-[10px] text-muted-foreground">{ticket.contact}</td>
      <td className="px-2 py-3">
        <span className="block truncate rounded bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary">
          {source}
        </span>
      </td>
      <td className="px-2 py-3">
        <div className="flex items-center gap-1.5">
          <UserCog className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground xl:block" />
          <select
            value={ticket.assignee ?? "unassigned"}
            onChange={(event) => onAssign(event.target.value)}
            aria-label={`分配 ${ticket.id} 的处理人`}
            className={cn(
              "h-8 min-w-0 flex-1 rounded-md border bg-background px-1.5 text-[11px] outline-none focus:border-primary",
              !ticket.assignee && "text-muted-foreground",
            )}
          >
            <option value="unassigned">未分配</option>
            {SUPPORT_AGENTS.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  );
}

function formatMailbox(mailbox?: string) {
  const localPart = mailbox?.split("@")[0];
  return localPart ? `${localPart} 邮箱` : "客服邮箱";
}
