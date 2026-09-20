import type { SupportedLocale } from "./locale";

export interface NavigationMessages {
  board: string;
  money: string;
  create: string;
  workManagement: string;
  chat: string;
  profile: string;
  boardShort: string;
  moneyShort: string;
  createShort: string;
  workManagementShort: string;
  chatShort: string;
  profileShort: string;
  boardTitle: string;
  boardDescription: string;
  myQuestsTitle: string;
  myQuestsDescription: string;
  createTitle: string;
  createDescription: string;
  chatTitle: string;
  chatDescription: string;
  placeholderDescription: string;
  logout: string;
  back: string;
  unreadMessages: string;
}

export const navigationMessages: Record<SupportedLocale, NavigationMessages> = {
  en: {
    board: "Home",
    money: "Money",
    create: "Create Quest",
    chat: "Chat",
    profile: "Profile",
    boardShort: "Home",
    moneyShort: "Money",
    createShort: "Create Quest",
    workManagement: "Work Management",
    workManagementShort: "Work",
    chatShort: "Chat",
    profileShort: "Profile",
    boardTitle: "Quest Board",
    boardDescription:
      "Available Quests will appear here when they are ready to discover.",
    myQuestsTitle: "My Quests",
    myQuestsDescription: "Quests you create or accept will be collected here.",
    createTitle: "Create a Quest",
    createDescription:
      "Quest creation will be available here once the form is connected.",
    chatTitle: "Chat",
    chatDescription: "Conversations related to your Quests will appear here.",
    placeholderDescription: "This area is ready for its feature content.",
    logout: "Log out",
    back: "Go back",
    unreadMessages: "Unread messages",
  },
  th: {
    board: "หน้าหลัก",
    money: "กระเป๋าเงิน",
    create: "สร้างเควสต์",
    chat: "แชต",
    profile: "โปรไฟล์นักศึกษา",
    boardShort: "หน้าหลัก",
    moneyShort: "กระเป๋าเงิน",
    createShort: "สร้างเควสต์",
    workManagement: "จัดการงาน",
    workManagementShort: "จัดการงาน",
    chatShort: "แชต",
    profileShort: "โปรไฟล์",
    boardTitle: "กระดานเควสต์",
    boardDescription: "เควสต์ที่พร้อมให้ค้นหาจะแสดงที่นี่เมื่อระบบเปิดใช้งาน",
    myQuestsTitle: "เควสต์ของฉัน",
    myQuestsDescription: "เควสต์ที่คุณสร้างหรือรับจะแสดงรวมกันที่นี่",
    createTitle: "สร้างเควสต์",
    createDescription: "ส่วนสร้างเควสต์จะแสดงที่นี่เมื่อแบบฟอร์มพร้อมใช้งาน",
    chatTitle: "แชต",
    chatDescription: "บทสนทนาที่เกี่ยวข้องกับเควสต์ของคุณจะแสดงที่นี่",
    placeholderDescription: "พื้นที่นี้พร้อมสำหรับเนื้อหาของฟีเจอร์แล้ว",
    logout: "ออกจากระบบ",
    back: "ย้อนกลับ",
    unreadMessages: "ข้อความที่ยังไม่ได้อ่าน",
  },
};
