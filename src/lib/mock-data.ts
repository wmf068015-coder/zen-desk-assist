export type SessionStatus = "ai" | "waiting" | "human" | "ended" | "timeout";
export type Channel = "web" | "wechat" | "app" | "weibo" | "email";
export type SessionTag = "presale" | "logistics" | "refund" | "complaint" | "tech" | "invalid";
export type MessageSender = "customer" | "ai" | "agent" | "system";
export type MessageType = "text" | "image" | "file" | "system";

export interface Message {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string;
  time: string;
  senderName?: string;
  fileName?: string;
  fileSize?: string;
}

export interface Customer {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  channel: Channel;
  currentPage: string;
  vipLevel?: string;
  registerDate: string;
  orders: { id: string; title: string; amount: number; status: string; date: string }[];
  historySessions: { id: string; date: string; topic: string; rating?: number }[];
}

export interface Session {
  id: string;
  customer: Customer;
  status: SessionStatus;
  unread: number;
  tags: SessionTag[];
  channel: Channel;
  lastMessage: string;
  lastTime: string;
  startTime: string;
  transferred: boolean;
  messages: Message[];
  waitingSeconds?: number;
  queued?: boolean;
  queuePosition?: number;
  aiSummary?: {
    intent: string;
    keyPoints: string[];
    sentiment: "positive" | "neutral" | "negative";
    suggestedAction: string;
  };
}

export const CHANNEL_LABELS: Record<Channel, string> = {
  web: "网站",
  wechat: "微信",
  app: "APP",
  weibo: "微博",
  email: "邮箱",
};

export const STATUS_LABELS: Record<SessionStatus, string> = {
  ai: "AI处理中",
  waiting: "待人工",
  human: "人工处理中",
  ended: "已结束",
  timeout: "已超时",
};

export const TAG_LABELS: Record<SessionTag, string> = {
  presale: "售前",
  logistics: "物流",
  refund: "退款",
  complaint: "投诉",
  tech: "技术问题",
  invalid: "无效咨询",
};

const avatars = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ben",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ava",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Eva",
];

const customerNames = ["张晓明", "李静怡", "王小虎", "陈思琪", "刘梓轩", "赵紫涵", "孙浩然", "周雅婷", "吴俊杰", "郑欣妍"];

function makeCustomer(i: number): Customer {
  return {
    id: `C${1000 + i}`,
    name: customerNames[i],
    avatar: avatars[i],
    phone: `138****${String(1000 + i * 137).slice(-4)}`,
    email: `user${i}@example.com`,
    channel: (["web", "wechat", "app", "weibo", "email"] as Channel[])[i % 5],
    currentPage: ["/products/1203", "/cart", "/order/detail", "/home", "/help"][i % 5],
    vipLevel: i % 3 === 0 ? "黄金会员" : i % 3 === 1 ? "白银会员" : undefined,
    registerDate: `2023-0${(i % 9) + 1}-15`,
    orders: [
      { id: `O2024${1000 + i}`, title: "无线降噪耳机 Pro", amount: 1299, status: "已完成", date: "2024-12-10" },
      { id: `O2024${2000 + i}`, title: "智能手表 S2", amount: 2499, status: "配送中", date: "2025-01-08" },
    ].slice(0, (i % 2) + 1),
    historySessions: [
      { id: `H${i}01`, date: "2025-01-05", topic: "咨询产品功能", rating: 5 },
      { id: `H${i}02`, date: "2024-12-20", topic: "售后退换货", rating: 4 },
    ],
  };
}

const allStatuses: SessionStatus[] = ["ai", "waiting", "human", "human", "ended", "timeout", "ai", "waiting", "human", "ended"];
const allTags: SessionTag[][] = [
  ["presale"],
  ["logistics", "refund"],
  ["complaint"],
  ["tech"],
  ["presale", "logistics"],
  ["refund"],
  ["presale"],
  ["logistics"],
  ["tech", "complaint"],
  ["invalid"],
];

const sampleMessages: Record<number, Message[]> = {
  0: [
    { id: "m1", sender: "customer", type: "text", content: "你好，我想咨询一下这款耳机的续航时间", time: "14:21" },
    { id: "m2", sender: "ai", type: "text", content: "您好！很高兴为您服务 😊 这款无线降噪耳机 Pro 单次充电可以连续使用 30 小时，开启降噪后约 24 小时。", time: "14:21", senderName: "AI助手" },
    { id: "m3", sender: "customer", type: "text", content: "支持多设备连接吗？", time: "14:22" },
    { id: "m4", sender: "ai", type: "text", content: "支持的，可以同时连接 2 台设备，在手机和电脑之间无缝切换。", time: "14:22", senderName: "AI助手" },
    { id: "m5", sender: "customer", type: "text", content: "好的，那现在有什么优惠吗？我想下单", time: "14:23" },
  ],
  1: [
    { id: "m1", sender: "customer", type: "text", content: "我的订单什么时候发货？已经两天了", time: "10:05" },
    { id: "m2", sender: "ai", type: "text", content: "非常抱歉让您久等，我帮您查询一下订单状态。", time: "10:05", senderName: "AI助手" },
    { id: "m3", sender: "customer", type: "text", content: "我需要人工客服", time: "10:06" },
    { id: "m4", sender: "ai", type: "text", content: "好的，正在为您转接人工客服，请稍候…", time: "10:06", senderName: "AI助手" },
  ],
  2: [
    { id: "m1", sender: "customer", type: "text", content: "你们产品有质量问题！我要投诉！", time: "09:30" },
    { id: "m2", sender: "agent", type: "text", content: "您好，非常抱歉给您带来不便，我是客服小美，请问具体是什么问题呢？", time: "09:31", senderName: "小美" },
    { id: "m3", sender: "customer", type: "image", content: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400", time: "09:32" },
    { id: "m4", sender: "customer", type: "text", content: "包装破损，产品也有划痕", time: "09:32" },
    { id: "m5", sender: "agent", type: "text", content: "非常抱歉！我已经记录您的问题，我们会立即为您安排换货，物流单号稍后会发送给您。", time: "09:34", senderName: "小美" },
  ],
};

function defaultMessages(i: number): Message[] {
  return sampleMessages[i] ?? [
    { id: "d1", sender: "customer", type: "text", content: "你好，在吗？", time: "13:00" },
    { id: "d2", sender: "ai", type: "text", content: "您好，请问有什么可以帮您？", time: "13:00", senderName: "AI助手" },
  ];
}

const lastMessages = [
  "好的，那现在有什么优惠吗？我想下单",
  "我需要人工客服",
  "非常抱歉！已为您安排换货",
  "APP 无法登录，提示服务器错误",
  "请问什么时候能发货？",
  "已经超过 7 天了还没退款",
  "这款产品支持分期付款吗",
  "订单号 O20241234 物流停了",
  "系统一直崩溃，根本没法用",
  "不回复",
];

const lastTimes = ["刚刚", "2分钟前", "5分钟前", "12分钟前", "30分钟前", "1小时前", "2小时前", "3小时前", "昨天", "昨天"];

const aiSummaries: Record<number, Session["aiSummary"]> = {
  0: { intent: "咨询产品规格及优惠信息", keyPoints: ["关注续航时间（30小时）", "多设备连接需求", "有购买意向，询问优惠"], sentiment: "positive", suggestedAction: "推荐当前优惠活动并引导下单" },
  1: { intent: "催促订单发货", keyPoints: ["订单已下单2天未发货", "客户情绪不耐烦", "明确要求转人工"], sentiment: "negative", suggestedAction: "立即查询物流并向客户致歉" },
  2: { intent: "产品质量投诉", keyPoints: ["包装破损", "产品有划痕", "已提供图片证据"], sentiment: "negative", suggestedAction: "优先安排换货，主动补偿" },
  3: { intent: "APP 登录故障排查", keyPoints: ["提示服务器错误", "影响正常使用"], sentiment: "negative", suggestedAction: "收集设备信息，转技术团队" },
  4: { intent: "物流时效咨询", keyPoints: ["关心发货时间"], sentiment: "neutral", suggestedAction: "说明常规发货时效" },
  5: { intent: "退款进度咨询", keyPoints: ["超过7天未到账", "情绪焦虑"], sentiment: "negative", suggestedAction: "查询退款流水并加急处理" },
  6: { intent: "支付方式咨询", keyPoints: ["询问是否支持分期"], sentiment: "neutral", suggestedAction: "介绍可用分期方案" },
  7: { intent: "物流异常反馈", keyPoints: ["物流停滞", "订单号 O20241234"], sentiment: "negative", suggestedAction: "联系物流商核实" },
  8: { intent: "系统崩溃严重问题", keyPoints: ["完全无法使用", "反复崩溃"], sentiment: "negative", suggestedAction: "上报技术，提供临时方案" },
  9: { intent: "无效咨询", keyPoints: ["客户长时间无响应"], sentiment: "neutral", suggestedAction: "可结束会话" },
};

export const sessions: Session[] = Array.from({ length: 10 }, (_, i) => ({
  id: `S${2025000 + i}`,
  customer: makeCustomer(i),
  status: allStatuses[i],
  unread: [2, 5, 0, 1, 0, 0, 3, 8, 0, 0][i],
  tags: allTags[i],
  channel: (["web", "wechat", "app", "weibo", "email"] as Channel[])[i % 5],
  lastMessage: lastMessages[i],
  lastTime: lastTimes[i],
  startTime: "2025-01-15 14:20",
  transferred: [false, true, true, false, false, false, false, true, true, false][i],
  messages: defaultMessages(i),
  waitingSeconds: allStatuses[i] === "waiting" ? [null, 120, null, null, null, null, null, 340, null, null][i] ?? undefined : undefined,
  queued: [false, false, false, false, false, false, false, true, false, false][i],
  queuePosition: i === 7 ? 1 : undefined,
  aiSummary: aiSummaries[i],
}));

export const quickReplies = [
  { id: "q1", category: "常用话术", title: "问候语", content: "您好！很高兴为您服务，请问有什么可以帮您？" },
  { id: "q2", category: "常用话术", title: "稍等请求", content: "请您稍等片刻，我帮您核实一下相关信息。" },
  { id: "q3", category: "常用话术", title: "结束语", content: "感谢您的咨询，祝您生活愉快！如有其他问题欢迎随时联系我们。" },
  { id: "q4", category: "政策说明", title: "7天无理由退换", content: "我们支持7天无理由退换货，商品需保持原包装完好，不影响二次销售。" },
  { id: "q5", category: "政策说明", title: "物流说明", content: "正常下单后48小时内发货，偏远地区可能延迟1-2天，请您耐心等待。" },
  { id: "q6", category: "政策说明", title: "保修政策", content: "本产品享受全国联保一年服务，非人为损坏均可免费维修。" },
  { id: "q7", category: "链接素材", title: "帮助中心", content: "您可以访问我们的帮助中心获取更多信息：https://help.example.com" },
  { id: "q8", category: "链接素材", title: "订单查询", content: "订单查询入口：https://example.com/orders" },
  { id: "q9", category: "图片素材", title: "优惠券图", content: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400" },
];

export const stats = {
  totalSessions: 1286,
  validSessions: 1102,
  missedSessions: 24,
  avgResponseTime: "28s",
  avgHandleTime: "4分32秒",
  avgSessionDuration: "8分15秒",
  satisfaction: 96.8,
  trend: [
    { day: "周一", total: 168, valid: 142 },
    { day: "周二", total: 195, valid: 170 },
    { day: "周三", total: 210, valid: 188 },
    { day: "周四", total: 178, valid: 156 },
    { day: "周五", total: 220, valid: 195 },
    { day: "周六", total: 158, valid: 140 },
    { day: "周日", total: 157, valid: 111 },
  ],
  channelDist: [
    { channel: "网站", count: 485 },
    { channel: "微信", count: 362 },
    { channel: "APP", count: 258 },
    { channel: "微博", count: 112 },
    { channel: "邮箱", count: 69 },
  ],
};

export type KnowledgeStatus = "approved" | "pending" | "rejected";
export type KnowledgeSource = "manual" | "session";

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  updatedAt: string;
  views: number;
  status: KnowledgeStatus;
  source: KnowledgeSource;
  sourceSessionId?: string;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
  /** 0-100 置信度，AI 使用次数越高越高 */
  confidence: number;
  /** AI 引用次数 */
  useCount: number;
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: "kb1",
    category: "产品手册",
    title: "无线降噪耳机 Pro 完整规格",
    summary: "续航 30 小时、双设备连接、主动降噪 35dB、IPX4 防水等核心参数与使用说明。",
    content: "无线降噪耳机 Pro 采用第三代主动降噪芯片，续航 30 小时（开降噪 24h），支持蓝牙 5.3 多点连接，可同时连接手机与电脑。IPX4 级防水，支持 Type-C 快充，10 分钟充电可使用 3 小时。",
    tags: ["产品", "规格", "耳机"],
    updatedAt: "2025-01-10",
    views: 1284,
    status: "approved",
    source: "manual",
    submittedBy: "运营 Anna",
    submittedAt: "2024-12-20",
    reviewedBy: "管理员 Lee",
    reviewedAt: "2024-12-21",
    confidence: 96,
    useCount: 482,
  },
  {
    id: "kb2",
    category: "退换货政策",
    title: "7天无理由退换流程",
    summary: "签收后 7 天内可申请无理由退换，需保持包装完好不影响二次销售。",
    content: "1. 登录账户进入「我的订单」→ 选择对应订单 → 点击「申请退货」\n2. 填写退货原因并上传商品照片\n3. 客服 24 小时内审核，审核通过后可寄回商品\n4. 仓库收到验收无误后 3-5 个工作日内退款原路返回",
    tags: ["退货", "政策"],
    updatedAt: "2025-01-08",
    views: 956,
  },
  {
    id: "kb3",
    category: "物流配送",
    title: "发货时效与物流查询",
    summary: "正常订单 48 小时内发货，偏远地区延迟 1-2 天；支持多快递追踪。",
    content: "默认采用顺丰/京东物流。下单后 48 小时内发货，节假日及大促期间可能延迟。订单发货后会推送物流单号，可在订单详情页或快递官方网站查询。",
    tags: ["物流", "发货"],
    updatedAt: "2025-01-12",
    views: 730,
  },
  {
    id: "kb4",
    category: "售后服务",
    title: "保修范围与维修流程",
    summary: "全国联保一年，非人为损坏免费维修；人为损坏可付费维修。",
    content: "自购买之日起一年内，因产品本身质量问题导致的故障，凭购买凭证可享受免费维修。人为损坏（如摔落、进水超过防水等级）需收取材料费与人工费。",
    tags: ["保修", "售后"],
    updatedAt: "2025-01-05",
    views: 612,
  },
  {
    id: "kb5",
    category: "投诉处理",
    title: "客户投诉应对话术与升级流程",
    summary: "倾听 → 共情 → 致歉 → 解决方案 → 跟进；严重投诉转主管处理。",
    content: "处理投诉时优先安抚客户情绪，主动承担责任，给出明确解决时限。涉及金额 ≥ 500 元或情绪激烈的投诉需在 30 分钟内升级到主管处理。",
    tags: ["投诉", "话术"],
    updatedAt: "2025-01-14",
    views: 489,
  },
  {
    id: "kb6",
    category: "技术支持",
    title: "APP 登录异常排查",
    summary: "服务器错误、网络异常、版本过旧等常见原因与解决步骤。",
    content: "1. 确认网络连接正常\n2. 退出账号重新登录\n3. 检查 APP 版本，更新到最新\n4. 清除 APP 缓存或重装\n5. 仍无法解决的，收集错误截图与设备信息提交技术团队",
    tags: ["APP", "故障"],
    updatedAt: "2025-01-13",
    views: 421,
  },
];

export const auditLogs = [
  { id: "a1", agent: "客服小美", action: "导出聊天记录", target: "会话 S2025003", time: "2025-01-15 14:30", ip: "192.168.1.101" },
  { id: "a2", agent: "客服小强", action: "导出聊天记录", target: "会话 S2025007", time: "2025-01-15 13:15", ip: "192.168.1.102" },
  { id: "a3", agent: "客服小美", action: "批量导出", target: "10条记录", time: "2025-01-14 17:50", ip: "192.168.1.101" },
];
