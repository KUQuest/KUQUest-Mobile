import type { HirerTab, WorkerTab } from "@/features/myQuests/myQuestService";
import type { SupportedLocale } from "./locale";

export type MyQuestMessagesRole = "worker" | "hirer";

export interface MyQuestMessages {
  back: string;
  title: Record<MyQuestMessagesRole, string>;
  subtitle: Record<MyQuestMessagesRole, string>;
  tabs: {
    hirer: Record<HirerTab, string>;
    worker: Record<WorkerTab, string>;
  };
  listTitle: string;
  listHint: string;
  loading: string;
  error: string;
  retry: string;
  emptyTitle: {
    hirer: Record<HirerTab, string>;
    worker: Record<WorkerTab, string>;
  };
  emptyDescription: Record<MyQuestMessagesRole, string>;
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
    title: { hirer: "เควสต์ของฉัน", worker: "เควสต์ที่ฉันเข้าร่วม" },
    subtitle: {
      hirer: "จัดการเควสต์ทั้งหมดที่คุณสร้างไว้",
      worker: "ติดตามเควสต์ที่คุณเข้าร่วม",
    },
    tabs: {
      hirer: {
        active: "กำลังดำเนินการ",
        draft: "ฉบับร่าง",
        completed: "ประวัติ",
      },
      worker: {
        pending: "รอตรวจสอบ",
        accepted: "กำลังทำ",
        history: "ประวัติ",
      },
    },
    listTitle: "รายการเควสต์",
    listHint: "เลือกเควสต์เพื่อดูรายละเอียดหรือทำงานต่อ",
    loading: "กำลังโหลดเควสต์…",
    error: "ไม่สามารถโหลดเควสต์ได้",
    retry: "ลองอีกครั้ง",
    emptyTitle: {
      hirer: {
        active: "ยังไม่มีเควสต์ที่กำลังดำเนินการ",
        draft: "ยังไม่มีฉบับร่าง",
        completed: "ยังไม่มีเควสต์ที่เสร็จสิ้นหรือปิดแล้ว",
      },
      worker: {
        pending: "ยังไม่มีเควสต์ที่รอตรวจสอบ",
        accepted: "ยังไม่มีเควสต์ที่กำลังทำ",
        history: "ยังไม่มีประวัติเควสต์ที่จบแล้ว",
      },
    },
    emptyDescription: {
      hirer: "เควสต์ที่ตรงกับสถานะนี้จะแสดงที่นี่",
      worker: "เควสต์ที่ตรงกับสถานะนี้จะแสดงที่นี่",
    },
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
    title: { hirer: "My Quests", worker: "Quests I joined" },
    subtitle: {
      hirer: "Manage every Quest you have created",
      worker: "Track the Quests you have joined",
    },
    tabs: {
      hirer: { active: "Active", draft: "Drafts", completed: "History" },
      worker: {
        pending: "Pending",
        accepted: "In progress",
        history: "History",
      },
    },
    listTitle: "Quest list",
    listHint: "Choose a Quest to view details or continue working",
    loading: "Loading Quests…",
    error: "We couldn't load your Quests",
    retry: "Try again",
    emptyTitle: {
      hirer: {
        active: "No active Quests",
        draft: "No Quest drafts",
        completed: "No finished or closed Quests",
      },
      worker: {
        pending: "No pending Quests",
        accepted: "No Quests in progress",
        history: "No completed Quest history",
      },
    },
    emptyDescription: {
      hirer: "Quests in this status will appear here",
      worker: "Quests in this status will appear here",
    },
    edit: "Edit",
    review: "Write review",
    detail: "View details",
    statusLabel: "Status",
    workerLabel: "Workers",
    locationLabel: "Location",
    scheduleLabel: "Schedule",
  },
};
