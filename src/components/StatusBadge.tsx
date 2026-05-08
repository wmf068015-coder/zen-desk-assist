import { cn } from "@/lib/utils";
import type { SessionStatus, SessionTag, Channel } from "@/lib/mock-data";
import { STATUS_LABELS, TAG_LABELS, CHANNEL_LABELS } from "@/lib/mock-data";
import {
  Bot,
  Clock,
  User,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  Globe,
  MessageCircle,
  Smartphone,
  Mail,
  Hash,
} from "lucide-react";

export function StatusBadge({ status, className }: { status: SessionStatus; className?: string }) {
  const config: Record<SessionStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    ai: { bg: "bg-status-ai/10", text: "text-status-ai", icon: <Bot className="h-3 w-3" /> },
    waiting: {
      bg: "bg-status-waiting/15",
      text: "text-status-waiting",
      icon: <Clock className="h-3 w-3" />,
    },
    human: {
      bg: "bg-status-human/15",
      text: "text-status-human",
      icon: <User className="h-3 w-3" />,
    },
    suspended: {
      bg: "bg-warning/15",
      text: "text-warning-foreground",
      icon: <PauseCircle className="h-3 w-3" />,
    },
    ended: {
      bg: "bg-status-ended/15",
      text: "text-status-ended",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    timeout: {
      bg: "bg-status-timeout/15",
      text: "text-status-timeout",
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        c.bg,
        c.text,
        className,
      )}
    >
      {c.icon}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function TagBadge({ tag }: { tag: SessionTag }) {
  const colors: Record<SessionTag, string> = {
    presale: "bg-info/10 text-info",
    logistics: "bg-primary/10 text-primary",
    refund: "bg-warning/15 text-warning-foreground",
    complaint: "bg-destructive/10 text-destructive",
    tech: "bg-status-ai/10 text-status-ai",
    invalid: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium",
        colors[tag],
      )}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const icons: Record<Channel, React.ReactNode> = {
    web: <Globe className={className} />,
    wechat: <MessageCircle className={className} />,
    app: <Smartphone className={className} />,
    weibo: <Hash className={className} />,
    email: <Mail className={className} />,
  };
  return (
    <span title={CHANNEL_LABELS[channel]} className="inline-flex">
      {icons[channel]}
    </span>
  );
}
