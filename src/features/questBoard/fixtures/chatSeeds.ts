import type {
  ChatAttachment,
  ChatConversation,
  LocalizedText,
} from "@/features/chat/chatTypes";
import {
  DEFAULT_PROTOTYPE_VIEWER_ID,
  PROTOTYPE_NOW,
} from "../domain/constants";

export interface FixtureChatMessageSeed {
  id: string;
  senderId: string;
  text?: LocalizedText;
  time: string;
  sentAt?: string;
  minutesAgo?: number;
  attachment?: ChatAttachment;
}

export interface FixtureChatSeed {
  id: string;
  questId?: string;
  memberIds: string[];
  questTitle: LocalizedText;
  participantName: string;
  participantRole: ChatConversation["participantRole"];
  initials: string;
  avatarColor: string;
  messages: FixtureChatMessageSeed[];
  readAt?: Record<string, string>;
}

export interface FixtureChatMessage extends FixtureChatMessageSeed {
  sentAt: string;
}

export interface FixtureChatConversation extends Omit<
  FixtureChatSeed,
  "messages" | "readAt"
> {
  messages: FixtureChatMessage[];
  readAt: Record<string, string>;
}
const QUEST_OWNER_GREETING: LocalizedText = {
  en: "Hi! Feel free to ask about this Quest.",
  th: "สวัสดี สอบถามรายละเอียดเควสต์นี้ได้เลย",
};

function questConversationId(questId: string): string {
  return `conversation-fixture-${questId}`;
}

function chatSentAt(minutesAgo = 0): string {
  return new Date(
    new Date(PROTOTYPE_NOW).getTime() - minutesAgo * 60 * 1000
  ).toISOString();
}

function chatMessage(
  id: string,
  senderId: string,
  time: string,
  text?: LocalizedText,
  attachment?: ChatAttachment,
  minutesAgo = 0
): FixtureChatMessageSeed {
  return { id, senderId, time, text, attachment, minutesAgo };
}

/**
 * Server-shaped chat fixtures live beside the other adapter seeds. The UI
 * projection in chatData intentionally contains no copy of these messages.
 */
const FIXTURE_CHAT_SEEDS: readonly FixtureChatSeed[] = [
  {
    id: "quest-move-boxes-group",
    questId: "move-boxes",
    memberIds: ["student-creator-1", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Help move boxes to the dorm", th: "ช่วยยกกล่องไปหอพัก" },
    participantName: "Quest team",
    participantRole: "member",
    initials: "QT",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "move-boxes-welcome",
        "student-creator-1",
        "Now",
        {
          en: "Welcome to the Quest team chat.",
          th: "ยินดีต้อนรับสู่แชตกลุ่มของเควสต์",
        },
        undefined,
        1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "quest-clean-fan-group",
    questId: "clean-fan",
    memberIds: ["demo-hirer", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Clean a dorm fan", th: "ล้างพัดลมหอพัก" },
    participantName: "Quest team",
    participantRole: "member",
    initials: "QT",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "clean-fan-welcome",
        "demo-hirer",
        "Now",
        {
          en: "Use this chat to coordinate with the Quest team.",
          th: "ใช้แชตนี้ประสานงานกับทีมเควสต์ได้เลย",
        },
        undefined,
        1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "quest-buy-lunch-group",
    questId: "buy-lunch",
    memberIds: ["student-creator-4", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Buy lunch from the canteen", th: "ซื้อข้าวจากโรงอาหาร" },
    participantName: "Quest team",
    participantRole: "member",
    initials: "QT",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "buy-lunch-welcome",
        "student-creator-4",
        "Now",
        {
          en: "The Quest team chat is ready.",
          th: "แชตกลุ่มของเควสต์พร้อมใช้งานแล้ว",
        },
        undefined,
        1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "campus-survey-crew",
    memberIds: ["demo-hirer", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Campus Survey Crew", th: "ทีมเก็บข้อมูลภาคสนาม" },
    participantName: "Ethan Smith",
    participantRole: "owner",
    initials: "ES",
    avatarColor: "#DDE9D9",
    messages: [
      chatMessage(
        "campus-1",
        "demo-hirer",
        "10:18",
        {
          en: "Hi! Are we still meeting at the Faculty of Economics at 10:00?",
          th: "สวัสดี เรายังนัดเจอกันที่คณะเศรษฐศาสตร์ตอน 10 โมงเหมือนเดิมไหม",
        },
        undefined,
        24
      ),
      chatMessage(
        "campus-2",
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "10:21",
        {
          en: "Yes, I’ll bring the printed consent forms.",
          th: "ใช่ เดี๋ยวฉันนำแบบฟอร์มยินยอมฉบับพิมพ์ไปให้",
        },
        undefined,
        21
      ),
      chatMessage(
        "campus-3",
        "demo-hirer",
        "10:32",
        {
          en: "Could you send the final schedule to the team?",
          th: "ช่วยส่งกำหนดการฉบับสุดท้ายให้ทีมได้ไหม",
        },
        undefined,
        10
      ),
      chatMessage(
        "campus-4",
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "10:35",
        undefined,
        { name: "fieldwork-schedule.pdf", meta: "PDF · 248 KB", kind: "pdf" },
        7
      ),
      chatMessage(
        "campus-5",
        "demo-hirer",
        "10:42",
        {
          en: "Thanks — I’ll share it with the rest of the Quest team.",
          th: "ขอบคุณ เดี๋ยวฉันแชร์ให้ทีมเควสต์ที่เหลือ",
        },
        undefined,
        2
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: chatSentAt(11) },
  },
  {
    id: "open-day-media",
    memberIds: ["demo-worker-2", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: {
      en: "Open Day Media Team",
      th: "ทีมสื่อประชาสัมพันธ์วันเปิดบ้าน",
    },
    participantName: "Nina K.",
    participantRole: "member",
    initials: "NK",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "open-day-1",
        "demo-worker-2",
        "Yesterday",
        {
          en: "The poster looks good. I’ll upload the final version.",
          th: "โปสเตอร์ดูดีแล้ว เดี๋ยวฉันอัปโหลดฉบับสุดท้าย",
        },
        undefined,
        24 * 60 + 1
      ),
      chatMessage(
        "open-day-2",
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "Yesterday",
        {
          en: "Great. Please keep the venue details unchanged.",
          th: "เยี่ยมเลย รบกวนคงรายละเอียดสถานที่ไว้เหมือนเดิมนะ",
        },
        undefined,
        24 * 60
      ),
      chatMessage(
        "open-day-3",
        "demo-worker-2",
        "Yesterday",
        undefined,
        { name: "open-day-poster.png", meta: "PNG · 1.4 MB", kind: "image" },
        24 * 60 - 1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "faculty-research-assistant",
    memberIds: ["demo-hirer", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: {
      en: "Faculty Research Assistant",
      th: "ผู้ช่วยงานวิจัยประจำคณะ",
    },
    participantName: "Ploy Rattanaporn",
    participantRole: "owner",
    initials: "PR",
    avatarColor: "#F0F4F1",
    messages: [
      chatMessage(
        "research-1",
        "demo-hirer",
        "Mon",
        {
          en: "I’ve attached the consent form for your review.",
          th: "ฉันแนบแบบฟอร์มยินยอมสำหรับตรวจสอบไว้แล้ว",
        },
        undefined,
        24 * 60
      ),
      chatMessage(
        "research-2",
        "demo-hirer",
        "Mon",
        undefined,
        { name: "participant-consent.pdf", meta: "PDF · 326 KB", kind: "pdf" },
        24 * 60 - 1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
];
export {
  FIXTURE_CHAT_SEEDS,
  QUEST_OWNER_GREETING,
  chatSentAt,
  questConversationId,
};
