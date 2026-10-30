import type {
  MemberNotificationType,
  MemberPenaltyResult,
} from "@/api/NotificationApi";
import type { SupportedLocale } from "./locale";

type DisputeStatus = "DISPUTE_CASE_DISMISSED" | "DISPUTE_CASE_RESOLVED";
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
  unreadOnly: (count: number) => string;
  all: string;
  today: string;
  yesterday: string;
  loading: string;
  error: string;
  errorDescription: string;
  retry: string;
  empty: string;
  emptyDescription: string;
  emptyUnread: string;
  emptyUnreadDescription: string;
  loadMore: string;
  unread: string;
  opensProfile: string;
  opensQuest: string;
  opensRespondForm: string;
  openInbox: (count: number) => string;
  generic: Copy;
  types: Record<MemberNotificationType, CopyBuilder>;
  dispute: {
    filedAgainstYou: (questTitle: string | null) => Copy;
    /** `viewerWon` is the server's answer for this Member; null when unknown. */
    decided: (
      status: DisputeStatus | null,
      viewerWon: boolean | null,
      questTitle: string | null
    ) => Copy;
  };
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
    unreadOnly: (count) => (count > 0 ? `Unread · ${count}` : "Unread"),
    all: "All",
    today: "Today",
    yesterday: "Yesterday",
    loading: "Loading notifications",
    error: "Unable to load notifications.",
    errorDescription: "Check your connection and try again.",
    retry: "Try again",
    empty: "No notifications yet",
    emptyDescription:
      "Updates about your account, such as a Red Flag or a ban, show up here.",
    emptyUnread: "You're all caught up",
    emptyUnreadDescription: "You have read every notification.",
    loadMore: "Load more",
    unread: "Unread",
    opensProfile: "Opens your profile",
    opensQuest: "Opens the Quest",
    opensRespondForm: "Opens a form to send your statement",
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
    dispute: {
      filedAgainstYou: (questTitle) => ({
        title: "A Dispute Case was filed against you",
        body: questTitle
          ? `About "${questTitle}". Open it to send your statement.`
          : "Open it to send your statement.",
      }),
      decided: (status, viewerWon, questTitle) => {
        const about = questTitle ? ` on "${questTitle}"` : "";
        if (status === "DISPUTE_CASE_DISMISSED") {
          return {
            title: "Dispute Case dismissed",
            body: `An Admin dismissed the Dispute Case${about}.`,
          };
        }
        if (viewerWon === true) {
          return {
            title: "You won the Dispute Case",
            body: `An Admin decided in your favour${about}.`,
          };
        }
        if (viewerWon === false) {
          return {
            title: "You did not win the Dispute Case",
            body: `An Admin decided against you${about}.`,
          };
        }
        return {
          title: "Dispute Case decided",
          body: `An Admin decided the Dispute Case${about}.`,
        };
      },
    },
  },
  th: {
    title: "การแจ้งเตือน",
    back: "ย้อนกลับ",
    markAllRead: "อ่านทั้งหมด",
    markingAllRead: "กำลังบันทึก…",
    unreadOnly: (count) => (count > 0 ? `ยังไม่อ่าน · ${count}` : "ยังไม่อ่าน"),
    all: "ทั้งหมด",
    today: "วันนี้",
    yesterday: "เมื่อวาน",
    loading: "กำลังโหลดการแจ้งเตือน",
    error: "ไม่สามารถโหลดการแจ้งเตือนได้",
    errorDescription: "ตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
    retry: "ลองอีกครั้ง",
    empty: "ยังไม่มีการแจ้งเตือน",
    emptyDescription:
      "การอัปเดตเกี่ยวกับบัญชีของคุณ เช่น Red Flag หรือการแบน จะแสดงที่นี่",
    emptyUnread: "คุณอ่านครบแล้ว",
    emptyUnreadDescription: "คุณอ่านการแจ้งเตือนครบทุกรายการแล้ว",
    loadMore: "โหลดเพิ่ม",
    unread: "ยังไม่อ่าน",
    opensProfile: "เปิดโปรไฟล์ของคุณ",
    opensQuest: "เปิดเควสต์",
    opensRespondForm: "เปิดฟอร์มส่งคำชี้แจง",
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
    dispute: {
      filedAgainstYou: (questTitle) => ({
        title: "มีการยื่นคำร้องข้อพิพาทเกี่ยวกับคุณ",
        body: questTitle
          ? `เควสต์ "${questTitle}" เปิดเพื่อส่งคำชี้แจงของคุณ`
          : "เปิดเพื่อส่งคำชี้แจงของคุณ",
      }),
      decided: (status, viewerWon, questTitle) => {
        const about = questTitle ? ` ในเควสต์ "${questTitle}"` : "";
        if (status === "DISPUTE_CASE_DISMISSED") {
          return {
            title: "คำร้องข้อพิพาทถูกยก",
            body: `แอดมินยกคำร้องข้อพิพาท${about}`,
          };
        }
        if (viewerWon === true) {
          return {
            title: "คุณชนะคำร้องข้อพิพาท",
            body: `แอดมินตัดสินให้คุณชนะ${about}`,
          };
        }
        if (viewerWon === false) {
          return {
            title: "คุณไม่ชนะคำร้องข้อพิพาท",
            body: `แอดมินตัดสินไม่เข้าข้างคุณ${about}`,
          };
        }
        return {
          title: "คำร้องข้อพิพาทมีผลตัดสินแล้ว",
          body: `แอดมินตัดสินคำร้องข้อพิพาท${about}`,
        };
      },
    },
  },
};
