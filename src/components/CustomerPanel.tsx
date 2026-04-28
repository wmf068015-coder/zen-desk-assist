import type { Customer } from "@/lib/mock-data";
import { CHANNEL_LABELS } from "@/lib/mock-data";
import { Phone, Mail, Globe, Crown, Package, History, Star } from "lucide-react";

export function CustomerPanel({ customer }: { customer: Customer }) {
  return (
    <aside className="scrollbar-thin flex h-full w-[320px] flex-col overflow-y-auto border-l bg-card">
      <div className="relative bg-gradient-primary px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <img src={customer.avatar} className="h-14 w-14 rounded-full bg-white/20 ring-2 ring-white/40" alt="" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold">{customer.name}</h3>
              {customer.vipLevel && <Crown className="h-4 w-4 text-warning" />}
            </div>
            {customer.vipLevel && (
              <span className="mt-0.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                {customer.vipLevel}
              </span>
            )}
            <p className="mt-1 text-xs opacity-80">ID: {customer.id}</p>
          </div>
        </div>
      </div>

      <Section title="联系信息">
        <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="电话" value={customer.phone} />
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="邮箱" value={customer.email} />
        <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="渠道" value={CHANNEL_LABELS[customer.channel]} />
        <InfoRow label="注册日期" value={customer.registerDate} />
      </Section>

      <Section title="当前浏览">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />当前页面
          </div>
          <code className="mt-1 block font-mono text-xs text-primary">{customer.currentPage}</code>
        </div>
      </Section>

      <Section title="订单信息" icon={<Package className="h-3.5 w-3.5" />} count={customer.orders.length}>
        <div className="space-y-2">
          {customer.orders.map((o) => (
            <div key={o.id} className="rounded-lg border bg-card p-3 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{o.id}</span>
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">{o.status}</span>
              </div>
              <p className="mt-1 text-sm font-medium">{o.title}</p>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{o.date}</span>
                <span className="font-semibold text-primary">¥{o.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="历史会话" icon={<History className="h-3.5 w-3.5" />} count={customer.historySessions.length}>
        <div className="space-y-2">
          {customer.historySessions.map((h) => (
            <div key={h.id} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{h.topic}</p>
                {h.rating && (
                  <div className="flex items-center gap-0.5 text-warning">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs">{h.rating}</span>
                  </div>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{h.date} · {h.id}</p>
            </div>
          ))}
        </div>
      </Section>
    </aside>
  );
}

function Section({ title, children, icon, count }: { title: string; children: React.ReactNode; icon?: React.ReactNode; count?: number }) {
  return (
    <div className="border-t px-5 py-4">
      <div className="mb-2.5 flex items-center gap-1.5">
        {icon}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}{label}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
