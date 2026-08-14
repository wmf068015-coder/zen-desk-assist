import { useEffect, useState } from "react";
import type { BrowsingProduct, Customer } from "@/lib/mock-data";
import { CHANNEL_LABELS } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Globe,
  Crown,
  Package,
  MapPin,
  Save,
  Send,
  StickyNote,
  Truck,
  Languages,
  X,
} from "lucide-react";
import { toast } from "sonner";

const HANDOFF_NOTE_PREFIX = "zen-desk-assist:handoff-note:";

interface CustomerPanelProps {
  customer: Customer;
  sessionId: string;
  canSend: boolean;
  revealedOrder?: {
    orderId: string;
    email: string;
  };
  onSendProduct: (product: BrowsingProduct) => void;
}

interface StoredHandoffNote {
  content: string;
  updatedAt: string;
}

export function CustomerPanel({
  customer,
  sessionId,
  canSend,
  revealedOrder,
  onSendProduct,
}: CustomerPanelProps) {
  const [draftNote, setDraftNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [translationInput, setTranslationInput] = useState("");
  const [translationResult, setTranslationResult] = useState("");
  const currentProducts = customer.currentProducts.slice(0, 3);
  const visibleOrder =
    revealedOrder?.email.trim().toLowerCase() === customer.email.trim().toLowerCase()
      ? customer.orders.find(
          (order) => order.id.toLowerCase() === revealedOrder.orderId.trim().toLowerCase(),
        )
      : undefined;

  useEffect(() => {
    const stored = readHandoffNote(sessionId);
    setDraftNote(stored?.content ?? "");
    setSavedNote(stored?.content ?? "");
    setSavedAt(stored?.updatedAt ?? null);
  }, [sessionId]);

  const saveHandoffNote = () => {
    const content = draftNote.trim().slice(0, 500);
    const storageKey = getHandoffNoteKey(sessionId);

    if (!content) {
      window.localStorage.removeItem(storageKey);
      setDraftNote("");
      setSavedNote("");
      setSavedAt(null);
      toast.success("交接便签已清空");
      return;
    }

    const updatedAt = new Date().toISOString();
    window.localStorage.setItem(storageKey, JSON.stringify({ content, updatedAt }));
    setDraftNote(content);
    setSavedNote(content);
    setSavedAt(updatedAt);
    toast.success("交接便签已保存");
  };

  const translateToChinese = () => {
    const input = translationInput.trim();
    if (!input) return;
    setTranslationResult(translateSupportMessage(input));
  };

  const clearTranslation = () => {
    setTranslationInput("");
    setTranslationResult("");
  };

  return (
    <aside className="scrollbar-thin flex h-full w-[320px] flex-col overflow-y-auto border-l bg-card">
      <div className="relative bg-gradient-primary px-5 pb-6 pt-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <img
            src={customer.avatar}
            className="h-14 w-14 rounded-full bg-white/20 ring-2 ring-white/40"
            alt=""
          />
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
        <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="邮箱" value={customer.email} />
        <InfoRow
          icon={<Globe className="h-3.5 w-3.5" />}
          label="渠道"
          value={CHANNEL_LABELS[customer.channel]}
        />
        <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="地区" value={customer.region} />
      </Section>

      <Tabs defaultValue="browsing" className="border-t px-5 py-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browsing" className="gap-1.5 px-2 text-xs">
            <Globe className="h-3.5 w-3.5" />
            当前浏览
            <span className="text-[10px] text-muted-foreground">{currentProducts.length}</span>
          </TabsTrigger>
          <TabsTrigger value="order" className="gap-1.5 px-2 text-xs">
            <Package className="h-3.5 w-3.5" />
            订单信息
            <span className="text-[10px] text-muted-foreground">{visibleOrder ? 1 : 0}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browsing" className="mt-3 space-y-4">
          {currentProducts.length > 0 ? (
            <div className="space-y-1.5">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 rounded-lg border bg-background p-2"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-12 w-12 shrink-0 rounded-md bg-muted object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{product.name}</p>
                    <code className="mt-0.5 block truncate font-mono text-[10px] text-primary">
                      {product.url}
                    </code>
                  </div>
                  <button
                    type="button"
                    disabled={!canSend}
                    onClick={() => onSendProduct(product)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/5 text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                    title={canSend ? `发送${product.name}` : "当前会话不可发送消息"}
                    aria-label={`发送商品 ${product.name}`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                当前页面
              </div>
              <code className="mt-1 block font-mono text-xs text-primary">
                {customer.currentPage}
              </code>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Languages className="h-3.5 w-3.5 text-primary" />
                AI 翻译
              </div>
              {translationInput && (
                <button
                  type="button"
                  onClick={clearTranslation}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="清空翻译"
                  title="清空"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <textarea
              value={translationInput}
              onChange={(event) => {
                setTranslationInput(event.target.value.slice(0, 500));
                setTranslationResult("");
              }}
              rows={2}
              maxLength={500}
              placeholder="输入需要翻译的文字"
              aria-label="AI 翻译输入"
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-xs leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="button"
              disabled={!translationInput.trim()}
              onClick={translateToChinese}
              className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Languages className="h-3.5 w-3.5" />
              翻译成中文
            </button>
            {translationResult && (
              <div
                className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5"
                aria-live="polite"
              >
                <p className="text-[10px] font-medium text-muted-foreground">翻译结果</p>
                <p className="mt-1 text-xs leading-relaxed text-foreground">{translationResult}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <StickyNote className="h-3 w-3 text-primary" />
              交接便签
            </div>
            <textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value.slice(0, 500))}
              rows={2}
              maxLength={500}
              placeholder="输入交接内容"
              aria-label="交接便签"
              className="w-full resize-none rounded-md border bg-background px-2.5 py-1.5 text-[11px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-[10px] text-muted-foreground">
                {savedAt ? `保存于 ${formatNoteTime(savedAt)}` : "尚未保存"}
              </span>
              <button
                type="button"
                disabled={draftNote === savedNote}
                onClick={saveHandoffNote}
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2 text-[10px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
              >
                <Save className="h-2.5 w-2.5" />
                保存
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="order" className="mt-3">
          {visibleOrder ? (
            <div className="rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {visibleOrder.id}
                </span>
                <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                  {visibleOrder.status}
                </span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed">
                  {visibleOrder.title}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  x{visibleOrder.quantity}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">单价</p>
                  <p className="mt-0.5 text-xs font-medium">¥{visibleOrder.unitPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">总价</p>
                  <p className="mt-0.5 text-xs font-semibold text-primary">
                    ¥{visibleOrder.amount}
                  </p>
                </div>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  物流信息
                </div>
                {visibleOrder.logistics ? (
                  <div className="mt-1 text-[11px] leading-relaxed">
                    <p>
                      {visibleOrder.logistics.carrier} · {visibleOrder.logistics.status}
                    </p>
                    <p className="font-mono text-muted-foreground">
                      {visibleOrder.logistics.trackingNumber}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">--</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-16 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-xs text-muted-foreground">
              暂无订单信息
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function Section({
  title,
  children,
  icon,
  count,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="border-t px-5 py-4">
      <div className="mb-2.5 flex items-center gap-1.5">
        {icon}
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
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
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function getHandoffNoteKey(sessionId: string) {
  return `${HANDOFF_NOTE_PREFIX}${sessionId}`;
}

function readHandoffNote(sessionId: string): StoredHandoffNote | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(getHandoffNoteKey(sessionId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredHandoffNote>;
    if (typeof parsed.content !== "string" || typeof parsed.updatedAt !== "string") return null;
    return { content: parsed.content.slice(0, 500), updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

function formatNoteTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function translateSupportMessage(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (/^[\p{Script=Han}\p{P}\p{N}\s]+$/u.test(value.trim())) return value.trim();

  const exactTranslation = SUPPORT_TRANSLATIONS[normalized];
  if (exactTranslation) return exactTranslation;
  if (/order/.test(normalized) && /(where|status|track|arrive|deliver|late)/.test(normalized)) {
    return "用户正在询问订单状态和配送进度。";
  }
  if (/(refund|money back)/.test(normalized)) return "用户希望申请退款。";
  if (/(return|send back)/.test(normalized)) return "用户希望退回商品。";
  if (/(damaged|broken)/.test(normalized)) return "用户反馈收到的商品存在破损。";
  if (/(not working|doesn't work|cannot use)/.test(normalized)) return "用户反馈商品无法正常使用。";

  return "暂未识别该表达，请调整文字后重试。";
}

const SUPPORT_TRANSLATIONS: Record<string, string> = {
  "where is my order?": "我的订单在哪里？",
  "when will my order arrive?": "我的订单什么时候送达？",
  "i have not received my order.": "我还没有收到订单。",
  "please send me the tracking number.": "请把物流单号发给我。",
  "the product is damaged.": "商品已经损坏。",
  "the product is not working.": "商品无法正常使用。",
  "i want a refund.": "我想申请退款。",
  "can i return this product?": "我可以退回这个商品吗？",
  "please provide your order number and email address.": "请提供您的订单号和邮箱地址。",
  "thank you for your patience.": "感谢您的耐心等待。",
  "thank you for your help.": "感谢您的帮助。",
};
