import type { SupportedLocale } from './LocaleProvider';

export interface NavigationMessages {
  board: string;
  myQuests: string;
  create: string;
  chat: string;
  profile: string;
  boardTitle: string;
  myQuestsTitle: string;
  createTitle: string;
  chatTitle: string;
  placeholderDescription: string;
}

export const navigationMessages: Record<SupportedLocale, NavigationMessages> = {
  en: {
    board: 'Quest Board',
    myQuests: 'My Quests',
    create: 'Create',
    chat: 'Chat',
    profile: 'Student Profile',
    boardTitle: 'Quest Board',
    myQuestsTitle: 'My Quests',
    createTitle: 'Create a Quest',
    chatTitle: 'Chat',
    placeholderDescription: 'This area is ready for its feature content.',
  },
  th: {
    board: 'กระดานเควสต์',
    myQuests: 'เควสต์ของฉัน',
    create: 'สร้าง',
    chat: 'แชต',
    profile: 'โปรไฟล์นักศึกษา',
    boardTitle: 'กระดานเควสต์',
    myQuestsTitle: 'เควสต์ของฉัน',
    createTitle: 'สร้างเควสต์',
    chatTitle: 'แชต',
    placeholderDescription: 'พื้นที่นี้พร้อมสำหรับเนื้อหาของฟีเจอร์แล้ว',
  },
};
