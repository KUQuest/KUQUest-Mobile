import type { SupportedLocale } from '../../locales/LocaleProvider';

export type LocalizedText = Record<SupportedLocale, string>;

export interface ChatAttachment {
  name: string;
  meta: string;
  kind: 'pdf' | 'image';
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text?: LocalizedText;
  time: string;
  attachment?: ChatAttachment;
}

export interface ChatConversation {
  id: string;
  questTitle: LocalizedText;
  participantName: string;
  participantRole: 'owner' | 'member';
  initials: string;
  avatarColor: string;
  latestMessage: LocalizedText;
  latestTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

export const mockChatConversations: ChatConversation[] = [
  {
    id: 'campus-survey-crew',
    questTitle: { en: 'Campus Survey Crew', th: 'ทีมเก็บข้อมูลภาคสนาม' },
    participantName: 'Ethan Smith',
    participantRole: 'owner',
    initials: 'ES',
    avatarColor: '#DDE9D9',
    latestMessage: {
      en: 'Thanks — I’ll share it with the rest of the Quest team.',
      th: 'ขอบคุณ เดี๋ยวฉันแชร์ให้ทีมเควสต์ที่เหลือ',
    },
    latestTime: '10:42',
    unreadCount: 2,
    messages: [
      {
        id: 'campus-1',
        sender: 'other',
        text: {
          en: 'Hi! Are we still meeting at the Faculty of Economics at 10:00?',
          th: 'สวัสดี เรายังนัดเจอกันที่คณะเศรษฐศาสตร์ตอน 10 โมงเหมือนเดิมไหม',
        },
        time: '10:18',
      },
      {
        id: 'campus-2',
        sender: 'me',
        text: {
          en: 'Yes, I’ll bring the printed consent forms.',
          th: 'ใช่ เดี๋ยวฉันนำแบบฟอร์มยินยอมฉบับพิมพ์ไปให้',
        },
        time: '10:21',
      },
      {
        id: 'campus-3',
        sender: 'other',
        text: {
          en: 'Could you send the final schedule to the team?',
          th: 'ช่วยส่งกำหนดการฉบับสุดท้ายให้ทีมได้ไหม',
        },
        time: '10:32',
      },
      {
        id: 'campus-4',
        sender: 'me',
        time: '10:35',
        attachment: { name: 'fieldwork-schedule.pdf', meta: 'PDF · 248 KB', kind: 'pdf' },
      },
      {
        id: 'campus-5',
        sender: 'other',
        text: {
          en: 'Thanks — I’ll share it with the rest of the Quest team.',
          th: 'ขอบคุณ เดี๋ยวฉันแชร์ให้ทีมเควสต์ที่เหลือ',
        },
        time: '10:42',
      },
    ],
  },
  {
    id: 'open-day-media',
    questTitle: { en: 'Open Day Media Team', th: 'ทีมสื่อประชาสัมพันธ์วันเปิดบ้าน' },
    participantName: 'Nina K.',
    participantRole: 'member',
    initials: 'NK',
    avatarColor: '#EAF6ED',
    latestMessage: {
      en: 'The poster looks good. I’ll upload the final version.',
      th: 'โปสเตอร์ดูดีแล้ว เดี๋ยวฉันอัปโหลดฉบับสุดท้าย',
    },
    latestTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'open-day-1',
        sender: 'other',
        text: {
          en: 'The poster looks good. I’ll upload the final version.',
          th: 'โปสเตอร์ดูดีแล้ว เดี๋ยวฉันอัปโหลดฉบับสุดท้าย',
        },
        time: 'Yesterday',
      },
      {
        id: 'open-day-2',
        sender: 'me',
        text: {
          en: 'Great. Please keep the venue details unchanged.',
          th: 'เยี่ยมเลย รบกวนคงรายละเอียดสถานที่ไว้เหมือนเดิมนะ',
        },
        time: 'Yesterday',
      },
      {
        id: 'open-day-3',
        sender: 'other',
        time: 'Yesterday',
        attachment: { name: 'open-day-poster.png', meta: 'PNG · 1.4 MB', kind: 'image' },
      },
    ],
  },
  {
    id: 'faculty-research-assistant',
    questTitle: { en: 'Faculty Research Assistant', th: 'ผู้ช่วยงานวิจัยประจำคณะ' },
    participantName: 'Ploy Rattanaporn',
    participantRole: 'owner',
    initials: 'PR',
    avatarColor: '#F0F4F1',
    latestMessage: {
      en: 'I’ve attached the consent form for your review.',
      th: 'ฉันแนบแบบฟอร์มยินยอมสำหรับตรวจสอบไว้แล้ว',
    },
    latestTime: 'Mon',
    unreadCount: 0,
    messages: [
      {
        id: 'research-1',
        sender: 'other',
        text: {
          en: 'I’ve attached the consent form for your review.',
          th: 'ฉันแนบแบบฟอร์มยินยอมสำหรับตรวจสอบไว้แล้ว',
        },
        time: 'Mon',
      },
      {
        id: 'research-2',
        sender: 'other',
        time: 'Mon',
        attachment: { name: 'participant-consent.pdf', meta: 'PDF · 326 KB', kind: 'pdf' },
      },
    ],
  },
];

export function getChatConversation(id: string | undefined): ChatConversation | undefined {
  return mockChatConversations.find((conversation) => conversation.id === id);
}
