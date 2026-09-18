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
  activeQuestCounter: (current: number, total: number) => string;
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
  applicantsLabel: (count: number) => string;
  joinedLabel: (count: number, max?: number) => string;
  waitingForApplicants: string;
  noApplicantsYet: string;
  viewApplicants: string;
  viewParticipants: string;
  manageQuest: string;
  rosterModalTitle: string;
  joinedSectionTitle: string;
  applicantsSectionTitle: string;
  noRosterYet: string;
  openManageQuest: string;
  viewProfile: string;
  close: string;
  selectRosterTitle: string;
  confirmSelectCandidateTitle: string;
  confirmSelectCandidateMessage: string;
  confirmSelectTeamTitle: string;
  confirmSelectTeamMessage: string;
  confirmRejectCandidateTitle: string;
  confirmRejectTeamTitle: string;
  confirmRejectMessage: string;
  noSelectionNeeded: string;
  actionFailedTitle: string;
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
    activeQuestCounter: (current, total) => `${current} of ${total}`,
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
    applicantsLabel: (count: number) => `Applicants (${count})`,
    joinedLabel: (count: number, max?: number) =>
      max ? `Joined (${count}/${max})` : `Joined (${count})`,
    waitingForApplicants: "Awaiting applicants or workers",
    noApplicantsYet: "No applicants yet",
    viewApplicants: "View applicants",
    viewParticipants: "View participants",
    manageQuest: "Manage quest",
    rosterModalTitle: "Quest Participants & Applicants",
    joinedSectionTitle: "Joined Workers",
    applicantsSectionTitle: "Applicants",
    noRosterYet: "No workers or applicants yet for this quest.",
    openManageQuest: "Manage quest & select candidates",
    viewProfile: "View profile",
    close: "Close",
    selectRosterTitle: "Select Roster",
    confirmSelectCandidateTitle: "Select this candidate?",
    confirmSelectCandidateMessage:
      "This assigns the Quest to them and automatically rejects every other applicant. This can't be undone.",
    confirmSelectTeamTitle: "Select this team?",
    confirmSelectTeamMessage:
      "This assigns the Quest to every team member and automatically rejects every other team. This can't be undone.",
    confirmRejectCandidateTitle: "Reject this candidate?",
    confirmRejectTeamTitle: "Reject this team?",
    confirmRejectMessage: "They will no longer be considered for this Quest.",
    noSelectionNeeded: "This Quest fills automatically — no selection needed.",
    actionFailedTitle: "Action failed",
  },
  th: {
    title: "หน้าหลักผู้ว่าจ้าง",
    subtitle: "ติดตามเควสต์ที่คุณโพสต์ไว้",
    prototypeLabel: "ตัวอย่างหน้าจอ",
    emptyTitle: "ยังไม่มีเควสต์ที่กำลังดำเนินการ",
    emptyDescription: "เควสต์ที่เผยแพร่และมีผู้ทำงานตอบรับจะแสดงที่นี่",
    activeQuestTitle: "เควสต์ที่กำลังดำเนินการ",
    activeQuestCounter: (current, total) => `${current}/${total}`,
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
    applicantsLabel: (count: number) => `ผู้สมัคร (${count} คน)`,
    joinedLabel: (count: number, max?: number) =>
      max ? `ผู้เข้าร่วม (${count}/${max} คน)` : `ผู้เข้าร่วม (${count} คน)`,
    waitingForApplicants: "รอผู้สมัครหรือผู้ตอบรับ",
    noApplicantsYet: "ยังไม่มีผู้สมัคร",
    viewApplicants: "ดูผู้สมัคร",
    viewParticipants: "ดูผู้เข้าร่วม",
    manageQuest: "จัดการเควสต์",
    rosterModalTitle: "ผู้เข้าร่วมและผู้สมัครเควสต์",
    joinedSectionTitle: "ผู้เข้าร่วมที่ตอบรับแล้ว",
    applicantsSectionTitle: "ผู้สมัคร",
    noRosterYet: "ยังไม่มีผู้สมัครหรือผู้เข้าร่วมสำหรับเควสต์นี้",
    openManageQuest: "จัดการเควสต์และคัดเลือกผู้สมัคร",
    viewProfile: "ดูโปรไฟล์",
    close: "ปิด",
    selectRosterTitle: "คัดเลือกผู้สมัคร",
    confirmSelectCandidateTitle: "เลือกผู้สมัครคนนี้หรือไม่",
    confirmSelectCandidateMessage:
      "การเลือกจะมอบหมายเควสต์ให้ผู้สมัครคนนี้และปฏิเสธผู้สมัครคนอื่นโดยอัตโนมัติ ไม่สามารถย้อนกลับได้",
    confirmSelectTeamTitle: "เลือกทีมนี้หรือไม่",
    confirmSelectTeamMessage:
      "การเลือกจะมอบหมายเควสต์ให้สมาชิกทุกคนในทีมนี้และปฏิเสธทีมอื่นโดยอัตโนมัติ ไม่สามารถย้อนกลับได้",
    confirmRejectCandidateTitle: "ปฏิเสธผู้สมัครคนนี้หรือไม่",
    confirmRejectTeamTitle: "ปฏิเสธทีมนี้หรือไม่",
    confirmRejectMessage: "ผู้สมัครนี้จะไม่ถูกพิจารณาสำหรับเควสต์นี้อีก",
    noSelectionNeeded: "เควสต์นี้รับผู้ทำงานอัตโนมัติ ไม่ต้องคัดเลือก",
    actionFailedTitle: "การดำเนินการล้มเหลว",
  },
};
