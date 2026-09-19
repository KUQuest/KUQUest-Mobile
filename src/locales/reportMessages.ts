import type { ReportTopic } from "@/features/report/reportTypes";
import type { SupportedLocale } from "./locale";

export interface ReportMessages {
  title: string;
  intro: string;
  reviewIntro: string;
  contextLabel: string;
  contextDescription: string;
  questContextLabel: string;
  chatContextLabel: string;
  topicLabel: string;
  topicPlaceholder: string;
  topicPickerTitle: string;
  topicPickerDescription: string;
  topicPickerDone: string;
  topicSelectedCount: (count: number) => string;
  detailsLabel: string;
  detailsPlaceholder: string;
  detailsHint: string;
  reviewTopic: string;
  reviewDetails: string;
  close: string;
  review: string;
  edit: string;
  submit: string;
  back: string;
  topicRequired: string;
  detailsRequired: string;
  successTitle: string;
  successDescription: string;
  backToQuest: string;
  backToChat: string;
  topicOptions: Record<ReportTopic, string>;
}

export const reportMessages: Record<SupportedLocale, ReportMessages> = {
  en: {
    title: "Report review",
    intro:
      "Tell the KUQuest Admin team what happened so they can review this report.",
    reviewIntro:
      "Review the information before sending it to the KUQuest Admin team.",
    contextLabel: "Report context",
    contextDescription:
      "This report will be sent to the KUQuest Admin team for review.",
    questContextLabel: "Joined Quest",
    chatContextLabel: "Work Chat",
    topicLabel: "Report topics",
    topicPlaceholder: "Choose report topics",
    topicPickerTitle: "Choose report topics",
    topicPickerDescription: "Select all topics that describe this issue.",
    topicPickerDone: "Done",
    topicSelectedCount: (count) => `${count} topics selected`,
    detailsLabel: "Report details",
    detailsPlaceholder:
      "Describe what happened and include the relevant context.",
    detailsHint:
      "Avoid sharing passwords or other sensitive account information.",
    reviewTopic: "Topics",
    reviewDetails: "Details",
    close: "Close",
    review: "Review report",
    edit: "Edit report",
    submit: "Send report to Admin",
    back: "Go back",
    topicRequired: "Choose at least one report topic.",
    detailsRequired: "Add details about the report.",
    successTitle: "Report sent to Admin",
    successDescription: "Your report was recorded for KUQuest Admin review.",
    backToQuest: "Back to Quest",
    backToChat: "Back to chat",
    topicOptions: {
      REPORT_ABUSIVE_OR_HARASSMENT: "Abusive language or harassment",
      CONDUCT_ABANDONED: "Work abandoned or not submitted",
      CONDUCT_OUT_OF_SCOPE: "Work outside the Quest scope",
      CONDUCT_NO_SHOW: "Worker did not show up",
      REPORT_PROOF_REVIEW: "Proof submission or review issue",
      REPORT_REWARD_SETTLEMENT: "Reward or settlement issue",
    },
  },
  th: {
    title: "ตรวจสอบรายงาน",
    intro: "แจ้งเหตุการณ์ให้ทีมแอดมิน KUQuest ตรวจสอบรายงานนี้",
    reviewIntro: "ตรวจสอบข้อมูลก่อนส่งให้ทีมแอดมิน KUQuest",
    contextLabel: "บริบทการรายงาน",
    contextDescription: "รายงานนี้จะถูกส่งให้ทีมแอดมิน KUQuest ตรวจสอบ",
    questContextLabel: "เควสต์ที่เข้าร่วม",
    chatContextLabel: "แชตการทำงาน",
    topicLabel: "หัวข้อการรายงาน",
    topicPlaceholder: "เลือกหัวข้อการรายงาน",
    topicPickerTitle: "เลือกหัวข้อการรายงาน",
    topicPickerDescription: "เลือกได้มากกว่าหนึ่งหัวข้อที่ตรงกับปัญหานี้",
    topicPickerDone: "เสร็จสิ้น",
    topicSelectedCount: (count) => `เลือกแล้ว ${count} หัวข้อ`,
    detailsLabel: "รายละเอียดการรายงาน",
    detailsPlaceholder: "อธิบายเหตุการณ์และบริบทที่เกี่ยวข้องโดยละเอียด",
    detailsHint: "หลีกเลี่ยงการระบุรหัสผ่านหรือข้อมูลบัญชีที่เป็นความลับ",
    reviewTopic: "หัวข้อ",
    reviewDetails: "รายละเอียด",
    close: "ปิด",
    review: "ตรวจสอบรายงาน",
    edit: "แก้ไขรายงาน",
    submit: "ส่งรายงานให้แอดมิน",
    back: "ย้อนกลับ",
    topicRequired: "กรุณาเลือกหัวข้อการรายงานอย่างน้อย 1 หัวข้อ",
    detailsRequired: "กรุณากรอกรายละเอียดการรายงาน",
    successTitle: "ส่งรายงานให้แอดมินแล้ว",
    successDescription: "รายงานนี้ถูกบันทึกเพื่อให้ทีมแอดมิน KUQuest ตรวจสอบ",
    backToQuest: "กลับไปยังเควสต์",
    backToChat: "กลับไปแชต",
    topicOptions: {
      REPORT_ABUSIVE_OR_HARASSMENT: "ข้อความไม่เหมาะสมหรือการคุกคาม",
      CONDUCT_ABANDONED: "ละทิ้งงานหรือไม่ส่งงาน",
      CONDUCT_OUT_OF_SCOPE: "งานนอกขอบเขตของเควสต์",
      CONDUCT_NO_SHOW: "ไม่มาเข้าร่วมงาน",
      REPORT_PROOF_REVIEW: "ปัญหาการส่งหลักฐานหรือการตรวจงาน",
      REPORT_REWARD_SETTLEMENT: "ปัญหาเงินรางวัลหรือการชำระเงิน",
    },
  },
};
