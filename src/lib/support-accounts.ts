import { SUPPORT_AGENTS } from "./ticket-assignments.ts";

export type SupportAccountRole = "online" | "email";
export type SupportAccountPresence = "idle" | "busy" | "offline";
export type SupportModule =
  | "workbench"
  | "tickets"
  | "capacity"
  | "knowledge"
  | "stats"
  | "settings";

export interface SupportAccount {
  id: string;
  name: (typeof SUPPORT_AGENTS)[number];
  email: string;
  role: SupportAccountRole;
  presence: SupportAccountPresence | null;
  permissions: SupportModule[];
}

export const SUPPORT_ACCOUNT_ROLE_LABELS: Record<SupportAccountRole, string> = {
  online: "在线客服账号",
  email: "邮件客服账号",
};

export const SUPPORT_ACCOUNT_PRESENCE_LABELS: Record<SupportAccountPresence, string> = {
  idle: "空闲",
  busy: "繁忙",
  offline: "离线",
};

export const SUPPORT_MODULE_LABELS: Record<SupportModule, string> = {
  workbench: "工作台",
  tickets: "工单",
  capacity: "接待配置",
  knowledge: "知识库",
  stats: "接待统计",
  settings: "设置",
};

export const SUPPORT_MODULES = Object.keys(SUPPORT_MODULE_LABELS) as SupportModule[];

export const DEFAULT_SUPPORT_ACCOUNTS: SupportAccount[] = [
  {
    id: "agent-xiaomei",
    name: "客服小美",
    email: "xiaomei@neewer.com",
    role: "online",
    presence: "idle",
    permissions: ["workbench", "tickets"],
  },
  {
    id: "agent-xiaochen",
    name: "客服小陈",
    email: "xiaochen@neewer.com",
    role: "online",
    presence: "busy",
    permissions: ["workbench", "tickets"],
  },
  {
    id: "agent-xiaolin",
    name: "客服小林",
    email: "xiaolin@neewer.com",
    role: "email",
    presence: null,
    permissions: ["tickets"],
  },
  {
    id: "agent-xiaozhou",
    name: "客服小周",
    email: "xiaozhou@neewer.com",
    role: "online",
    presence: "offline",
    permissions: ["workbench", "tickets"],
  },
];

const STORAGE_KEY = "zen-desk-assist.support-accounts.v1";
const ACCOUNT_EVENT = "support-account-changed";
const validRoles = new Set<SupportAccountRole>(["online", "email"]);
const validPresences = new Set<SupportAccountPresence>(["idle", "busy", "offline"]);
const validModules = new Set<SupportModule>(SUPPORT_MODULES);

export function getDefaultSupportAccountPermissions(role: SupportAccountRole): SupportModule[] {
  return role === "online" ? ["workbench", "tickets"] : ["tickets"];
}

export function updateSupportAccount(
  accounts: SupportAccount[],
  accountId: string,
  update: Partial<Pick<SupportAccount, "role" | "presence" | "permissions">>,
): SupportAccount[] {
  return accounts.map((account) => {
    if (account.id !== accountId) return account;
    const role = update.role ?? account.role;
    const roleChanged = update.role !== undefined && update.role !== account.role;
    const presence =
      role === "email" ? null : (update.presence ?? account.presence ?? ("idle" as const));
    const requestedPermissions = new Set(
      update.permissions ??
        (roleChanged ? getDefaultSupportAccountPermissions(role) : account.permissions),
    );
    const permissions = SUPPORT_MODULES.filter((permission) =>
      requestedPermissions.has(permission),
    );
    return { ...account, role, presence, permissions };
  });
}

export function readSupportAccounts(): SupportAccount[] {
  if (typeof window === "undefined") return DEFAULT_SUPPORT_ACCOUNTS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return DEFAULT_SUPPORT_ACCOUNTS;

    return DEFAULT_SUPPORT_ACCOUNTS.map((fallback) => {
      const candidate = stored.find(
        (value): value is Record<string, unknown> =>
          Boolean(value) &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          (value as Record<string, unknown>).id === fallback.id,
      );
      if (!candidate) return fallback;

      const role = validRoles.has(candidate.role as SupportAccountRole)
        ? (candidate.role as SupportAccountRole)
        : fallback.role;
      const presence =
        role === "email"
          ? null
          : validPresences.has(candidate.presence as SupportAccountPresence)
            ? (candidate.presence as SupportAccountPresence)
            : fallback.presence === null
              ? "idle"
              : fallback.presence;
      const requestedPermissions = Array.isArray(candidate.permissions)
        ? new Set(
            candidate.permissions.filter(
              (permission): permission is SupportModule =>
                typeof permission === "string" && validModules.has(permission as SupportModule),
            ),
          )
        : new Set(getDefaultSupportAccountPermissions(role));
      const permissions = SUPPORT_MODULES.filter((permission) =>
        requestedPermissions.has(permission),
      );
      return { ...fallback, role, presence, permissions };
    });
  } catch {
    return DEFAULT_SUPPORT_ACCOUNTS;
  }
}

export function saveSupportAccount(
  accountId: string,
  update: Partial<Pick<SupportAccount, "role" | "presence" | "permissions">>,
) {
  if (typeof window === "undefined") return;
  const accounts = updateSupportAccount(readSupportAccounts(), accountId, update);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new Event(ACCOUNT_EVENT));
}

export function subscribeSupportAccounts(listener: (accounts: SupportAccount[]) => void) {
  if (typeof window === "undefined") return () => undefined;
  const notify = () => listener(readSupportAccounts());
  window.addEventListener(ACCOUNT_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(ACCOUNT_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}
