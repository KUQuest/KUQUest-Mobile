import type { SupportedLocale } from "./locale";

type ConductReportStatus =
  | "CONDUCT_REPORT_PENDING"
  | "CONDUCT_REPORT_UPHELD"
  | "CONDUCT_REPORT_DISMISSED";

export interface ConductReportMessages {
  reportWorker: string;
  title: string;
  rules: readonly string[];
  reasonAbandoned: string;
  workerLabel: string;
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
  filedItem: (reportId: string, workerName: string) => string;
  status: Record<ConductReportStatus, string>;
}

export const conductReportMessages: Record<
  SupportedLocale,
  ConductReportMessages
> = {
  en: {
    reportWorker: "Report Worker",
    title: "Report a Worker",
    rules: [
      "Use this when a Worker did not send the work before the deadline.",
      "An Admin reviews the Quest record before deciding.",
      "The Worker does not see who filed the report.",
      "Each Worker can be reported once for this Quest.",
    ],
    reasonAbandoned: "Did not send the work before the deadline",
    workerLabel: "Worker",
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
    alreadyReported: "This Worker has already been reported for this Quest.",
    windowClosed: "The time to report on this Quest has ended.",
    notAllowed: "You can't report this Worker on this Quest.",
    invalidDetail: "Details must be 1,000 characters or fewer.",
    filedTitle: "Your reports",
    filedItem: (reportId, workerName) => `${reportId} · ${workerName}`,
    status: {
      CONDUCT_REPORT_PENDING: "Waiting for Admin review",
      CONDUCT_REPORT_UPHELD: "Admin confirmed the report",
      CONDUCT_REPORT_DISMISSED: "Admin dismissed the report",
    },
  },
  th: {
    reportWorker: "รายงานผู้ทำงาน",
    title: "รายงานผู้ทำงาน",
    rules: [
      "ใช้เมื่อผู้ทำงานไม่ได้ส่งงานก่อนถึงกำหนดเวลา",
      "ผู้ดูแลระบบจะตรวจสอบข้อมูลเควสต์ก่อนตัดสิน",
      "ผู้ทำงานจะไม่เห็นว่าใครเป็นผู้รายงาน",
      "รายงานผู้ทำงานแต่ละคนได้หนึ่งครั้งต่อเควสต์",
    ],
    reasonAbandoned: "ไม่ได้ส่งงานก่อนถึงกำหนดเวลา",
    workerLabel: "ผู้ทำงาน",
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
    alreadyReported: "ผู้ทำงานคนนี้ถูกรายงานสำหรับเควสต์นี้แล้ว",
    windowClosed: "หมดเวลารายงานสำหรับเควสต์นี้แล้ว",
    notAllowed: "คุณไม่สามารถรายงานผู้ทำงานคนนี้ในเควสต์นี้ได้",
    invalidDetail: "รายละเอียดต้องไม่เกิน 1,000 ตัวอักษร",
    filedTitle: "รายงานของคุณ",
    filedItem: (reportId, workerName) => `${reportId} · ${workerName}`,
    status: {
      CONDUCT_REPORT_PENDING: "รอผู้ดูแลระบบตรวจสอบ",
      CONDUCT_REPORT_UPHELD: "ผู้ดูแลระบบยืนยันรายงานแล้ว",
      CONDUCT_REPORT_DISMISSED: "ผู้ดูแลระบบยกรายงานแล้ว",
    },
  },
};
