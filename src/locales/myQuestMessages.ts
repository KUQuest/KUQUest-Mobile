import type { HirerTab } from "@/features/myQuests/myQuestTypes";
import type { SupportedLocale } from "./locale";

export interface MyQuestMessages {
  back: string;
  title: string;
  subtitle: string;
  tabs: Record<HirerTab, string>;
  listTitle: string;
  listHint: string;
  loading: string;
  error: string;
  retry: string;
  emptyTitle: Record<HirerTab, string>;
  emptyDescription: string;
  edit: string;
  review: string;
  detail: string;
  manage: string;
  fileDispute: string;
  cancelQuest: string;
  keepQuest: string;
  cancelConfirmTitle: string;
  cancelDraftDescription: string;
  cancelOpenDescription: string;
  cancelAssignedDescription: string;
  cancelInProgressDescription: string;
  cancelSuccessTitle: string;
  cancelRefunded: (amount: string) => string;
  cancelPaidWorkers: (amount: string) => string;
  cancelErrorTitle: string;
  workerLabel: string;
  locationLabel: string;
  startLabel: string;
  endLabel: string;
  notSet: string;
  rewardLabel: string;
  online: string;
  modeFirstCome: string;
  modeCandidate: string;
  peopleCount: (count: string) => string;
  rewardPerPerson: (amount: string) => string;
  statusFailed: string;
}

export const myQuestMessages: Record<SupportedLocale, MyQuestMessages> = {
  th: {
    back: "ย้อนกลับ",
    title: "เควสต์ของฉัน",
    subtitle: "จัดการเควสต์ทั้งหมดที่คุณสร้างไว้",
    tabs: {
      active: "กำลังดำเนินการ",
      draft: "ฉบับร่าง",
      completed: "ประวัติ",
    },
    listTitle: "รายการเควสต์",
    listHint: "เลือกเควสต์เพื่อดูรายละเอียดหรือทำงานต่อ",
    loading: "กำลังโหลดเควสต์…",
    error: "ไม่สามารถโหลดเควสต์ได้",
    retry: "ลองอีกครั้ง",
    emptyTitle: {
      active: "ยังไม่มีเควสต์ที่กำลังดำเนินการ",
      draft: "ยังไม่มีฉบับร่าง",
      completed: "ยังไม่มีเควสต์ที่เสร็จสิ้นหรือปิดแล้ว",
    },
    emptyDescription: "เควสต์ที่ตรงกับสถานะนี้จะแสดงที่นี่",
    edit: "แก้ไข",
    review: "เขียนรีวิว",
    detail: "ดูรายละเอียด",
    manage: "จัดการเควสต์",
    fileDispute: "ยื่นข้อพิพาท",
    cancelQuest: "ยกเลิกเควสต์",
    keepQuest: "เก็บไว้",
    cancelConfirmTitle: "ยกเลิกเควสต์นี้?",
    cancelDraftDescription:
      "ฉบับร่างนี้จะถูกยกเลิกและย้ายไปที่ประวัติ ไม่มีการตัดเงิน",
    cancelOpenDescription:
      "เควสต์จะปิดรับผู้เข้าร่วม และเงินที่พักไว้จะคืนให้คุณเต็มจำนวน",
    cancelAssignedDescription:
      "ผู้ทำงานจะได้รับ 20% ของเงินรางวัลรวม ส่วนอีก 80% และค่าธรรมเนียมแพลตฟอร์มจะคืนให้คุณ",
    cancelInProgressDescription:
      "ผู้ทำงานจะได้รับค่าตอบแทนเต็มจำนวนและระบบจะเก็บค่าธรรมเนียมแพลตฟอร์ม คุณจะไม่ได้รับเงินคืน",
    cancelSuccessTitle: "ยกเลิกเควสต์แล้ว",
    cancelRefunded: (amount) => `คืนเงิน ${amount} ให้คุณแล้ว`,
    cancelPaidWorkers: (amount) => `จ่ายให้ผู้ทำงาน ${amount}`,
    cancelErrorTitle: "ยกเลิกเควสต์ไม่สำเร็จ",
    workerLabel: "ผู้ทำงาน",
    locationLabel: "สถานที่",
    startLabel: "เริ่ม",
    endLabel: "สิ้นสุด",
    notSet: "ยังไม่กำหนด",
    rewardLabel: "ค่าตอบแทน",
    online: "ออนไลน์",
    modeFirstCome: "มาก่อนได้ก่อน",
    modeCandidate: "คัดเลือกผู้สมัคร",
    peopleCount: (count) => `${count} คน`,
    rewardPerPerson: (amount) => `${amount} / คน`,
    statusFailed: "ล้มเหลว",
  },
  en: {
    back: "Go back",
    title: "My Quests",
    subtitle: "Manage every Quest you have created",
    tabs: { active: "Active", draft: "Drafts", completed: "History" },
    listTitle: "Quest list",
    listHint: "Choose a Quest to view details or continue working",
    loading: "Loading Quests…",
    error: "We couldn't load your Quests",
    retry: "Try again",
    emptyTitle: {
      active: "No active Quests",
      draft: "No Quest drafts",
      completed: "No finished or closed Quests",
    },
    emptyDescription: "Quests in this status will appear here",
    edit: "Edit",
    review: "Write review",
    detail: "View details",
    manage: "Manage",
    fileDispute: "File dispute",
    cancelQuest: "Cancel Quest",
    keepQuest: "Keep Quest",
    cancelConfirmTitle: "Cancel this Quest?",
    cancelDraftDescription:
      "This draft is cancelled and moved to History. No money is charged.",
    cancelOpenDescription:
      "The Quest stops accepting Workers and the money on hold is refunded to you in full.",
    cancelAssignedDescription:
      "Active Workers receive 20% of the Reward pool. The other 80% and the Platform Fee are refunded to you.",
    cancelInProgressDescription:
      "Workers receive their full Reward and the Platform Fee is charged. You receive no refund.",
    cancelSuccessTitle: "Quest cancelled",
    cancelRefunded: (amount) => `${amount} refunded to you.`,
    cancelPaidWorkers: (amount) => `${amount} paid to Workers.`,
    cancelErrorTitle: "Couldn't cancel Quest",
    workerLabel: "Workers",
    locationLabel: "Location",
    startLabel: "Starts",
    endLabel: "Ends",
    notSet: "Not set",
    rewardLabel: "Reward",
    online: "Online",
    modeFirstCome: "First come, first served",
    modeCandidate: "Choose candidates",
    peopleCount: (count) => `${count} ${count === "1" ? "person" : "people"}`,
    rewardPerPerson: (amount) => `${amount} / person`,
    statusFailed: "Failed",
  },
};
