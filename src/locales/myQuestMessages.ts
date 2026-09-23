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
  statusLabel: string;
  workerLabel: string;
  locationLabel: string;
  scheduleLabel: string;
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
    statusLabel: "สถานะ",
    workerLabel: "ผู้ทำงาน",
    locationLabel: "สถานที่",
    scheduleLabel: "กำหนดการ",
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
    statusLabel: "Status",
    workerLabel: "Workers",
    locationLabel: "Location",
    scheduleLabel: "Schedule",
  },
};
