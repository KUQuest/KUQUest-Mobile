import type { SupportedLocale } from "./locale";

type ConductReportStatus =
  | "CONDUCT_REPORT_PENDING"
  | "CONDUCT_REPORT_UPHELD"
  | "CONDUCT_REPORT_DISMISSED";

type ConductReportReason =
  "CONDUCT_ABANDONED" | "CONDUCT_OUT_OF_SCOPE" | "CONDUCT_NO_SHOW";

/** Copy that differs by who is filing the report. */
export interface ConductReportRoleCopy {
  entry: string;
  /** Sets the action apart from the Dispute Case, which decides money. */
  entryHint: string;
  title: string;
  rules: readonly string[];
  targetLabel: string;
}

export interface ConductReportMessages {
  copy: Record<"HIRER" | "WORKER", ConductReportRoleCopy>;
  reasons: Record<ConductReportReason, string>;
  workerFallback: (position: number) => string;
  detailLabel: string;
  detailPlaceholder: string;
  submit: string;
  submitting: string;
  cancel: string;
  close: string;
  successTitle: string;
  successDescription: (reportId: string) => string;
  errorTitle: string;
  errorFallback: string;
  alreadyReported: string;
  windowClosed: string;
  notAllowed: string;
  invalidDetail: string;
  filedTitle: string;
  filedItem: (reportId: string, memberName: string) => string;
  status: Record<ConductReportStatus, string>;
}

export const conductReportMessages: Record<
  SupportedLocale,
  ConductReportMessages
> = {
  en: {
    copy: {
      HIRER: {
        entry: "Report Worker",
        entryHint:
          "Ask an Admin to review how the Worker behaved. It does not change any money.",
        title: "Report a Worker",
        rules: [
          "Use this when a Worker did not send the work before the deadline.",
          "An Admin reviews the Quest record before deciding.",
          "The Worker does not see who filed the report.",
          "Each Worker can be reported once for this Quest.",
        ],
        targetLabel: "Worker",
      },
      WORKER: {
        entry: "Report a problem",
        entryHint:
          "Ask an Admin to review how someone behaved on this Quest. It does not change any money.",
        title: "Report a problem",
        rules: [
          "Report the Hirer if they asked for work beyond the Quest conditions or for dishonest or unlawful work.",
          "Report a teammate on a group Quest who sent no work and did not confirm.",
          "An Admin reviews the Quest record before deciding.",
          "The person you report does not see who filed the report.",
          "Each person can be reported once for this Quest.",
        ],
        targetLabel: "Member",
      },
    },
    reasons: {
      CONDUCT_ABANDONED: "Did not send the work before the deadline",
      CONDUCT_OUT_OF_SCOPE:
        "Asked for work beyond the Quest conditions, or dishonest or unlawful work",
      CONDUCT_NO_SHOW: "Sent no work and did not confirm",
    },
    workerFallback: (position) => `Worker ${position}`,
    detailLabel: "Details (optional)",
    detailPlaceholder: "Tell the Admin what happened",
    submit: "Send report",
    submitting: "Sending...",
    cancel: "Cancel",
    close: "Close",
    successTitle: "Report sent",
    successDescription: (reportId) =>
      `Report ${reportId} is waiting for Admin review.`,
    errorTitle: "Couldn't send the report",
    errorFallback: "Please try again.",
    alreadyReported: "This person has already been reported for this Quest.",
    windowClosed: "The time to report on this Quest has ended.",
    notAllowed: "You can't report this person on this Quest.",
    invalidDetail: "Details must be 1,000 characters or fewer.",
    filedTitle: "Your reports",
    filedItem: (reportId, memberName) => `${reportId} · ${memberName}`,
    status: {
      CONDUCT_REPORT_PENDING: "Waiting for Admin review",
      CONDUCT_REPORT_UPHELD: "Admin confirmed the report",
      CONDUCT_REPORT_DISMISSED: "Admin dismissed the report",
    },
  },
  th: {
    copy: {
      HIRER: {
        entry: "รายงานผู้ทำงาน",
        entryHint: "ให้ผู้ดูแลระบบตรวจสอบพฤติกรรมผู้ทำงาน ไม่เกี่ยวกับเงิน",
        title: "รายงานผู้ทำงาน",
        rules: [
          "ใช้เมื่อผู้ทำงานไม่ได้ส่งงานก่อนถึงกำหนดเวลา",
          "ผู้ดูแลระบบจะตรวจสอบข้อมูลเควสต์ก่อนตัดสิน",
          "ผู้ทำงานจะไม่เห็นว่าใครเป็นผู้รายงาน",
          "รายงานผู้ทำงานแต่ละคนได้หนึ่งครั้งต่อเควสต์",
        ],
        targetLabel: "ผู้ทำงาน",
      },
      WORKER: {
        entry: "รายงานปัญหา",
        entryHint:
          "ให้ผู้ดูแลระบบตรวจสอบพฤติกรรมของผู้ร่วมเควสต์นี้ ไม่เกี่ยวกับเงิน",
        title: "รายงานปัญหา",
        rules: [
          "รายงานผู้จ้างได้เมื่อขอให้ทำงานนอกเงื่อนไขเควสต์ หรืองานที่ไม่สุจริตหรือผิดกฎหมาย",
          "รายงานเพื่อนร่วมทีมในเควสต์กลุ่มที่ไม่ได้ส่งงานและไม่ได้ยืนยัน",
          "ผู้ดูแลระบบจะตรวจสอบข้อมูลเควสต์ก่อนตัดสิน",
          "ผู้ถูกรายงานจะไม่เห็นว่าใครเป็นผู้รายงาน",
          "รายงานแต่ละคนได้หนึ่งครั้งต่อเควสต์",
        ],
        targetLabel: "สมาชิก",
      },
    },
    reasons: {
      CONDUCT_ABANDONED: "ไม่ได้ส่งงานก่อนถึงกำหนดเวลา",
      CONDUCT_OUT_OF_SCOPE:
        "ขอให้ทำงานนอกเงื่อนไขเควสต์ หรืองานที่ไม่สุจริตหรือผิดกฎหมาย",
      CONDUCT_NO_SHOW: "ไม่ได้ส่งงานและไม่ได้ยืนยัน",
    },
    workerFallback: (position) => `ผู้ทำงานคนที่ ${position}`,
    detailLabel: "รายละเอียด (ไม่บังคับ)",
    detailPlaceholder: "เล่าให้ผู้ดูแลระบบทราบว่าเกิดอะไรขึ้น",
    submit: "ส่งรายงาน",
    submitting: "กำลังส่ง...",
    cancel: "ยกเลิก",
    close: "ปิด",
    successTitle: "ส่งรายงานแล้ว",
    successDescription: (reportId) =>
      `รายงาน ${reportId} กำลังรอผู้ดูแลระบบตรวจสอบ`,
    errorTitle: "ส่งรายงานไม่สำเร็จ",
    errorFallback: "กรุณาลองใหม่อีกครั้ง",
    alreadyReported: "คนนี้ถูกรายงานสำหรับเควสต์นี้แล้ว",
    windowClosed: "หมดเวลารายงานสำหรับเควสต์นี้แล้ว",
    notAllowed: "คุณไม่สามารถรายงานคนนี้ในเควสต์นี้ได้",
    invalidDetail: "รายละเอียดต้องไม่เกิน 1,000 ตัวอักษร",
    filedTitle: "รายงานของคุณ",
    filedItem: (reportId, memberName) => `${reportId} · ${memberName}`,
    status: {
      CONDUCT_REPORT_PENDING: "รอผู้ดูแลระบบตรวจสอบ",
      CONDUCT_REPORT_UPHELD: "ผู้ดูแลระบบยืนยันรายงานแล้ว",
      CONDUCT_REPORT_DISMISSED: "ผู้ดูแลระบบยกรายงานแล้ว",
    },
  },
};
