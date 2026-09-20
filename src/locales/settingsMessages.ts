import type { SupportedLocale } from "./locale";

export interface SettingsMessages {
  title: string;
  account: string;
  editProfile: string;
  editProfileDescription: string;
  workspace: string;
  workspaceDescription: string;
  hirerWorkspace: string;
  workerWorkspace: string;
  switchingWorkspace: string;
  devOverlay: string;
  devOverlayDescription: string;
  preferences: string;
  notifications: string;
  notificationsDescription: string;
  language: string;
  languageDescription: string;
  selectLanguage: string;
  thaiLanguage: string;
  englishLanguage: string;
  cancel: string;
  systemLanguage: string;
  appearance: string;
  appearanceDescription: string;
  systemAppearance: string;
  support: string;
  help: string;
  helpDescription: string;
  privacy: string;
  terms: string;
  about: string;
  version: string;
  aboutDescription: string;
  switchingAccount: string;
  logout: string;
  back: string;
}

export const settingsMessages: Record<SupportedLocale, SettingsMessages> = {
  en: {
    title: "Settings",
    account: "Account",
    editProfile: "Edit Profile",
    editProfileDescription:
      "Update your details, experience, work, and certificates",
    workspace: "Workspace",
    workspaceDescription: "Switch between Hirer and Worker workspaces",
    hirerWorkspace: "Hirer",
    workerWorkspace: "Worker",
    switchingWorkspace: "Switching workspace...",
    devOverlay: "Developer launch options",
    devOverlayDescription:
      "Revoke the current session and choose a demo launch target",
    preferences: "Preferences",
    notifications: "Quest notifications",
    notificationsDescription: "Updates about applications and assignments",
    language: "Language",
    languageDescription: "Select your preferred display language",
    selectLanguage: "Select Language",
    thaiLanguage: "ไทย (Thai)",
    englishLanguage: "English",
    cancel: "Cancel",
    systemLanguage: "English",
    appearance: "Appearance",
    appearanceDescription: "Follow your device appearance",
    systemAppearance: "System",
    support: "Support",
    help: "Help and feedback",
    helpDescription: "Get help with using KUQuest",
    terms: "Terms of service",
    privacy: "Privacy policy",
    about: "About KUQuest",
    version: "Version 1.0.0",
    aboutDescription: "A trusted Quest board for the KU community",
    switchingAccount: "Switching account...",
    logout: "Log out",
    back: "Go back",
  },
  th: {
    title: "การตั้งค่า",
    account: "บัญชี",
    editProfile: "แก้ไขโปรไฟล์",
    editProfileDescription: "แก้ไขข้อมูล ประสบการณ์ ผลงาน และใบรับรอง",
    workspace: "พื้นที่ทำงาน",
    workspaceDescription: "สลับระหว่างพื้นที่ผู้ว่าจ้างและผู้รับงาน",
    hirerWorkspace: "ผู้ว่าจ้าง",
    workerWorkspace: "ผู้รับงาน",
    switchingWorkspace: "กำลังสลับพื้นที่ทำงาน...",
    devOverlay: "ตัวเลือกสำหรับนักพัฒนา",
    devOverlayDescription:
      "ยกเลิก session แล้วกลับไปเลือกหน้าเริ่มต้นสำหรับทดสอบ",
    preferences: "การตั้งค่าใช้งาน",
    notifications: "การแจ้งเตือนเควสต์",
    notificationsDescription: "อัปเดตเกี่ยวกับการสมัครและงานที่ได้รับ",
    language: "ภาษา",
    languageDescription: "เลือกภาษาที่คุณต้องการใช้งาน",
    selectLanguage: "เลือกภาษา",
    thaiLanguage: "ไทย (Thai)",
    englishLanguage: "English",
    cancel: "ยกเลิก",
    systemLanguage: "ไทย",
    appearance: "รูปแบบการแสดงผล",
    appearanceDescription: "ใช้รูปแบบตามอุปกรณ์",
    systemAppearance: "ตามระบบ",
    support: "ช่วยเหลือ",
    help: "ช่วยเหลือและข้อเสนอแนะ",
    helpDescription: "ดูวิธีใช้งาน KUQuest",
    terms: "ข้อกำหนดการใช้บริการ",
    privacy: "นโยบายความเป็นส่วนตัว",
    about: "เกี่ยวกับ KUQuest",
    version: "เวอร์ชัน 1.0.0",
    aboutDescription: "กระดานเควสต์ที่ไว้วางใจได้สำหรับชุมชน KU",
    switchingAccount: "กำลังเปลี่ยนบัญชี...",
    logout: "ออกจากระบบ",
    back: "ย้อนกลับ",
  },
};
