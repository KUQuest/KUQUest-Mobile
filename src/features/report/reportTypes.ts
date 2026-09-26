import type { MessageReportReason } from "@/api/ChatApi";

export interface ReportRouteParams {
  messageId?: string;
  conversationTitle?: string;
  senderName?: string;
}

export interface ReportFormValue {
  reason: MessageReportReason;
  detail: string;
}
