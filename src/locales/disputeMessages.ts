import type { SupportedLocale } from "./locale";

export interface DisputeMessages {
  rules: readonly string[];
  confirmTitle: string;
  confirm: string;
  cancel: string;
  successTitle: string;
  successDescription: (caseId: string) => string;
  errorTitle: string;
  errorFallback: string;
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
    confirm: "File",
    cancel: "Cancel",
    successTitle: "Dispute Case filed",
    successDescription: (caseId) =>
      `Case ${caseId} is waiting for Admin review.`,
    errorTitle: "Couldn't file the Dispute Case",
    errorFallback: "Please try again.",
  },
  th: {
    rules: [
      "ยื่นได้ภายใน 1 วันหลังจากเควสต์ล้มเหลวเท่านั้น",
      "ยื่นคำร้องข้อพิพาทสำหรับเควสต์นี้ได้หนึ่งครั้ง",
      "เงินที่ถูกระงับจะคืนให้ผู้ว่าจ้าง 7 วันหลังจากเควสต์ล้มเหลว",
      "ผู้ดูแลระบบจะยกคำร้องหรือจ่ายเงินให้ผู้ทำงาน",
    ],
    confirmTitle: "ยื่นคำร้องข้อพิพาทใช่ไหม",
    confirm: "ยื่นคำร้อง",
    cancel: "ยกเลิก",
    successTitle: "ยื่นคำร้องข้อพิพาทแล้ว",
    successDescription: (caseId) =>
      `คำร้อง ${caseId} กำลังรอผู้ดูแลระบบตรวจสอบ`,
    errorTitle: "ยื่นคำร้องข้อพิพาทไม่สำเร็จ",
    errorFallback: "โปรดลองอีกครั้ง",
  },
};
