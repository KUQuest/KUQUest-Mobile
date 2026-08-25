import type { SupportedLocale } from './LocaleProvider';

export interface SettingsMessages {
  title: string;
  account: string;
  editProfile: string;
  editProfileDescription: string;
  switchAccount: string;
  switchAccountDescription: string;
  devOverlay: string;
  devOverlayDescription: string;
  preferences: string;
  notifications: string;
  notificationsDescription: string;
  language: string;
  languageDescription: string;
  systemLanguage: string;
  appearance: string;
  appearanceDescription: string;
  systemAppearance: string;
  support: string;
  help: string;
  helpDescription: string;
  terms: string;
  privacy: string;
  about: string;
  version: string;
  aboutDescription: string;
  switchingAccount: string;
  back: string;
}

export const settingsMessages: Record<SupportedLocale, SettingsMessages> = {
  en: {
    title: 'Settings',
    account: 'Account',
    editProfile: 'Edit Profile',
    editProfileDescription: 'Update your details, experience, work, and certificates',
    switchAccount: 'Switch account',
    switchAccountDescription: 'Sign in with another KU account',
    devOverlay: 'Developer launch options',
    devOverlayDescription: 'Revoke the current session and choose a demo launch target',
    preferences: 'Preferences',
    notifications: 'Quest notifications',
    notificationsDescription: 'Updates about applications and assignments',
    language: 'Language',
    languageDescription: 'Use the language selected by your device',
    systemLanguage: 'English',
    appearance: 'Appearance',
    appearanceDescription: 'Follow your device appearance',
    systemAppearance: 'System',
    support: 'Support',
    help: 'Help and feedback',
    helpDescription: 'Get help with using KUQuest',
    terms: 'Terms of service',
    privacy: 'Privacy policy',
    about: 'About KUQuest',
    version: 'Version 1.0.0',
    aboutDescription: 'A trusted Quest board for the KU community',
    switchingAccount: 'Switching account...',
    back: 'Go back',
  },
  th: {
    title: 'การตั้งค่า',
    account: 'บัญชี',
    editProfile: 'แก้ไขโปรไฟล์',
    editProfileDescription: 'แก้ไขข้อมูล ประสบการณ์ ผลงาน และใบรับรอง',
    switchAccount: 'เปลี่ยนบัญชี',
    switchAccountDescription: 'เข้าสู่ระบบด้วยบัญชี KU อื่น',
    devOverlay: 'ตัวเลือกสำหรับนักพัฒนา',
    devOverlayDescription: 'ยกเลิก session แล้วกลับไปเลือกหน้าเริ่มต้นสำหรับทดสอบ',
    preferences: 'การตั้งค่าใช้งาน',
    notifications: 'การแจ้งเตือนเควสต์',
    notificationsDescription: 'อัปเดตเกี่ยวกับการสมัครและงานที่ได้รับ',
    language: 'ภาษา',
    languageDescription: 'ใช้ภาษาที่เลือกไว้ในอุปกรณ์',
    systemLanguage: 'ไทย',
    appearance: 'รูปแบบการแสดงผล',
    appearanceDescription: 'ใช้รูปแบบตามอุปกรณ์',
    systemAppearance: 'ตามระบบ',
    support: 'ช่วยเหลือ',
    help: 'ช่วยเหลือและข้อเสนอแนะ',
    helpDescription: 'ดูวิธีใช้งาน KUQuest',
    terms: 'ข้อกำหนดการใช้บริการ',
    privacy: 'นโยบายความเป็นส่วนตัว',
    about: 'เกี่ยวกับ KUQuest',
    version: 'เวอร์ชัน 1.0.0',
    aboutDescription: 'กระดานเควสต์ที่ไว้วางใจได้สำหรับชุมชน KU',
    switchingAccount: 'กำลังเปลี่ยนบัญชี...',
    back: 'ย้อนกลับ',
  },
};
