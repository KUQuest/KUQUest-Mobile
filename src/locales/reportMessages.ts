import type { MessageReportReason } from "@/api/ChatApi";
import type { SupportedLocale } from "./locale";

export interface ReportMessages {
  title: string;
  intro: string;
  reviewIntro: string;
  contextLabel: string;
  contextDescription: string;
  contextSender: (name: string) => string;
  contextConversation: (title: string) => string;
  reasonLabel: string;
  reasonRequired: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  detailsHint: string;
  detailsTooLong: string;
  noDetails: string;
  reviewReason: string;
  reviewDetails: string;
  close: string;
  review: string;
  edit: string;
  submit: string;
  submitting: string;
  retry: string;
  submitError: string;
  back: string;
  backToChat: string;
  successTitle: string;
  successDescription: string;
  unavailableTitle: string;
  unavailableDescription: string;
  reasonOptions: Record<MessageReportReason, string>;
}

export const reportMessages: Record<SupportedLocale, ReportMessages> = {
  en: {
    title: "Report message",
    intro:
      "Select a reason and optionally provide details for KUQuest Admin review.",
    reviewIntro:
      "Review the information before sending it to the KUQuest Admin team.",
    contextLabel: "Report context",
    contextDescription:
      "This report will be sent to the KUQuest Admin team for review.",
    contextSender: (name) => `Reported sender: ${name}`,
    contextConversation: (title) => `Conversation: ${title}`,
    reasonLabel: "Reason for report",
    reasonRequired: "Choose a report reason.",
    detailsLabel: "Report details",
    detailsPlaceholder:
      "Describe what happened and include the relevant context.",
    detailsHint:
      "Avoid sharing passwords or other sensitive account information.",
    detailsTooLong: "Details must not exceed 1000 characters.",
    noDetails: "No additional details provided.",
    reviewReason: "Reason",
    reviewDetails: "Details",
    close: "Close",
    review: "Review report",
    edit: "Edit report",
    submit: "Send report to Admin",
    submitting: "Sending report...",
    retry: "Try again",
    submitError: "Failed to send report. Please try again.",
    back: "Go back",
    backToChat: "Back to chat",
    successTitle: "Report sent to Admin",
    successDescription: "Your report was recorded for KUQuest Admin review.",
    unavailableTitle: "Report unavailable",
    unavailableDescription:
      "The message cannot be found or is not available to report.",
    reasonOptions: {
      REPORT_ABUSIVE_OR_HARASSMENT: "Abusive language or harassment",
      REPORT_SPAM: "Spam or unwanted advertising",
      REPORT_INAPPROPRIATE_CONTENT: "Inappropriate or explicit content",
      REPORT_DANGER_OR_THREAT: "Danger, threat, or harm",
      REPORT_OTHER: "Other issue",
    },
  },
  th: {
    title: "รายงานข้อความ",
    intro:
      "เลือกเหตุผลและระบุรายละเอียดเพิ่มเติม (หากมี) เพื่อให้ทีมแอดมิน KUQuest ตรวจสอบ",
    reviewIntro: "ตรวจสอบข้อมูลก่อนส่งให้ทีมแอดมิน KUQuest",
    contextLabel: "บริบทการรายงาน",
    contextDescription: "รายงานนี้จะถูกส่งให้ทีมแอดมิน KUQuest ตรวจสอบ",
    contextSender: (name) => `ผู้ส่งที่ถูกรายงาน: ${name}`,
    contextConversation: (title) => `บทสนทนา: ${title}`,
    reasonLabel: "เหตุผลในการรายงาน",
    reasonRequired: "กรุณาเลือกเหตุผลในการรายงาน",
    detailsLabel: "รายละเอียดการรายงาน",
    detailsPlaceholder: "อธิบายเหตุการณ์และบริบทที่เกี่ยวข้องโดยละเอียด",
    detailsHint: "หลีกเลี่ยงการระบุรหัสผ่านหรือข้อมูลบัญชีที่เป็นความลับ",
    detailsTooLong: "รายละเอียดต้องมีความยาวไม่เกิน 1,000 ตัวอักษร",
    noDetails: "ไม่มีรายละเอียดเพิ่มเติม",
    reviewReason: "เหตุผล",
    reviewDetails: "รายละเอียด",
    close: "ปิด",
    review: "ตรวจสอบรายงาน",
    edit: "แก้ไขรายงาน",
    submit: "ส่งรายงานให้แอดมิน",
    submitting: "กำลังส่งรายงาน...",
    retry: "ลองใหม่อีกครั้ง",
    submitError: "ไม่สามารถส่งรายงานได้ กรุณาลองใหม่อีกครั้ง",
    back: "ย้อนกลับ",
    backToChat: "กลับไปแชต",
    successTitle: "ส่งรายงานให้แอดมินแล้ว",
    successDescription: "รายงานนี้ถูกบันทึกเพื่อให้ทีมแอดมิน KUQuest ตรวจสอบ",
    unavailableTitle: "ไม่สามารถรายงานได้",
    unavailableDescription: "ไม่พบข้อความหรือไม่สามารถรายงานข้อความนี้ได้",
    reasonOptions: {
      REPORT_ABUSIVE_OR_HARASSMENT: "ข้อความไม่เหมาะสมหรือการคุกคาม",
      REPORT_SPAM: "สแปมหรือโฆษณาที่ไม่พึงประสงค์",
      REPORT_INAPPROPRIATE_CONTENT: "เนื้อหาที่ไม่เหมาะสมหรือไม่สมควร",
      REPORT_DANGER_OR_THREAT: "อันตราย การคุกคาม หรือความรุนแรง",
      REPORT_OTHER: "ปัญหาอื่นๆ",
    },
  },
};
