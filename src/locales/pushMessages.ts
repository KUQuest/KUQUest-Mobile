import {
  QuestV2PushTypeValue,
  type QuestV2PushType,
  type QuestV2PushFailureReason,
  type QuestV2UnderfilledCancellationReason,
} from "@/api/questV2Contracts";
import type { SupportedLocale } from "./locale";

export type PushType = QuestV2PushType;
export type PushCancellationReason = QuestV2UnderfilledCancellationReason;
export type PushFailureReason = QuestV2PushFailureReason;

const copy = {
  en: {
    UNDERFILLED_DECISION_PENDING: {
      title: "Quest needs your decision",
      body: (remaining: string) =>
        `Choose whether to proceed. ${remaining} left.`,
    },
    UNDERFILLED_CONSENT_PENDING: {
      title: "Consent needed",
      body: (remaining: string) =>
        `Respond to the revised Quest. ${remaining} left.`,
    },
    UNDERFILLED_COMPLETED: {
      title: "Quest ready to start",
      body: "All Workers consented. Open Quest details.",
    },
    UNDERFILLED_CANCELLED: {
      title: "Quest cancelled",
      body: {
        HIRER_CANCELLED: "The Hirer cancelled this Quest.",
        HIRER_NO_DECISION: "The Hirer did not decide before the window closed.",
        WORKER_DECLINED: "A Worker declined the revised Quest.",
        CONSENT_TIMEOUT: "Not all Workers responded before the window closed.",
      },
    },
    QUEST_ASSIGNED: {
      title: "Quest roster filled",
      body: "The Quest is ready for its Workers.",
    },
    PROOF_NOT_APPROVED: {
      title: "Proof not approved",
      body: "The Hirer did not approve your Proof. Your work on this Quest has ended.",
    },
    QUEST_COMPLETED_DISPUTE_WINDOW_OPEN: {
      title: "Quest completed without your payout",
      body: "Your work was not approved. You can still file a Dispute Case for a limited time.",
    },
    QUEST_FAILED: {
      title: "Quest failed",
      body: {
        PROOF_NOT_APPROVED: "No Worker's Proof was approved.",
        DUE_AT_MISSED: "The due time passed before all Proof was sent.",
      },
    },
  },
  th: {
    UNDERFILLED_DECISION_PENDING: {
      title: "เควสต์รอการตัดสินใจ",
      body: (remaining: string) =>
        `เลือกว่าจะดำเนินการต่อหรือไม่ เหลือเวลา ${remaining}`,
    },
    UNDERFILLED_CONSENT_PENDING: {
      title: "กรุณายืนยันความยินยอม",
      body: (remaining: string) =>
        `ตอบรับเควสต์ที่ปรับปรุงแล้ว เหลือเวลา ${remaining}`,
    },
    UNDERFILLED_COMPLETED: {
      title: "เควสต์พร้อมเริ่มงาน",
      body: "ผู้ปฏิบัติงานทุกคนยินยอมแล้ว ดูรายละเอียดเควสต์",
    },
    UNDERFILLED_CANCELLED: {
      title: "เควสต์ถูกยกเลิก",
      body: {
        HIRER_CANCELLED: "ผู้ว่าจ้างยกเลิกเควสต์นี้",
        HIRER_NO_DECISION: "ผู้ว่าจ้างไม่ได้ตัดสินใจก่อนหมดเวลา",
        WORKER_DECLINED: "ผู้ปฏิบัติงานปฏิเสธเควสต์ที่ปรับปรุงแล้ว",
        CONSENT_TIMEOUT: "ผู้ปฏิบัติงานตอบกลับไม่ครบก่อนหมดเวลา",
      },
    },
    QUEST_ASSIGNED: {
      title: "รายชื่อผู้ปฏิบัติงานครบแล้ว",
      body: "เควสต์พร้อมสำหรับผู้ปฏิบัติงานแล้ว",
    },
    PROOF_NOT_APPROVED: {
      title: "หลักฐานไม่ได้รับการอนุมัติ",
      body: "ผู้ว่าจ้างไม่อนุมัติหลักฐานของคุณ งานของคุณในเควสต์นี้สิ้นสุดแล้ว",
    },
    QUEST_COMPLETED_DISPUTE_WINDOW_OPEN: {
      title: "เควสต์เสร็จสิ้นโดยไม่มีการจ่ายเงินให้คุณ",
      body: "งานของคุณไม่ได้รับการอนุมัติ คุณยังยื่นข้อพิพาทได้ภายในเวลาที่กำหนด",
    },
    QUEST_FAILED: {
      title: "เควสต์ล้มเหลว",
      body: {
        PROOF_NOT_APPROVED: "ไม่มีหลักฐานของผู้ปฏิบัติงานคนใดได้รับการอนุมัติ",
        DUE_AT_MISSED: "เลยกำหนดส่งก่อนที่หลักฐานจะครบ",
      },
    },
  },
} satisfies Record<SupportedLocale, Record<PushType, unknown>>;

export function pushMessage(
  locale: SupportedLocale,
  type: PushType,
  options: {
    remaining?: string;
    cancellationReason?: PushCancellationReason;
    failureReason?: PushFailureReason;
  } = {}
): { title: string; body: string } {
  const messages = copy[locale][type] as {
    title: string;
    body:
      | string
      | ((remaining: string) => string)
      | Record<PushCancellationReason, string>
      | Record<PushFailureReason, string>;
  };
  if (type === QuestV2PushTypeValue.UNDERFILLED_CANCELLED) {
    const reason = options.cancellationReason;
    return {
      title: messages.title,
      body:
        reason && typeof messages.body !== "string"
          ? (messages.body as Record<PushCancellationReason, string>)[reason]
          : locale === "th"
            ? "สถานะเควสต์นี้ถูกยกเลิกแล้ว"
            : "This Quest was cancelled.",
    };
  }
  if (type === QuestV2PushTypeValue.QUEST_FAILED) {
    const reason = options.failureReason;
    return {
      title: messages.title,
      body:
        reason && typeof messages.body !== "string"
          ? (messages.body as Record<PushFailureReason, string>)[reason]
          : locale === "th"
            ? "เควสต์นี้ล้มเหลว"
            : "This Quest failed.",
    };
  }
  return {
    title: messages.title,
    body:
      typeof messages.body === "function"
        ? messages.body(options.remaining ?? "")
        : (messages.body as string),
  };
}
