export type TicketIssueType = "order" | "logistics" | "refund" | "product" | "technical" | "other";
export type TicketStatus = "new" | "processing" | "replied" | "closed";
export type TicketPriority = "normal" | "high" | "urgent";
export type TicketSource = "web_widget" | "email" | "agent";
export type TicketMessageDirection = "inbound" | "outbound";
export type TicketReplyStatus = "sent" | "unsent" | "failed";

export interface TicketAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  mimeType: string;
  url?: string;
}

export interface TicketReply {
  id: string;
  channel: "email";
  from: string;
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  sentAt: string;
  action?: "reply" | "forward";
}

export interface TicketThreadMessage {
  id: string;
  direction: TicketMessageDirection;
  source: TicketSource;
  from: string;
  to: string;
  cc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  sentAt: string;
  attachments: TicketAttachment[];
  deliveryStatus?: "sent" | "failed";
  includeSignature?: boolean;
  action?: "reply" | "forward";
}

export interface SupportTicket {
  id: string;
  issueType: TicketIssueType;
  title: string;
  description: string;
  contact: string;
  attachments: TicketAttachment[];
  status: TicketStatus;
  priority: TicketPriority;
  source: TicketSource;
  customerName: string;
  submittedAt: string;
  lastUpdatedAt: string;
  sourceSessionId?: string;
  relatedOrderId?: string;
  replies: TicketReply[];
  mailbox?: string;
  threadId?: string;
  unread?: boolean;
  assignee?: string;
  messages?: TicketThreadMessage[];
}

export interface TicketEmailDraft {
  to: string;
  subject: string;
  body: string;
}

export interface SendTicketEmailInput {
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: TicketAttachment[];
  from?: string;
  cc?: string[];
  action?: "reply" | "forward";
}

export const ISSUE_TYPE_LABELS: Record<TicketIssueType, string> = {
  order: "订单问题",
  logistics: "物流配送",
  refund: "退款售后",
  product: "产品咨询",
  technical: "技术问题",
  other: "其他问题",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: "持续处理",
  processing: "持续处理",
  replied: "持续处理",
  closed: "处理完毕",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  normal: "普通",
  high: "高",
  urgent: "紧急",
};

export const TICKET_SOURCE_LABELS: Record<TicketSource, string> = {
  web_widget: "工单留言",
  email: "邮箱来信",
  agent: "客服邮箱",
};

const supportMailbox = "service@neewer.com";

export const initialSupportTickets: SupportTicket[] = [
  {
    id: "TK-MAIL-20260909-0146",
    issueType: "order",
    title: "Re: Demande de factures pour les commandes N° NF24638",
    description:
      "Mariia Ahramakova demande les factures officielles de deux commandes de matériel d'éclairage.",
    contact: "agramakovamaria@gmail.com",
    attachments: [
      {
        id: "att-mariia-order-details",
        name: "commandes-neewer.pdf",
        sizeLabel: "286 KB",
        mimeType: "application/pdf",
      },
    ],
    status: "processing",
    priority: "normal",
    source: "email",
    customerName: "Mariia Ahramakova",
    submittedAt: "2026-09-04 01:13",
    lastUpdatedAt: "2026-09-09 22:49",
    relatedOrderId: "NF24638",
    replies: [
      {
        id: "mail-support-202609051431",
        channel: "email",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour Mariia,\n\nMerci de nous avoir contactés et de votre fidélité à NEEWER.\n\nNous avons constaté que votre numéro de TVA n'apparaît pas dans les informations de facturation de vos commandes. Souhaitez-vous qu'il figure sur les factures ?\n\nSi oui, veuillez nous communiquer votre numéro de TVA afin que nous puissions établir les factures correspondantes.\n\nNous vous remercions de votre collaboration et attendons votre réponse.\n\nCordialement,\nSuzy\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-05 14:31",
      },
      {
        id: "mail-support-202609072206",
        channel: "email",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nMerci pour votre réponse rapide.\n\nAfin de pouvoir établir votre facture TVA officielle, nous vous serions reconnaissants de bien vouloir nous communiquer votre numéro de TVA pour notre vérification.\n\nDès réception de ces informations, nous traiterons votre demande en conséquence. Nous attendons votre réponse et nous vous aiderons dans les meilleurs délais.\n\nCordialement,\n\nEnglish version:\nHello,\n\nThank you for your prompt reply.\n\nTo proceed with issuing your official VAT invoice, we would appreciate it if you could kindly share your VAT number with us for our verification.\n\nUpon receiving this information from you, we will move forward to assist you accordingly. We look forward to your reply and will assist you promptly.\n\nBest regards,\nJasmine\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-07 22:06",
      },
      {
        id: "mail-support-202609081926",
        channel: "email",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nMerci de contacter le service client Neewer. Nous comprenons que vous souhaitez demander une facture avec TVA pour votre commande.\n\nMalheureusement, le numéro de TVA que vous avez fourni, FR90990386419, semble invalide. Nous avons joint une capture d'écran pour votre référence.\n\nPourriez-vous vérifier à nouveau ce numéro de TVA et nous communiquer les informations correctes à votre convenance ?\nDès réception du numéro de TVA mis à jour, nous traiterons rapidement votre demande de facture.\n\nNous attendons votre retour.\n\nCordialement,\n\nHello,\n\nThanks for contacting Neewer Customer Service. We understand you wish to request a VAT invoice for your order.\n\nUnfortunately, the VAT number you provided, FR90990386419, appears to be invalid. We have attached the screenshot for your reference.\n\nCould you please double-check the VAT number and provide us with the correct information at your convenience?\n\nOnce we receive the updated VAT number, we will proceed with your invoice request promptly.\n\nWe look forward to hearing from you.\n\nBest regards,\nJasmine\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-08 19:26",
      },
      {
        id: "mail-support-202609092021",
        channel: "email",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nMerci pour votre réponse rapide.\n\nVous trouverez en pièce jointe de cet e-mail la facture de la commande NF24638 pour votre référence.\n\nSi vous avez des questions entre-temps, n'hésitez pas à nous contacter.\n\nCordialement,\n\nHello,\n\nThanks for your prompt reply.\n\nPlease kindly find the invoice for order NF24638 attached to this email for your reference.\n\nIf you have any questions in the meantime, please don't hesitate to reach out.\n\nBest regards,\nJasmine\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-09 20:21",
      },
    ],
    mailbox: "support@neewer.com",
    threadId: "TH-AGRAMAKOVA-NF24638",
    unread: true,
    messages: [
      {
        id: "mail-customer-202609040113",
        direction: "inbound",
        source: "email",
        from: "agramakovamaria@gmail.com",
        to: "support@neewer.com",
        subject: "Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nJ'ai effectué deux achats de matériel d'éclairage sur votre site, mais je n'ai pas d'option pour télécharger mes factures depuis mon espace client. Ayant besoin de ces justificatifs pour ma comptabilité / démarches administratives, pourriez-vous s'il vous plaît m'envoyer par e-mail les factures officielles (au format PDF avec TVA) pour les deux commandes suivantes :\n\n1. Commande n° #NF24638 (du 11 août 2026) :\n\nSoftbox Parabolique 90cm — 109,99 €\n\n2. Commande du 7 juillet 2026 :\n\nPied d'éclairage ST-300SS, Parapluie 130cm, Flash Q300 — 397,60 €\n\nInformations client :\n\nNom : Mariia AHRAMAKOVA\nEmail : agramakovamaria@gmail.com\nAdresse : 3 rue de la démocratie, 69200 Vénissieux\n\nJe vous remercie par avance pour votre aide rapide.\n\nBien cordialement,\n\nMariia AHRAMAKOVA",
        sentAt: "2026-09-04 01:13",
        attachments: [
          {
            id: "att-mariia-order-details",
            name: "commandes-neewer.pdf",
            sizeLabel: "286 KB",
            mimeType: "application/pdf",
          },
        ],
      },
      {
        id: "mail-support-202609051431",
        direction: "outbound",
        source: "agent",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour Mariia,\n\nMerci de nous avoir contactés et de votre fidélité à NEEWER.\n\nNous avons constaté que votre numéro de TVA n'apparaît pas dans les informations de facturation de vos commandes. Souhaitez-vous qu'il figure sur les factures ?\n\nSi oui, veuillez nous communiquer votre numéro de TVA afin que nous puissions établir les factures correspondantes.\n\nNous vous remercions de votre collaboration et attendons votre réponse.\n\nCordialement,\nSuzy\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-05 14:31",
        attachments: [],
        deliveryStatus: "sent",
      },
      {
        id: "mail-customer-202609051548",
        direction: "inbound",
        source: "email",
        from: "agramakovamaria@gmail.com",
        to: "support@neewer.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Je n'ai pas de numéro de TVA.",
        sentAt: "2026-09-05 15:48",
        attachments: [],
      },
      {
        id: "mail-support-202609072206",
        direction: "outbound",
        source: "agent",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nMerci pour votre réponse rapide.\n\nAfin de pouvoir établir votre facture TVA officielle, nous vous serions reconnaissants de bien vouloir nous communiquer votre numéro de TVA pour notre vérification.\n\nDès réception de ces informations, nous traiterons votre demande en conséquence. Nous attendons votre réponse et nous vous aiderons dans les meilleurs délais.\n\nCordialement,\n\nEnglish version:\nHello,\n\nThank you for your prompt reply.\n\nTo proceed with issuing your official VAT invoice, we would appreciate it if you could kindly share your VAT number with us for our verification.\n\nUpon receiving this information from you, we will move forward to assist you accordingly. We look forward to your reply and will assist you promptly.\n\nBest regards,\nJasmine\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-07 22:06",
        attachments: [],
        deliveryStatus: "sent",
      },
      {
        id: "mail-customer-202609072242",
        direction: "inbound",
        source: "email",
        from: "agramakovamaria@gmail.com",
        to: "support@neewer.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "FR90990386419",
        sentAt: "2026-09-07 22:42",
        attachments: [],
      },
      {
        id: "mail-support-202609081926",
        direction: "outbound",
        source: "agent",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nMerci de contacter le service client Neewer. Nous comprenons que vous souhaitez demander une facture avec TVA pour votre commande.\n\nMalheureusement, le numéro de TVA que vous avez fourni, FR90990386419, semble invalide. Nous avons joint une capture d'écran pour votre référence.\n\nPourriez-vous vérifier à nouveau ce numéro de TVA et nous communiquer les informations correctes à votre convenance ?\nDès réception du numéro de TVA mis à jour, nous traiterons rapidement votre demande de facture.\n\nNous attendons votre retour.\n\nCordialement,\n\nHello,\n\nThanks for contacting Neewer Customer Service. We understand you wish to request a VAT invoice for your order.\n\nUnfortunately, the VAT number you provided, FR90990386419, appears to be invalid. We have attached the screenshot for your reference.\n\nCould you please double-check the VAT number and provide us with the correct information at your convenience?\n\nOnce we receive the updated VAT number, we will proceed with your invoice request promptly.\n\nWe look forward to hearing from you.\n\nBest regards,\nJasmine\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-08 19:26",
        attachments: [
          {
            id: "att-vat-number-validation",
            name: "vat-number-validation.png",
            sizeLabel: "174 KB",
            mimeType: "image/png",
          },
        ],
        deliveryStatus: "sent",
      },
      {
        id: "mail-customer-202609082117",
        direction: "inbound",
        source: "email",
        from: "agramakovamaria@gmail.com",
        to: "support@neewer.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Je n'ai pas besoin d'une facture avec un numéro de TVA, j'ai simplement besoin d'une facture à mon nom Ahramakova Mariia",
        sentAt: "2026-09-08 21:17",
        attachments: [],
      },
      {
        id: "mail-support-202609092021",
        direction: "outbound",
        source: "agent",
        from: "support@neewer.com",
        to: "agramakovamaria@gmail.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "Bonjour,\n\nMerci pour votre réponse rapide.\n\nVous trouverez en pièce jointe de cet e-mail la facture de la commande NF24638 pour votre référence.\n\nSi vous avez des questions entre-temps, n'hésitez pas à nous contacter.\n\nCordialement,\n\nHello,\n\nThanks for your prompt reply.\n\nPlease kindly find the invoice for order NF24638 attached to this email for your reference.\n\nIf you have any questions in the meantime, please don't hesitate to reach out.\n\nBest regards,\nJasmine\n\nCustomer Service\n\nEmail support@neewer.com\nWebsite www.neewer.com\n\nBrand Logo    Follow us on Reddit TikTok Instagram YouTube Facebook Twitter",
        sentAt: "2026-09-09 20:21",
        attachments: [
          {
            id: "att-invoice-nf24638",
            name: "Facture-NF24638.pdf",
            sizeLabel: "412 KB",
            mimeType: "application/pdf",
          },
        ],
        deliveryStatus: "sent",
      },
      {
        id: "mail-customer-202609092249",
        direction: "inbound",
        source: "email",
        from: "agramakovamaria@gmail.com",
        to: "support@neewer.com",
        subject: "Re: Demande de factures pour les commandes N° NF24638",
        body: "1. Commande n° #NF24638 (du 11 août 2026) :\n\nSoftbox Parabolique 90cm — 109,99 €\n\n📌 2. Commande du 7 juillet 2026 :\n\nPied d'éclairage ST-300SS, Parapluie 130cm, Flash Q300 — 397,60 €",
        sentAt: "2026-09-09 22:49",
        attachments: [],
      },
    ],
  },
  {
    id: "TK-WEB-20260818-0042",
    issueType: "logistics",
    title: "订单迟迟未发货",
    description:
      "订单 N210948 已经三天没有物流更新，页面一直显示仓库处理中。请帮我确认预计发货时间。",
    contact: "jane.cooper@example.com",
    attachments: [
      {
        id: "att-widget-order",
        name: "order-status.png",
        sizeLabel: "428 KB",
        mimeType: "image/png",
      },
    ],
    status: "processing",
    priority: "high",
    source: "web_widget",
    customerName: "Jane Cooper",
    submittedAt: "2026-08-18 09:42",
    lastUpdatedAt: "2026-08-18 09:42",
    sourceSessionId: "S2025001",
    relatedOrderId: "N210948",
    replies: [],
    mailbox: supportMailbox,
    threadId: "TH-JANE-210948",
    unread: true,
    assignee: "Marzia",
    messages: [
      {
        id: "mail-widget-0042",
        direction: "inbound",
        source: "web_widget",
        from: "jane.cooper@example.com",
        to: supportMailbox,
        subject: "订单迟迟未发货",
        body: "订单 N210948 已经三天没有物流更新，页面一直显示仓库处理中。请帮我确认预计发货时间。",
        sentAt: "2026-08-18 09:42",
        attachments: [
          {
            id: "att-widget-order",
            name: "order-status.png",
            sizeLabel: "428 KB",
            mimeType: "image/png",
          },
        ],
      },
    ],
  },
  {
    id: "TK-MAIL-20260818-0038",
    issueType: "order",
    title: "Re: Action Required - Verification Needed for Order #N210948",
    description: "客户直接发送邮件，询问订单验证材料和预计处理时间。",
    contact: "odwascanio@gmail.com",
    attachments: [],
    status: "processing",
    priority: "urgent",
    source: "email",
    customerName: "Odw Ascanio",
    submittedAt: "2026-08-18 08:06",
    lastUpdatedAt: "2026-08-18 09:18",
    relatedOrderId: "N210948",
    replies: [
      {
        id: "reply-202608180842",
        channel: "email",
        from: supportMailbox,
        to: "odwascanio@gmail.com",
        subject: "Re: Action Required - Verification Needed for Order #N210948",
        body: "Hello,\n\nThanks for contacting NEEWER Customer Service. Please reply with a clear copy of the requested verification document. We will review it within one business day.",
        sentAt: "2026-08-18 08:42",
      },
    ],
    mailbox: supportMailbox,
    threadId: "TH-ODW-N210948",
    unread: true,
    assignee: "Kevin",
    messages: [
      {
        id: "mail-erp-23901",
        direction: "inbound",
        source: "email",
        from: "odwascanio@gmail.com",
        to: supportMailbox,
        subject: "Action Required - Verification Needed for Order #N210948",
        body: "Hello, I received a request to verify my order. Could you confirm which document is required and whether this will delay shipment?",
        sentAt: "2026-08-18 08:06",
        attachments: [],
      },
      {
        id: "mail-erp-23908",
        direction: "outbound",
        source: "agent",
        from: supportMailbox,
        to: "odwascanio@gmail.com",
        subject: "Re: Action Required - Verification Needed for Order #N210948",
        body: "Hello,\n\nThanks for contacting NEEWER Customer Service. Please reply with a clear copy of the requested verification document. We will review it within one business day.",
        sentAt: "2026-08-18 08:42",
        attachments: [],
        deliveryStatus: "sent",
        includeSignature: true,
      },
      {
        id: "mail-erp-23914",
        direction: "inbound",
        source: "email",
        from: "odwascanio@gmail.com",
        to: supportMailbox,
        subject: "Re: Action Required - Verification Needed for Order #N210948",
        body: "Thanks. I have attached the verification document. Please let me know when the order can be released.",
        sentAt: "2026-08-18 09:18",
        attachments: [
          {
            id: "att-verification",
            name: "verification-document.pdf",
            sizeLabel: "1.8 MB",
            mimeType: "application/pdf",
          },
        ],
      },
    ],
  },
  {
    id: "TK-WEB-20260818-0031",
    issueType: "refund",
    title: "退款超过 7 天还没到账",
    description: "退款申请已经通过，但支付账户还没有收到退款，请确认退款流水和到账时间。",
    contact: "maria.refund@example.com",
    attachments: [],
    status: "closed",
    priority: "high",
    source: "web_widget",
    customerName: "Maria Hill",
    submittedAt: "2026-08-18 07:28",
    lastUpdatedAt: "2026-08-18 08:12",
    sourceSessionId: "S2025005",
    relatedOrderId: "ORD-1003",
    replies: [
      {
        id: "reply-202608180812",
        channel: "email",
        from: supportMailbox,
        to: "maria.refund@example.com",
        subject: "Re: 退款超过 7 天还没到账",
        body: "您好，我们已联系财务核对支付渠道流水，预计一个工作日内通过邮件同步结果。",
        sentAt: "2026-08-18 08:12",
      },
    ],
    mailbox: supportMailbox,
    threadId: "TH-MARIA-REFUND",
    unread: false,
    assignee: "吴金香",
    messages: [
      {
        id: "mail-widget-0031",
        direction: "inbound",
        source: "web_widget",
        from: "maria.refund@example.com",
        to: supportMailbox,
        subject: "退款超过 7 天还没到账",
        body: "退款申请已经通过，但支付账户还没有收到退款，请确认退款流水和到账时间。",
        sentAt: "2026-08-18 07:28",
        attachments: [],
      },
      {
        id: "mail-agent-0031",
        direction: "outbound",
        source: "agent",
        from: supportMailbox,
        to: "maria.refund@example.com",
        subject: "Re: 退款超过 7 天还没到账",
        body: "您好，我们已联系财务核对支付渠道流水，预计一个工作日内通过邮件同步结果。",
        sentAt: "2026-08-18 08:12",
        attachments: [],
        deliveryStatus: "sent",
        includeSignature: true,
      },
    ],
  },
  {
    id: "TK-MAIL-20260817-0096",
    issueType: "product",
    title: "Neewer F100 7 inch monitor compatibility",
    description: "客户直接来信咨询 F100 监视器与 Sony A7 IV 的兼容性。",
    contact: "stalal@rogers.com",
    attachments: [
      {
        id: "att-camera-setup",
        name: "camera-setup.jpg",
        sizeLabel: "864 KB",
        mimeType: "image/jpeg",
      },
    ],
    status: "processing",
    priority: "normal",
    source: "email",
    customerName: "Stan Lal",
    submittedAt: "2026-08-17 23:20",
    lastUpdatedAt: "2026-08-17 23:28",
    replies: [],
    mailbox: "support@neewer.com",
    threadId: "TH-STAN-F100",
    unread: true,
    messages: [
      {
        id: "mail-erp-23877",
        direction: "inbound",
        source: "email",
        from: "stalal@rogers.com",
        to: "support@neewer.com",
        subject: "Neewer F100 7 inch monitor compatibility",
        body: "Hi, is the Neewer F100 7 inch monitor compatible with the Sony A7 IV? I have attached a photo of my current camera setup.",
        sentAt: "2026-08-17 23:20",
        attachments: [
          {
            id: "att-camera-setup",
            name: "camera-setup.jpg",
            sizeLabel: "864 KB",
            mimeType: "image/jpeg",
          },
        ],
      },
      {
        id: "mail-agent-23879",
        direction: "outbound",
        source: "agent",
        from: "support@neewer.com",
        to: "stalal@rogers.com",
        cc: ["product-support@neewer.com"],
        subject: "Re: Neewer F100 7 inch monitor compatibility",
        body: "Hi Stan,\n\nThe F100 can receive the HDMI output from a Sony A7 IV. Please confirm the HDMI cable type shown in your attachment.",
        sentAt: "2026-08-17 23:28",
        attachments: [],
        deliveryStatus: "failed",
        includeSignature: true,
      },
    ],
  },
];

export function getTicketMessages(ticket: SupportTicket): TicketThreadMessage[] {
  if (ticket.messages?.length) return ticket.messages;

  const initialMessage: TicketThreadMessage = {
    id: `mail-${ticket.id}`,
    direction: "inbound",
    source: ticket.source,
    from: ticket.contact,
    to: ticket.mailbox ?? supportMailbox,
    subject: ticket.title,
    body: ticket.description,
    sentAt: ticket.submittedAt,
    attachments: ticket.attachments,
  };
  return [
    initialMessage,
    ...ticket.replies.map((reply) => ({
      id: reply.id,
      direction: "outbound" as const,
      source: "agent" as const,
      from: reply.from,
      to: reply.to,
      cc: reply.cc,
      subject: reply.subject,
      body: reply.body,
      sentAt: reply.sentAt,
      attachments: [],
      deliveryStatus: "sent" as const,
      includeSignature: true,
      action: reply.action,
    })),
  ];
}

export function buildTicketReplyDraft(ticket: SupportTicket): TicketEmailDraft {
  return {
    to: ticket.contact,
    subject: ticket.title.startsWith("Re:") ? ticket.title : `Re: ${ticket.title}`,
    body: [
      `${ticket.customerName} 您好，`,
      "",
      `我们已经收到您提交的工单 ${ticket.id}，问题类型为「${ISSUE_TYPE_LABELS[ticket.issueType]}」。`,
      `您提交的详情：${ticket.description}`,
      "",
      "我们会继续核实并通过邮件同步处理结果。",
      "",
      "客服团队",
    ].join("\n"),
  };
}

export function sendTicketEmail(
  ticket: SupportTicket,
  input: SendTicketEmailInput,
  sentAt = formatDateTime(new Date()),
): SupportTicket {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const body = input.body.trim();
  const action = input.action ?? "reply";
  const cc = (input.cc ?? []).map((address) => address.trim()).filter(Boolean);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("请输入有效的收件邮箱");
  if (cc.some((address) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))) {
    throw new Error("请输入有效的抄送邮箱");
  }
  if (!subject) throw new Error("邮件主题不能为空");
  if (!body) throw new Error("邮件正文不能为空");
  if (ticket.status === "closed") throw new Error("已关闭工单不能发送邮件");

  const from = input.from ?? ticket.mailbox ?? supportMailbox;
  const id = `mail-${sentAt.replace(/\D/g, "").slice(0, 12)}-${ticket.id.slice(-4)}`;
  const reply: TicketReply = {
    id,
    channel: "email",
    from,
    to,
    cc,
    subject,
    body,
    sentAt,
    action,
  };
  const message: TicketThreadMessage = {
    id,
    direction: "outbound",
    source: "agent",
    from,
    to,
    cc,
    subject,
    body,
    bodyHtml: input.bodyHtml?.trim() || undefined,
    sentAt,
    attachments: input.attachments ?? [],
    deliveryStatus: "sent",
    includeSignature: true,
    action,
  };

  return {
    ...ticket,
    contact: action === "forward" ? ticket.contact : to,
    status:
      action === "forward" ? (ticket.status === "new" ? "processing" : ticket.status) : "replied",
    unread: false,
    lastUpdatedAt: sentAt,
    replies: [...ticket.replies, reply],
    messages: [...getTicketMessages(ticket), message],
  };
}

export function getTicketReplyStatus(ticket: SupportTicket): TicketReplyStatus {
  const latestMessage = getTicketMessages(ticket)
    .filter((message) => message.action !== "forward")
    .at(-1);
  if (!latestMessage || latestMessage.direction === "inbound") return "unsent";
  return latestMessage.deliveryStatus === "failed" ? "failed" : "sent";
}

export function completeTicketWithoutReply(
  ticket: SupportTicket,
  completedAt = formatDateTime(new Date()),
): SupportTicket {
  if (ticket.status === "closed") return ticket;
  return {
    ...ticket,
    status: "closed",
    unread: false,
    lastUpdatedAt: completedAt,
  };
}

export function markTicketProcessing(
  ticket: SupportTicket,
  updatedAt = formatDateTime(new Date()),
): SupportTicket {
  if (ticket.status === "processing") return ticket;
  return {
    ...ticket,
    status: "processing",
    unread: false,
    lastUpdatedAt: updatedAt,
  };
}

export function retryFailedTicketEmail(
  ticket: SupportTicket,
  messageId: string,
  sentAt = formatDateTime(new Date()),
): SupportTicket {
  const messages = getTicketMessages(ticket);
  const failedMessage = messages.find(
    (message) =>
      message.id === messageId &&
      message.direction === "outbound" &&
      message.deliveryStatus === "failed",
  );
  if (!failedMessage) throw new Error("未找到可重新发送的失败邮件");

  const sentMessage: TicketThreadMessage = {
    ...failedMessage,
    sentAt,
    deliveryStatus: "sent",
  };
  const existingReplyIndex = ticket.replies.findIndex((reply) => reply.id === messageId);
  const sentReply: TicketReply = {
    id: messageId,
    channel: "email",
    from: failedMessage.from,
    to: failedMessage.to,
    cc: failedMessage.cc,
    subject: failedMessage.subject,
    body: failedMessage.body,
    sentAt,
    action: failedMessage.action,
  };
  const replies = [...ticket.replies];
  if (existingReplyIndex >= 0) replies[existingReplyIndex] = sentReply;
  else replies.push(sentReply);

  return {
    ...ticket,
    status:
      ticket.status === "closed"
        ? "closed"
        : failedMessage.action === "forward"
          ? ticket.status === "new"
            ? "processing"
            : ticket.status
          : "replied",
    unread: false,
    lastUpdatedAt: sentAt,
    replies,
    messages: messages.map((message) => (message.id === messageId ? sentMessage : message)),
  };
}

export function appendTicketReply(
  ticket: SupportTicket,
  body: string,
  from: string,
  sentAt = formatDateTime(new Date()),
): SupportTicket {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error("邮件回复内容不能为空");

  const draft = buildTicketReplyDraft(ticket);
  const reply: TicketReply = {
    id: `reply-${sentAt.replace(/\D/g, "").slice(0, 12)}`,
    channel: "email",
    from,
    to: draft.to,
    subject: draft.subject,
    body: trimmedBody,
    sentAt,
  };

  return {
    ...ticket,
    status: "replied",
    unread: false,
    lastUpdatedAt: sentAt,
    replies: [...ticket.replies, reply],
    messages: [
      ...getTicketMessages(ticket),
      {
        id: reply.id,
        direction: "outbound",
        source: "agent",
        from,
        to: reply.to,
        subject: reply.subject,
        body: reply.body,
        sentAt,
        attachments: [],
        deliveryStatus: "sent",
        includeSignature: true,
      },
    ],
  };
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
