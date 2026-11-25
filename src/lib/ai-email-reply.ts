import { getTicketMessages, type SupportTicket } from "./ticket-replies.ts";

export function buildMockEmailReply(ticket: SupportTicket): string {
  if (ticket.source === "amazon_email" || ticket.status === "closed") {
    throw new Error("当前邮件不支持 AI 回复");
  }
  const latest = getTicketMessages(ticket)
    .filter((message) => message.direction === "inbound")
    .at(-1);
  const context = `${ticket.title}\n${latest?.body ?? ticket.description}`;
  const order = ticket.relatedOrderId;
  if (/facture|bonjour|cordialement/i.test(context)) {
    return `Bonjour,\n\nMerci de contacter le service client NEEWER.${order ? ` Nous avons bien reçu votre demande concernant la commande ${order}.` : " Nous avons bien reçu votre demande."}\n\n${
      /facture/i.test(context)
        ? "Nous allons vérifier les informations de vos commandes et votre demande de facture. Merci de confirmer les numéros de commande concernés ainsi que le nom et l’adresse de facturation souhaités."
        : "Afin de mieux vous aider, pourriez-vous nous transmettre les détails du problème ainsi que votre numéro de commande ? Nous vérifierons ces informations et vous tiendrons informé(e)."
    }\n\nMerci pour votre patience.\n\nCordialement,\nNEEWER Customer Service`;
  }
  const chinese = /[\u4e00-\u9fff]/.test(context);
  const replies = {
    logistics: chinese
      ? "关于您反馈的物流问题，我们会核实订单的发货与物流记录。请确认订单号，如有物流页面截图也可一并提供，便于进一步排查。"
      : "We will review the shipping and tracking records for your order. Please confirm your order number and share a screenshot of the tracking details, if available, so we can investigate further.",
    refund: chinese
      ? "关于您反馈的退款问题，我们会核实退款申请和处理进度。请提供订单号及退款申请时间，便于进一步查询。"
      : "We will review your refund request and its processing status. Please share your order number and the date of your refund request so we can check the details.",
    product: chinese
      ? "关于您的产品咨询，请提供产品型号和具体使用需求，我们会核对相关信息，为您提供进一步建议。"
      : "Please share the product model and your intended use. We will review the relevant specifications and help you find the information you need.",
    technical: chinese
      ? "关于您反馈的产品问题，请提供产品型号、使用环境以及问题照片或视频。我们会根据这些信息进一步排查，并提供相应的处理建议。"
      : "Please share the product model, your setup, and photos or a short video showing the issue. We will review these details and suggest the appropriate troubleshooting steps.",
    order: chinese
      ? "关于您的订单问题，请确认订单号及需要处理的具体事项，我们会核对订单记录，并通过邮件向您反馈。"
      : "Please confirm your order number and the specific assistance you need. We will review the order details and follow up by email.",
    other: chinese
      ? "我们已收到您的问题。请补充相关订单号、产品型号或问题详情，以便我们进一步核实并为您提供帮助。"
      : "We have received your inquiry. Please share any relevant order number, product model, or additional details so we can review your request and assist you further.",
  };
  return chinese
    ? `您好，\n\n感谢您联系 NEEWER 客服。${order ? `已收到您关于订单 ${order} 的咨询。` : ""}\n\n${replies[ticket.issueType]}\n\n感谢您的理解与耐心，我们会在核实后尽快回复。\n\nNEEWER 客服团队`
    : `Hello,\n\nThank you for contacting NEEWER Customer Service.${order ? ` We have received your inquiry about order ${order}.` : ""}\n\n${replies[ticket.issueType]}\n\nThank you for your patience. We will follow up once we have reviewed the details.\n\nBest regards,\nNEEWER Customer Service`;
}

export async function generateMockEmailReply(
  ticket: SupportTicket,
  signal: AbortSignal,
): Promise<string> {
  signal.throwIfAborted();
  const reply = buildMockEmailReply(ticket);
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 900);
    signal.addEventListener("abort", abort, { once: true });
  });
  signal.throwIfAborted();
  return reply;
}
