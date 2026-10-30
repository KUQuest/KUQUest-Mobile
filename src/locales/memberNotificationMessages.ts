import type {
  MemberNotificationType,
  MemberPenaltyResult,
} from "@/api/NotificationApi";
import type { SupportedLocale } from "./locale";

type Copy = { title: string; body: string };
/** `until` is the formatted `expiresAt`, or null when the server sent none. */
type CopyBuilder = (
  result: MemberPenaltyResult | null,
  until: string | null
) => Copy;

type MemberNotificationMessages = {
  title: string;
  back: string;
  markAllRead: string;
  markingAllRead: string;
  unreadOnly: string;
  all: string;
  loading: string;
  error: string;
  errorDescription: string;
  retry: string;
  empty: string;
  emptyUnread: string;
  loadMore: string;
  unread: string;
  openInbox: (count: number) => string;
  generic: Copy;
  types: Record<MemberNotificationType, CopyBuilder>;
};

export const memberNotificationMessages: Record<
  SupportedLocale,
  MemberNotificationMessages
> = {
  en: {
    title: "Notifications",
    back: "Back",
    markAllRead: "Mark all read",
    markingAllRead: "Marking…",
    unreadOnly: "Unread",
    all: "All",
    loading: "Loading notifications",
    error: "Unable to load notifications.",
    errorDescription: "Check your connection and try again.",
    retry: "Try again",
    empty: "No notifications yet.",
    emptyUnread: "You have read every notification.",
    loadMore: "Load more",
    unread: "Unread",
    openInbox: (count) =>
      count > 0 ? `Notifications, ${count} unread` : "Notifications",
    generic: {
      title: "Account update",
      body: "There is an update on your account.",
    },
    types: {
      PENALTY_RED_FLAG_APPLIED: (_result, until) => ({
        title: "Red Flag on your account",
        body: until
          ? `Until ${until} you cannot publish Quests, apply as a Candidate, or join FCFS Quests.`
          : "You cannot publish Quests, apply as a Candidate, or join FCFS Quests for now.",
      }),
      PENALTY_RED_FLAG_EXPIRED: () => ({
        title: "Red Flag ended",
        body: "You can publish, apply to, and join Quests again.",
      }),
      PENALTY_BAN_APPLIED: (result, until) => ({
        title:
          result === "PERMANENT_BAN"
            ? "Your account is permanently banned"
            : until
              ? `Account banned until ${until}`
              : "Your account is banned",
        body:
          result === "PERMANENT_BAN"
            ? "You cannot sign in. Your Wallet is frozen."
            : "While the ban lasts, you cannot sign in and your Wallet is frozen.",
      }),
      PENALTY_BAN_ENDED: () => ({
        title: "Ban ended",
        body: "You can sign in and use KUQuest again.",
      }),
      CONDUCT_REPORT_UPHELD: () => ({
        title: "Conduct Report upheld",
        body: "An Admin upheld a Conduct Report about you. Check your penalty status on your Profile.",
      }),
    },
  },
  th: {
    title: "การแจ้งเตือน",
    back: "ย้อนกลับ",
    markAllRead: "อ่านทั้งหมด",
    markingAllRead: "กำลังบันทึก…",
    unreadOnly: "ยังไม่อ่าน",
    all: "ทั้งหมด",
    loading: "กำลังโหลดการแจ้งเตือน",
    error: "ไม่สามารถโหลดการแจ้งเตือนได้",
    errorDescription: "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
    retry: "ลองอีกครั้ง",
    empty: "ยังไม่มีการแจ้งเตือน",
    emptyUnread: "คุณอ่านการแจ้งเตือนครบแล้ว",
    loadMore: "โหลดเพิ่ม",
    unread: "ยังไม่อ่าน",
    openInbox: (count) =>
      count > 0 ? `การแจ้งเตือน ยังไม่อ่าน ${count} รายการ` : "การแจ้งเตือน",
    generic: {
      title: "อัปเดตบัญชี",
      body: "มีการอัปเดตเกี่ยวกับบัญชีของคุณ",
    },
    types: {
      PENALTY_RED_FLAG_APPLIED: (_result, until) => ({
        title: "บัญชีของคุณติด Red Flag",
        body: until
          ? `ถึง ${until} คุณจะเผยแพร่เควสต์ สมัครเป็น Candidate หรือเข้าร่วมเควสต์ FCFS ไม่ได้`
          : "ขณะนี้คุณเผยแพร่เควสต์ สมัครเป็น Candidate หรือเข้าร่วมเควสต์ FCFS ไม่ได้",
      }),
      PENALTY_RED_FLAG_EXPIRED: () => ({
        title: "Red Flag สิ้นสุดแล้ว",
        body: "คุณเผยแพร่ สมัคร และเข้าร่วมเควสต์ได้อีกครั้ง",
      }),
      PENALTY_BAN_APPLIED: (result, until) => ({
        title:
          result === "PERMANENT_BAN"
            ? "บัญชีของคุณถูกแบนถาวร"
            : until
              ? `บัญชีถูกแบนถึง ${until}`
              : "บัญชีของคุณถูกแบน",
        body:
          result === "PERMANENT_BAN"
            ? "คุณเข้าสู่ระบบไม่ได้ และกระเป๋าเงินถูกระงับ"
            : "ระหว่างถูกแบน คุณเข้าสู่ระบบไม่ได้ และกระเป๋าเงินถูกระงับ",
      }),
      PENALTY_BAN_ENDED: () => ({
        title: "การแบนสิ้นสุดแล้ว",
        body: "คุณเข้าสู่ระบบและใช้งาน KUQuest ได้อีกครั้ง",
      }),
      CONDUCT_REPORT_UPHELD: () => ({
        title: "รายงานพฤติกรรมได้รับการยืนยัน",
        body: "แอดมินยืนยันรายงานพฤติกรรมเกี่ยวกับคุณ ตรวจสอบสถานะบทลงโทษได้ที่โปรไฟล์",
      }),
    },
  },
};
