import type { QuestNextAction, QuestStatus } from "@/domain/questLifecycle";
import {
  QuestNextAction as NextAction,
  QuestStatus as Status,
} from "@/domain/questLifecycle";
import type { SupportedLocale } from "./locale";

export type QuestStatusLabels = Record<QuestStatus, string>;
export type QuestNextActionLabels = Record<QuestNextAction, string>;

const enStatus: QuestStatusLabels = {
  [Status.QUEST_DRAFT]: "Draft",
  [Status.QUEST_OPEN]: "Open",
  [Status.QUEST_AWAITING_CONSENT]: "Awaiting Worker consent",
  [Status.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT]: "Awaiting start consent",
  [Status.QUEST_AWAITING_EDIT_CONSENT]: "Awaiting edit consent",
  [Status.QUEST_ASSIGNED]: "Assigned",
  [Status.QUEST_IN_PROGRESS]: "In progress",
  [Status.QUEST_SUBMITTED]: "Proof submitted",
  [Status.QUEST_APPROVED]: "Approved",
  [Status.QUEST_REWORK]: "Rework requested",
  [Status.QUEST_COMPLETED]: "Completed",
  [Status.QUEST_CANCELLED]: "Cancelled",
  [Status.QUEST_FAILED]: "Failed",
  [Status.QUEST_DISPUTED]: "Disputed",
  [Status.QUEST_HIDDEN]: "Hidden",
};

const thStatus: QuestStatusLabels = {
  [Status.QUEST_DRAFT]: "ฉบับร่าง",
  [Status.QUEST_OPEN]: "เปิดรับผู้เข้าร่วม",
  [Status.QUEST_AWAITING_CONSENT]: "รอความยินยอมจากผู้ทำงาน",
  [Status.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT]: "รออนุมัติเริ่มงาน",
  [Status.QUEST_AWAITING_EDIT_CONSENT]: "รออนุมัติการแก้ไข",
  [Status.QUEST_ASSIGNED]: "มอบหมายแล้ว",
  [Status.QUEST_IN_PROGRESS]: "กำลังทำงาน",
  [Status.QUEST_SUBMITTED]: "ส่งหลักฐานแล้ว",
  [Status.QUEST_APPROVED]: "อนุมัติแล้ว",
  [Status.QUEST_REWORK]: "ขอแก้ไขหลักฐาน",
  [Status.QUEST_COMPLETED]: "เสร็จสิ้น",
  [Status.QUEST_CANCELLED]: "ยกเลิกแล้ว",
  [Status.QUEST_FAILED]: "ไม่สำเร็จ",
  [Status.QUEST_DISPUTED]: "มีข้อพิพาท",
  [Status.QUEST_HIDDEN]: "ซ่อนอยู่",
};

const enActions: QuestNextActionLabels = {
  [NextAction.NONE]: "None",
  [NextAction.JOIN]: "Join",
  [NextAction.APPLY]: "Apply",
  [NextAction.WITHDRAW_APPLICATION]: "Withdraw application",
  [NextAction.CREATE_TEAM]: "Create team",
  [NextAction.JOIN_TEAM]: "Join team",
  [NextAction.SUBMIT_TEAM]: "Submit team",
  [NextAction.SELECT_CANDIDATE]: "Select candidate",
  [NextAction.SELECT_TEAM]: "Select team",
  [NextAction.DECIDE_UNDERFILLED]: "Decide on underfilled Quest",
  [NextAction.CONSENT_UNDERFILLED]: "Consent to start",
  [NextAction.RESPOND_TO_EDIT]: "Respond to edit",
  [NextAction.WAIT_FOR_START]: "Waiting for start",
  [NextAction.SUBMIT_PROOF]: "Submit proof",
  [NextAction.CONFIRM_COMPLETION]: "Confirm completion",
  [NextAction.REVIEW_PROOF]: "Review proof",
  [NextAction.CANCEL]: "Cancel",
  [NextAction.CREATE_REVIEW]: "Write a review",
};

const thActions: QuestNextActionLabels = {
  [NextAction.NONE]: "ไม่มี",
  [NextAction.JOIN]: "เข้าร่วม",
  [NextAction.APPLY]: "สมัคร",
  [NextAction.WITHDRAW_APPLICATION]: "ถอนใบสมัคร",
  [NextAction.CREATE_TEAM]: "สร้างทีม",
  [NextAction.JOIN_TEAM]: "เข้าร่วมทีม",
  [NextAction.SUBMIT_TEAM]: "ส่งทีม",
  [NextAction.SELECT_CANDIDATE]: "เลือกผู้สมัคร",
  [NextAction.SELECT_TEAM]: "เลือกทีม",
  [NextAction.DECIDE_UNDERFILLED]: "ตัดสินใจเควสต์คนไม่เต็ม",
  [NextAction.CONSENT_UNDERFILLED]: "ยินยอมเริ่มงาน",
  [NextAction.RESPOND_TO_EDIT]: "ตอบรับการแก้ไข",
  [NextAction.WAIT_FOR_START]: "รอเริ่มงาน",
  [NextAction.SUBMIT_PROOF]: "ส่งหลักฐาน",
  [NextAction.CONFIRM_COMPLETION]: "ยืนยันการเสร็จสิ้น",
  [NextAction.REVIEW_PROOF]: "ตรวจสอบหลักฐาน",
  [NextAction.CANCEL]: "ยกเลิก",
  [NextAction.CREATE_REVIEW]: "เขียนรีวิว",
};

export const questStatusLabels: Record<SupportedLocale, QuestStatusLabels> = {
  en: enStatus,
  th: thStatus,
};
export const questNextActionLabels: Record<
  SupportedLocale,
  QuestNextActionLabels
> = { en: enActions, th: thActions };
