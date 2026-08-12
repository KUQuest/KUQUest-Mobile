import type { SupportedLocale } from './LocaleProvider';

export interface NavigationMessages {
  board: string;
  myQuests: string;
  create: string;
  chat: string;
  profile: string;
  boardShort: string;
  myQuestsShort: string;
  createShort: string;
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
}

export const navigationMessages: Record<SupportedLocale, NavigationMessages> = {
  en: {
    board: 'Quest Board',
    myQuests: 'My Quests',
    create: 'Create',
    chat: 'Chat',
    profile: 'Student Profile',
    boardShort: 'Board',
    myQuestsShort: 'Quests',
    createShort: 'Create',
    chatShort: 'Chat',
    profileShort: 'Profile',
    boardTitle: 'Quest Board',
    boardDescription: 'Available Quests will appear here when they are ready to discover.',
    myQuestsTitle: 'My Quests',
    myQuestsDescription: 'Quests you create or accept will be collected here.',
    createTitle: 'Create a Quest',
    createDescription: 'Quest creation will be available here once the form is connected.',
    chatTitle: 'Chat',
    chatDescription: 'Conversations related to your Quests will appear here.',
    placeholderDescription: 'This area is ready for its feature content.',
  },
  th: {
    board: 'กระดานเควสต์',
    myQuests: 'เควสต์ของฉัน',
    create: 'สร้าง',
    chat: 'แชต',
    profile: 'โปรไฟล์นักศึกษา',
    boardShort: 'กระดาน',
    myQuestsShort: 'เควสต์',
    createShort: 'สร้าง',
    chatShort: 'แชต',
    profileShort: 'โปรไฟล์',
    boardTitle: 'กระดานเควสต์',
    boardDescription: 'เควสต์ที่พร้อมให้ค้นหาจะแสดงที่นี่เมื่อระบบเปิดใช้งาน',
    myQuestsTitle: 'เควสต์ของฉัน',
    myQuestsDescription: 'เควสต์ที่คุณสร้างหรือรับจะแสดงรวมกันที่นี่',
    createTitle: 'สร้างเควสต์',
    createDescription: 'ส่วนสร้างเควสต์จะแสดงที่นี่เมื่อแบบฟอร์มพร้อมใช้งาน',
    chatTitle: 'แชต',
    chatDescription: 'บทสนทนาที่เกี่ยวข้องกับเควสต์ของคุณจะแสดงที่นี่',
    placeholderDescription: 'พื้นที่นี้พร้อมสำหรับเนื้อหาของฟีเจอร์แล้ว',
  },
};
