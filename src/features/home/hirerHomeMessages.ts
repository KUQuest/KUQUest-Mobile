import type { SupportedLocale } from "@/locales/LocaleProvider";

import type {
  CanonicalHirerQuestStatus,
  TimelineStageKey,
} from "./hirerHomeData";

export interface HirerHomeMessages {
  title: string;
  subtitle: string;
  prototypeLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  activeQuestTitle: string;
  workerProfile: string;
  assignedWorkerRole: string;
  timelineTitle: string;
  stepProgress: (current: number, total: number) => string;
  currentStageLabel: string;
  terminalStageLabel: string;
  openDetails: string;
  dueAt: (value: string) => string;
  quickAccessTitle: string;
  quickActiveTitle: string;
  quickActiveDesc: string;
  quickDraftTitle: string;
  quickDraftDesc: string;
  quickHistoryTitle: string;
  quickHistoryDesc: string;
  quickBoardTitle: string;
  quickBoardDesc: string;
  quickTopUpTitle: string;
  quickTopUpDesc: string;
  statusLabels: Record<CanonicalHirerQuestStatus, string>;
  timelineLabels: Record<TimelineStageKey, string>;
  timelineOverrides: Partial<
    Record<CanonicalHirerQuestStatus, Partial<Record<TimelineStageKey, string>>>
  >;
}

export const hirerHomeMessages: Record<SupportedLocale, HirerHomeMessages> = {
  en: {
    title: "Hirer Home",
    subtitle: "Keep an eye on the Quests you posted.",
    prototypeLabel: "Prototype preview",
    emptyTitle: "No active Quests yet",
    emptyDescription:
      "Published Quests with accepted Workers will appear here.",
    activeQuestTitle: "Active Quest",
    workerProfile: "View Worker profile",
    assignedWorkerRole: "Assigned Worker",
    timelineTitle: "QUEST TIMELINE",
    stepProgress: (current: number, total: number) =>
      `Step ${current} of ${total}`,
    currentStageLabel: "current",
    terminalStageLabel: "terminal",
    openDetails: "Open details",
    dueAt: (value) => value,
    quickAccessTitle: "Quick Actions",
    quickActiveTitle: "In Progress",
    quickActiveDesc: "Active quests",
    quickDraftTitle: "Drafts",
    quickDraftDesc: "Saved quest drafts",
    quickHistoryTitle: "History",
    quickHistoryDesc: "Completed quests",
    quickBoardTitle: "Quest Board",
    quickBoardDesc: "Browse all quests",
    quickTopUpTitle: "Top-up",
    quickTopUpDesc: "PromptPay QR deposit",
    statusLabels: {
      QUEST_DRAFT: "Draft",
      QUEST_OPEN: "Open for applications",
      QUEST_ASSIGNED: "Ready to start",
      QUEST_IN_PROGRESS: "In progress",
      QUEST_COMPLETED: "Completed",
      QUEST_CANCELLED: "Cancelled",
      QUEST_FAILED: "Not completed",
    },
    timelineLabels: {
      open: "Open for applications",
      assigned: "Ready to start",
      inProgress: "In progress",
      review: "Submit & review",
      completed: "Complete",
    },
    timelineOverrides: {
      QUEST_DRAFT: { open: "Preparing Quest" },
      QUEST_CANCELLED: { completed: "Cancelled" },
      QUEST_FAILED: { review: "Not completed" },
    },
  },
  th: {
    title: "หน้าหลักผู้ว่าจ้าง",
    subtitle: "ติดตามเควสต์ที่คุณโพสต์ไว้",
    prototypeLabel: "ตัวอย่างหน้าจอ",
    emptyTitle: "ยังไม่มีเควสต์ที่กำลังดำเนินการ",
    emptyDescription: "เควสต์ที่เผยแพร่และมีผู้ทำงานตอบรับจะแสดงที่นี่",
    activeQuestTitle: "เควสต์ที่กำลังดำเนินการ",
    workerProfile: "ดูโปรไฟล์ผู้ทำงาน",
    assignedWorkerRole: "ผู้รับผิดชอบงาน",
    timelineTitle: "ลำดับการทำงาน",
    stepProgress: (current: number, total: number) =>
      `ขั้นตอนที่ ${current} จาก ${total}`,
    currentStageLabel: "สถานะปัจจุบัน",
    terminalStageLabel: "สถานะสิ้นสุด",
    openDetails: "เปิดรายละเอียด",
    dueAt: (value) => value,
    quickAccessTitle: "เมนูลัด",
    quickActiveTitle: "กำลังทำงาน",
    quickActiveDesc: "เควสต์ที่กำลังดำเนินการ",
    quickDraftTitle: "ฉบับร่าง",
    quickDraftDesc: "เควสต์ที่ยังไม่เผยแพร่",
    quickHistoryTitle: "ประวัติ",
    quickHistoryDesc: "เควสต์ที่เสร็จสิ้นแล้ว",
    quickBoardTitle: "กระดานเควสต์",
    quickBoardDesc: "ค้นหาและดูเควสต์ทั้งหมด",
    quickTopUpTitle: "เติมเงิน",
    quickTopUpDesc: "เติมเงินผ่านพร้อมเพย์",
    statusLabels: {
      QUEST_DRAFT: "ฉบับร่าง",
      QUEST_OPEN: "เปิดรับสมัคร",
      QUEST_ASSIGNED: "รอเริ่มงาน",
      QUEST_IN_PROGRESS: "กำลังทำงาน",
      QUEST_COMPLETED: "เสร็จสิ้น",
      QUEST_CANCELLED: "ยกเลิกแล้ว",
      QUEST_FAILED: "ไม่สำเร็จ",
    },
    timelineLabels: {
      open: "เปิดรับสมัคร",
      assigned: "รอเริ่มงาน",
      inProgress: "กำลังทำงาน",
      review: "ส่งงาน / ตรวจรับ",
      completed: "เสร็จสิ้น",
    },
    timelineOverrides: {
      QUEST_DRAFT: { open: "กำลังเตรียมเควสต์" },
      QUEST_CANCELLED: { completed: "ยกเลิกแล้ว" },
      QUEST_FAILED: { review: "ไม่สำเร็จ" },
    },
  },
};
