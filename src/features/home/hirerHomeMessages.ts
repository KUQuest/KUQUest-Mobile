import type { SupportedLocale } from "@/locales/locale";

import type {
  CanonicalHirerQuestStatus,
  TimelineStageKey,
} from "./hirerHomeTypes";
export interface HirerHomeMessages {
  title: string;
  subtitle: string;
  loading: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  prototypeLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  activeQuestTitle: string;
  activeQuestCounter: (current: number, total: number) => string;
  viewAllActive: string;
  workerProfile: string;
  assignedWorkerRole: string;
  timelineTitle: string;
  stepProgress: (current: number, total: number) => string;
  currentStageLabel: string;
  terminalStageLabel: string;
  openDetails: string;
  reviewProof: string;
  scheduleStart: string;
  scheduleEnd: string;
  eyebrow: string;
  statActive: string;
  statDrafts: string;
  statCompleted: string;
  statHint: string;
  attentionTitle: string;
  attentionProof: string;
  attentionApplicants: (count: number) => string;
  emptyAction: string;
  shortcutsTitle: string;
  shortcutMyQuestsTitle: string;
  shortcutMyQuestsDesc: string;
  shortcutBoardTitle: string;
  shortcutBoardDesc: string;
  shortcutTopUpTitle: string;
  shortcutTopUpDesc: string;
  shortcutSettingsTitle: string;
  shortcutSettingsDesc: string;
  quickDraftDesc: string;
  statusLabels: Record<CanonicalHirerQuestStatus, string>;
  timelineLabels: Record<TimelineStageKey, string>;
  timelineOverrides: Partial<
    Record<CanonicalHirerQuestStatus, Partial<Record<TimelineStageKey, string>>>
  >;
  applicantsLabel: (count: number) => string;
  joinedLabel: (count: number, max?: number) => string;
  waitingForApplicants: string;
  noApplicantsYet: string;
  viewApplicants: string;
  viewParticipants: string;
  manageQuest: string;
}

export const hirerHomeMessages: Record<SupportedLocale, HirerHomeMessages> = {
  en: {
    title: "Hirer Home",
    subtitle: "Keep an eye on the Quests you posted.",
    loading: "Loading your active Quests",
    errorTitle: "Hirer Home unavailable",
    errorDescription: "We could not load your active Quests. Try again.",
    retry: "Try again",
    prototypeLabel: "Prototype preview",
    emptyTitle: "No active Quests yet",
    emptyDescription:
      "Published Quests with accepted Workers will appear here.",
    activeQuestTitle: "Active Quest",
    activeQuestCounter: (current, total) => `${current} of ${total}`,
    viewAllActive: "View all",
    workerProfile: "View Worker profile",
    assignedWorkerRole: "Assigned Worker",
    timelineTitle: "QUEST TIMELINE",
    stepProgress: (current: number, total: number) =>
      `Step ${current} of ${total}`,
    currentStageLabel: "current",
    terminalStageLabel: "terminal",
    openDetails: "View details",
    reviewProof: "Review proof",
    scheduleStart: "Starts",
    scheduleEnd: "Ends",
    eyebrow: "Hirer workspace",
    statActive: "Active",
    statDrafts: "Drafts",
    statCompleted: "Completed",
    statHint: "Opens in My Quests",
    attentionTitle: "Needs your attention",
    attentionProof: "Proof ready to review",
    attentionApplicants: (count) =>
      `${count} ${count === 1 ? "proposal" : "proposals"} waiting for selection`,
    emptyAction: "Post a Quest",
    shortcutsTitle: "Shortcuts",
    shortcutMyQuestsTitle: "My Quests",
    shortcutMyQuestsDesc: "Every Quest you posted",
    shortcutBoardTitle: "Quest Board",
    shortcutBoardDesc: "Browse all Quests",
    shortcutTopUpTitle: "Top up",
    shortcutTopUpDesc: "PromptPay QR deposit",
    shortcutSettingsTitle: "Settings",
    shortcutSettingsDesc: "Language and account",
    quickDraftDesc: "Saved quest drafts",
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
    applicantsLabel: (count: number) => `Applicants (${count})`,
    joinedLabel: (count: number, max?: number) =>
      max ? `Joined (${count}/${max})` : `Joined (${count})`,
    waitingForApplicants: "Awaiting applicants or workers",
    noApplicantsYet: "No applicants yet",
    viewApplicants: "View applicants",
    viewParticipants: "View participants",
    manageQuest: "Manage quest",
  },
  th: {
    title: "หน้าหลักผู้ว่าจ้าง",
    subtitle: "ติดตามเควสต์ที่คุณโพสต์ไว้",
    loading: "กำลังโหลดเควสต์ที่กำลังดำเนินการ",
    errorTitle: "ไม่สามารถโหลดหน้าหลักผู้ว่าจ้างได้",
    errorDescription: "ไม่สามารถโหลดเควสต์ที่กำลังดำเนินการได้ ลองอีกครั้ง",
    retry: "ลองอีกครั้ง",
    prototypeLabel: "ตัวอย่างหน้าจอ",
    emptyTitle: "ยังไม่มีเควสต์ที่กำลังดำเนินการ",
    emptyDescription: "เควสต์ที่เผยแพร่และมีผู้ทำงานตอบรับจะแสดงที่นี่",
    activeQuestTitle: "เควสต์ที่กำลังดำเนินการ",
    activeQuestCounter: (current, total) => `${current}/${total}`,
    viewAllActive: "ดูทั้งหมด",
    workerProfile: "ดูโปรไฟล์ผู้ทำงาน",
    assignedWorkerRole: "ผู้รับผิดชอบงาน",
    timelineTitle: "ลำดับการทำงาน",
    stepProgress: (current: number, total: number) =>
      `ขั้นตอนที่ ${current} จาก ${total}`,
    currentStageLabel: "สถานะปัจจุบัน",
    terminalStageLabel: "สถานะสิ้นสุด",
    openDetails: "ดูรายละเอียด",
    reviewProof: "ตรวจงาน",
    scheduleStart: "เริ่มงาน",
    scheduleEnd: "สิ้นสุด",
    eyebrow: "พื้นที่ผู้ว่าจ้าง",
    statActive: "กำลังดำเนินการ",
    statDrafts: "ฉบับร่าง",
    statCompleted: "เสร็จสิ้น",
    statHint: "เปิดในเควสต์ของฉัน",
    attentionTitle: "รอคุณดำเนินการ",
    attentionProof: "มีงานส่งรอตรวจ",
    attentionApplicants: (count) => `ผู้สมัคร ${count} รายการรอคัดเลือก`,
    emptyAction: "โพสต์เควสต์",
    shortcutsTitle: "ทางลัด",
    shortcutMyQuestsTitle: "เควสต์ของฉัน",
    shortcutMyQuestsDesc: "เควสต์ทั้งหมดที่คุณโพสต์",
    shortcutBoardTitle: "กระดานเควสต์",
    shortcutBoardDesc: "ดูเควสต์ทั้งหมดในกระดาน",
    shortcutTopUpTitle: "เติมเงิน",
    shortcutTopUpDesc: "เติมเงินผ่านพร้อมเพย์",
    shortcutSettingsTitle: "การตั้งค่า",
    shortcutSettingsDesc: "ภาษาและบัญชี",
    quickDraftDesc: "เควสต์ที่ยังไม่เผยแพร่",
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
    applicantsLabel: (count: number) => `ผู้สมัคร (${count} คน)`,
    joinedLabel: (count: number, max?: number) =>
      max ? `ผู้เข้าร่วม (${count}/${max} คน)` : `ผู้เข้าร่วม (${count} คน)`,
    waitingForApplicants: "รอผู้สมัครหรือผู้ตอบรับ",
    noApplicantsYet: "ยังไม่มีผู้สมัคร",
    viewApplicants: "ดูผู้สมัคร",
    viewParticipants: "ดูผู้เข้าร่วม",
    manageQuest: "จัดการเควสต์",
  },
};
