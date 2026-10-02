import {
  QuestV2CancellationReason,
  type QuestV2UnderfilledCancellationReason,
} from "@/api/questV2Contracts";
import type { SupportedLocale } from "./locale";

export const notificationMessages: Record<
  SupportedLocale,
  {
    questUpdate: string;
    applicationTitle: string;
    chatTitle: string;
    newMessage: (questTitle: string) => string;
    hirerDecisionPending: (countdown: string) => string;
    applicationSelected: (questTitle: string) => string;
    applicationRejected: (questTitle: string) => string;
    underfilledConsentRequired: () => string;
    underfilledDecisionPending: () => string;
    questFullOrAssigned: () => string;
    underfilledCancelled: (
      reason: QuestV2UnderfilledCancellationReason | null
    ) => string;
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
    hirerDecisionPending: (countdown) =>
      `Not enough workers joined. Choose whether to proceed or cancel within ${countdown}.`,
    underfilledConsentRequired: () => "A quest you joined needs your response.",
    underfilledDecisionPending: () =>
      "Not enough workers joined. Waiting for the Hirer's decision.",
    questFullOrAssigned: () => "A quest you joined is now assigned.",
    underfilledCancelled: (reason) =>
      reason === "HIRER_CANCELLED"
        ? "The Hirer cancelled a quest you joined."
        : reason === "HIRER_NO_DECISION"
          ? "The Hirer did not decide in time; a quest you joined was cancelled."
          : reason === "WORKER_DECLINED"
            ? "A worker declined revised terms; a quest you joined was cancelled."
            : reason === QuestV2CancellationReason.CONSENT_TIMEOUT
              ? "A worker did not respond in time; a quest you joined was cancelled."
              : "A quest you joined was cancelled.",
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
      UNDERFILLED_DECISION_PENDING:
        "This Quest has fewer Workers than needed. Choose whether to proceed or cancel.",
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
    hirerDecisionPending: (countdown) =>
      `ผู้ปฏิบัติงานยังไม่ครบ เลือกว่าจะดำเนินการต่อหรือยกเลิกภายใน ${countdown}`,
    underfilledConsentRequired: () => "เควสต์ที่คุณเข้าร่วมต้องการคำตอบจากคุณ",
    underfilledDecisionPending: () =>
      "ผู้ปฏิบัติงานยังไม่ครบ กำลังรอผู้ว่าจ้างตัดสินใจ",
    questFullOrAssigned: () => "เควสต์ที่คุณเข้าร่วมได้รับมอบหมายแล้ว",
    underfilledCancelled: (reason) =>
      reason === "HIRER_CANCELLED"
        ? "ผู้ว่าจ้างยกเลิกเควสต์ที่คุณเข้าร่วม"
        : reason === "HIRER_NO_DECISION"
          ? "ผู้ว่าจ้างไม่ได้ตัดสินใจภายในเวลา เควสต์ที่คุณเข้าร่วมจึงถูกยกเลิก"
          : reason === "WORKER_DECLINED"
            ? "ผู้ปฏิบัติงานปฏิเสธเงื่อนไขใหม่ เควสต์ที่คุณเข้าร่วมจึงถูกยกเลิก"
            : reason === QuestV2CancellationReason.CONSENT_TIMEOUT
              ? "ผู้ปฏิบัติงานไม่ได้ตอบรับภายในเวลา เควสต์ที่คุณเข้าร่วมจึงถูกยกเลิก"
              : "เควสต์ที่คุณเข้าร่วมถูกยกเลิก",
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
      UNDERFILLED_DECISION_PENDING:
        "เควสต์มีผู้ปฏิบัติงานไม่ครบ ต้องเลือกว่าจะดำเนินการต่อหรือยกเลิก",
    },
  },
};
