import type { SupportedLocale } from "./locale";

export interface DisputeMessages {
  title: string;
  back: string;
  rulesTitle: string;
  intro: string;
  rules: readonly string[];
  submit: string;
  submitting: string;
  confirmTitle: string;
  confirmDescription: string;
  confirm: string;
  cancel: string;
  successTitle: string;
  successDescription: (caseId: string) => string;
  done: string;
  errorTitle: string;
  errorFallback: string;
}

export const disputeMessages: Record<SupportedLocale, DisputeMessages> = {
  en: {
    title: "File a Dispute Case",
    back: "Back",
    rulesTitle: "Before you file",
    intro:
      "A Dispute Case asks an Admin to review how this failed Quest was settled. The Admin can move money from the Quest's held funding to a Worker. The Quest stays failed.",
    rules: [
      "You can file only within 1 day after the Quest failed.",
      "You can file one Dispute Case for this Quest.",
      "Held funding returns to the Hirer 7 days after the Quest failed.",
      "An Admin either dismisses the case or pays a Worker.",
    ],
    submit: "File Dispute Case",
    submitting: "Filing…",
    confirmTitle: "File a Dispute Case?",
    confirmDescription: "You can file only one Dispute Case for this Quest.",
    confirm: "File",
    cancel: "Cancel",
    successTitle: "Dispute Case filed",
    successDescription: (caseId) =>
      `Case ${caseId} is waiting for Admin review.`,
    done: "Done",
    errorTitle: "Couldn't file the Dispute Case",
    errorFallback: "Please try again.",
  },
  th: {
    title: "ยื่นคำร้องข้อพิพาท",
    back: "ย้อนกลับ",
    rulesTitle: "ก่อนยื่นคำร้อง",
    intro:
      "คำร้องข้อพิพาทคือการขอให้ผู้ดูแลระบบตรวจสอบการชำระเงินของเควสต์ที่ล้มเหลวนี้ ผู้ดูแลระบบสามารถโอนเงินที่ถูกระงับของเควสต์ให้ผู้ทำงานได้ และเควสต์ยังคงมีสถานะล้มเหลว",
    rules: [
      "ยื่นได้ภายใน 1 วันหลังจากเควสต์ล้มเหลวเท่านั้น",
      "ยื่นคำร้องข้อพิพาทสำหรับเควสต์นี้ได้หนึ่งครั้ง",
      "เงินที่ถูกระงับจะคืนให้ผู้ว่าจ้าง 7 วันหลังจากเควสต์ล้มเหลว",
      "ผู้ดูแลระบบจะยกคำร้องหรือจ่ายเงินให้ผู้ทำงาน",
    ],
    submit: "ยื่นคำร้องข้อพิพาท",
    submitting: "กำลังยื่นคำร้อง…",
    confirmTitle: "ยื่นคำร้องข้อพิพาทใช่ไหม",
    confirmDescription:
      "คุณยื่นคำร้องข้อพิพาทสำหรับเควสต์นี้ได้เพียงหนึ่งครั้ง",
    confirm: "ยื่นคำร้อง",
    cancel: "ยกเลิก",
    successTitle: "ยื่นคำร้องข้อพิพาทแล้ว",
    successDescription: (caseId) =>
      `คำร้อง ${caseId} กำลังรอผู้ดูแลระบบตรวจสอบ`,
    done: "เสร็จสิ้น",
    errorTitle: "ยื่นคำร้องข้อพิพาทไม่สำเร็จ",
    errorFallback: "โปรดลองอีกครั้ง",
  },
};
