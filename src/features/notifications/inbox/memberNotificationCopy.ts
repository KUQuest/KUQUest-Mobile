import {
  memberDisputeNotificationTypeSchema,
  memberNotificationTypeSchema,
  type MemberNotification,
  type MemberPenaltyResult,
} from "@/api/NotificationApi";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import { memberNotificationMessages } from "@/locales/memberNotificationMessages";

/**
 * App-written copy for a Member Notification. The server sends codes only;
 * an unknown `type` gets the generic row.
 */
export function memberNotificationCopy(
  notification: {
    type: string;
    result?: MemberPenaltyResult | null;
    expiresAt?: string | null;
  } & Partial<
    Pick<MemberNotification, "questTitle" | "disputeStatus" | "viewerWon">
  >,
  locale: SupportedLocale
): { title: string; body: string } {
  const messages = memberNotificationMessages[locale];
  const dispute = memberDisputeNotificationTypeSchema.safeParse(
    notification.type
  );
  if (dispute.success) {
    const questTitle = notification.questTitle ?? null;
    return dispute.data === "DISPUTE_CASE_FILED_AGAINST_YOU"
      ? messages.dispute.filedAgainstYou(questTitle)
      : messages.dispute.decided(
          notification.disputeStatus ?? null,
          notification.viewerWon ?? null,
          questTitle
        );
  }
  const type = memberNotificationTypeSchema.safeParse(notification.type);
  if (!type.success) return messages.generic;
  const until = notification.expiresAt
    ? formatTimestampDateTime(notification.expiresAt, locale)
    : null;
  return messages.types[type.data](notification.result ?? null, until);
}
