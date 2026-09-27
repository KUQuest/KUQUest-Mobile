import type { SupportedLocale } from "./locale";

export const notificationMessages: Record<
  SupportedLocale,
  {
    questUpdate: string;
    applicationTitle: string;
    chatTitle: string;
    newMessage: (questTitle: string) => string;
    applicationSelected: (questTitle: string) => string;
    applicationRejected: (questTitle: string) => string;
    dismiss: string;
    questChanges: Record<string, string>;
  }
> = {
  en: {
    questUpdate: "Quest update",
    applicationTitle: "Application update",
    chatTitle: "New message",
    newMessage: (questTitle) => questTitle,
    applicationSelected: (questTitle) => `You were selected for ${questTitle}.`,
    applicationRejected: (questTitle) =>
      `Your application for ${questTitle} was not selected.`,
    dismiss: "Dismiss notification",
    questChanges: {
      ASSIGNMENT_ROSTER_UPDATED: "The Worker roster changed.",
      QUEST_STARTED: "Quest work has started.",
      PROOF_SUBMITTED: "Work proof was submitted.",
      PROOF_REVIEWED: "Work proof was reviewed.",
      PROOF_AUTO_APPROVED: "Work proof was approved automatically.",
      COMPLETION_CONFIRMED: "Quest completion was confirmed.",
      QUEST_COMPLETED: "Quest was completed.",
      QUEST_FAILED: "Quest failed.",
      QUEST_CANCELLED: "Quest was cancelled.",
      QUEST_OPEN_EDIT_UPDATED: "An open Quest was updated.",
      QUEST_EDIT_UPDATED: "A Quest edit was updated.",
      CANDIDATE_ROSTER_UPDATED: "The candidate roster changed.",
    },
  },
  th: {
    questUpdate: "อัปเดตเควสต์",
    applicationTitle: "อัปเดตใบสมัคร",
    chatTitle: "ข้อความใหม่",
    newMessage: (questTitle) => questTitle,
    applicationSelected: (questTitle) => `คุณได้รับเลือกสำหรับ${questTitle}`,
    applicationRejected: (questTitle) =>
      `ใบสมัครของคุณสำหรับ${questTitle}ไม่ได้รับเลือก`,
    dismiss: "ปิดการแจ้งเตือน",
    questChanges: {
      ASSIGNMENT_ROSTER_UPDATED: "รายชื่อผู้ปฏิบัติงานมีการเปลี่ยนแปลง",
      QUEST_STARTED: "เริ่มทำเควสต์แล้ว",
      PROOF_SUBMITTED: "ส่งหลักฐานงานแล้ว",
      PROOF_REVIEWED: "ตรวจสอบหลักฐานงานแล้ว",
      PROOF_AUTO_APPROVED: "หลักฐานงานได้รับการอนุมัติโดยอัตโนมัติ",
      COMPLETION_CONFIRMED: "ยืนยันการทำเควสต์เสร็จแล้ว",
      QUEST_COMPLETED: "ทำเควสต์เสร็จแล้ว",
      QUEST_FAILED: "เควสต์ไม่สำเร็จ",
      QUEST_CANCELLED: "ยกเลิกเควสต์แล้ว",
      QUEST_OPEN_EDIT_UPDATED: "อัปเดตเควสต์ที่เปิดรับแล้ว",
      QUEST_EDIT_UPDATED: "อัปเดตการแก้ไขเควสต์แล้ว",
      CANDIDATE_ROSTER_UPDATED: "รายชื่อผู้สมัครมีการเปลี่ยนแปลง",
    },
  },
};
