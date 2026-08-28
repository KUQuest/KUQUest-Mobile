import type { SupportedLocale } from './LocaleProvider';

export interface PrototypeMenuMessages {
  openMenu: string;
  title: string;
  subtitle: string;
  close: string;
  personas: string;
  activePersona: string;
  scenarios: string;
  reset: string;
  resetCurrent: string;
  resetAll: string;
  resetDescription: string;
  currentScenario: string;
}

export const prototypeMenuMessages: Record<SupportedLocale, PrototypeMenuMessages> = {
  en: {
    openMenu: 'Open Prototype menu',
    title: 'Prototype controls',
    subtitle: 'Switch persona or open a hidden scenario.',
    close: 'Close Prototype menu',
    personas: 'Personas',
    activePersona: 'Active persona',
    scenarios: 'Scenarios',
    reset: 'Reset fixture data',
    resetCurrent: 'Reset current scenario',
    resetAll: 'Reset all scenarios',
    resetDescription: 'Reset restores deterministic fixture state. Chat messages stay session-only.',
    currentScenario: 'Current scenario',
  },
  th: {
    openMenu: 'เปิดเมนู Prototype',
    title: 'เครื่องมือ Prototype',
    subtitle: 'สลับตัวตนหรือเปิดสถานการณ์ที่ซ่อนไว้',
    close: 'ปิดเมนู Prototype',
    personas: 'ตัวตน',
    activePersona: 'ตัวตนที่ใช้งานอยู่',
    scenarios: 'สถานการณ์',
    reset: 'รีเซ็ตข้อมูลทดลอง',
    resetCurrent: 'รีเซ็ตสถานการณ์ปัจจุบัน',
    resetAll: 'รีเซ็ตทุกสถานการณ์',
    resetDescription: 'การรีเซ็ตจะคืนค่าข้อมูลทดลองให้เหมือนเดิม และข้อความแชทจะอยู่ในเซสชันเท่านั้น',
    currentScenario: 'สถานการณ์ปัจจุบัน',
  },
};
