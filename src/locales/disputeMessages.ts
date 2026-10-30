import type { DisputeCase } from "@/api/DisputeApi";
import type { SupportedLocale } from "./locale";

export interface DisputeMessages {
  rules: readonly string[];
  confirmTitle: string;
  categoryLabel: string;
  detailLabel: string;
  categories: Record<
    "PROOF_REVIEW" | "QUEST_CONDITION" | "PARTIAL_WORK" | "OTHER",
    string
  >;
  confirm: string;
  cancel: string;
  successTitle: string;
  successDescription: (caseId: string) => string;
  errorTitle: string;
  errorFallback: string;
  alreadyFiled: string;
  filedStatus: string;
  filedCase: (caseId: string) => string;
  caseStatus: Record<DisputeCase["status"], string>;
  statusError: string;
  retryStatus: string;
  windowClosed: string;
  windowEndsIn: (hours: number, minutes: number) => string;
  moneyHeldUntil: (date: string) => string;
  moneyReleased: string;
  teamSplitTitle: string;
  teamSplitDescription: (amount: string) => string;
  teamSplitApproved: (amount: string) => string;
  teamSplitAwaiting: (deadline: string) => string;
  teamSplitPaying: string;
  teamSplitPaid: string;
}

export const disputeMessages: Record<SupportedLocale, DisputeMessages> = {
  en: {
    rules: [
      "You can file only within 1 day after the Quest failed.",
      "You can file one Dispute Case for this Quest.",
      "Held funding returns to the Hirer 7 days after the Quest failed.",
      "An Admin either dismisses the case or pays a Worker.",
    ],
    confirmTitle: "File a Dispute Case?",
    categoryLabel: "Dispute category",
    detailLabel: "Dispute details",
    categories: {
      PROOF_REVIEW: "Proof review",
      QUEST_CONDITION: "Quest conditions",
      PARTIAL_WORK: "Partial work",
      OTHER: "Other",
    },
    confirm: "File",
    cancel: "Cancel",
    successTitle: "Dispute Case filed",
    successDescription: (caseId) =>
      `Case ${caseId} is waiting for Admin review.`,
    errorTitle: "Couldn't file the Dispute Case",
    errorFallback: "Please try again.",
    alreadyFiled: "A Dispute Case has already been filed for this Quest.",
    filedStatus: "Dispute filed",
    filedCase: (caseId) => `Case ${caseId}`,
    caseStatus: {
      DISPUTE_CASE_PENDING: "Waiting for Admin review",
      DISPUTE_CASE_DISMISSED: "Admin dismissed the case",
      DISPUTE_CASE_RESOLVED: "Admin resolved the case",
    },
    statusError: "Couldn't check dispute status.",
    retryStatus: "Retry",
    windowClosed: "The 1-day window to file a Dispute Case has closed.",
    windowEndsIn: (hours, minutes) =>
      `You can file a Dispute Case for ${hours > 0 ? `${hours}h ` : ""}${minutes}m more.`,
    moneyHeldUntil: (date) => `Money is held until ${date}.`,
    moneyReleased: "The money hold has been released.",
    teamSplitTitle: "Split the Dispute amount",
    teamSplitDescription: (amount) =>
      `Admin approved ${amount} for the Team. Set each share. If you do not split in time, the Server splits it equally.`,
    teamSplitApproved: (amount) => `Admin approved ${amount} for the Team.`,
    teamSplitAwaiting: (deadline) =>
      `Waiting for the Team Leader to split it by ${deadline}. If they do not, the Server splits it equally.`,
    teamSplitPaying: "The split is confirmed. Payment is in progress.",
    teamSplitPaid: "Paid to each member's Earnings Balance.",
  },
  th: {
    rules: [
      "ยื่นได้ภายใน 1 วันหลังจากเควสต์ล้มเหลวเท่านั้น",
      "ยื่นคำร้องข้อพิพาทสำหรับเควสต์นี้ได้หนึ่งครั้ง",
      "เงินที่ถูกระงับจะคืนให้ผู้ว่าจ้าง 7 วันหลังจากเควสต์ล้มเหลว",
      "ผู้ดูแลระบบจะยกคำร้องหรือจ่ายเงินให้ผู้ทำงาน",
    ],
    confirmTitle: "ยื่นคำร้องข้อพิพาทใช่ไหม",
    categoryLabel: "ประเภทข้อพิพาท",
    detailLabel: "รายละเอียดข้อพิพาท",
    categories: {
      PROOF_REVIEW: "การตรวจผลงาน",
      QUEST_CONDITION: "เงื่อนไขเควสต์",
      PARTIAL_WORK: "งานที่ทำไปบางส่วน",
      OTHER: "อื่น ๆ",
    },
    confirm: "ยื่นคำร้อง",
    cancel: "ยกเลิก",
    successTitle: "ยื่นคำร้องข้อพิพาทแล้ว",
    successDescription: (caseId) =>
      `คำร้อง ${caseId} กำลังรอผู้ดูแลระบบตรวจสอบ`,
    errorTitle: "ยื่นคำร้องข้อพิพาทไม่สำเร็จ",
    errorFallback: "โปรดลองอีกครั้ง",
    alreadyFiled: "มีการยื่นคำร้องข้อพิพาทสำหรับเควสต์นี้แล้ว",
    filedStatus: "ยื่นคำร้องข้อพิพาทแล้ว",
    filedCase: (caseId) => `คำร้อง ${caseId}`,
    caseStatus: {
      DISPUTE_CASE_PENDING: "กำลังรอผู้ดูแลระบบตรวจสอบ",
      DISPUTE_CASE_DISMISSED: "ผู้ดูแลระบบยกคำร้องแล้ว",
      DISPUTE_CASE_RESOLVED: "ผู้ดูแลระบบตัดสินคำร้องแล้ว",
    },
    statusError: "ตรวจสอบสถานะคำร้องข้อพิพาทไม่สำเร็จ",
    retryStatus: "ลองอีกครั้ง",
    windowClosed: "หมดเวลายื่นคำร้องข้อพิพาท (1 วัน) แล้ว",
    windowEndsIn: (hours, minutes) =>
      `ยื่นคำร้องข้อพิพาทได้อีก ${hours > 0 ? `${hours} ชม. ` : ""}${minutes} นาที`,
    moneyHeldUntil: (date) => `เงินถูกพักไว้จนถึง ${date}`,
    moneyReleased: "ปล่อยเงินที่พักไว้แล้ว",
    teamSplitTitle: "แบ่งเงินจากข้อพิพาท",
    teamSplitDescription: (amount) =>
      `ผู้ดูแลระบบอนุมัติ ${amount} ให้ทีม กำหนดสัดส่วนของแต่ละคน ถ้าไม่แบ่งทันเวลา ระบบจะหารเท่ากัน`,
    teamSplitApproved: (amount) => `ผู้ดูแลระบบอนุมัติ ${amount} ให้ทีม`,
    teamSplitAwaiting: (deadline) =>
      `รอหัวหน้าทีมแบ่งเงินภายใน ${deadline} ถ้าไม่แบ่ง ระบบจะหารเท่ากัน`,
    teamSplitPaying: "ยืนยันการแบ่งแล้ว กำลังโอนเงิน",
    teamSplitPaid: "โอนเข้ายอดรายได้ของสมาชิกแต่ละคนแล้ว",
  },
};
