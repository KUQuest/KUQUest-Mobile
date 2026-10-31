import {
  memberDisputeNotificationTypeSchema,
  memberNotificationTypeSchema,
  type MemberNotification,
  type MemberPenaltyResult,
} from "@/api/NotificationApi";
import {
  QuestV2PushTypeValue,
  questV2PushTypeSchema,
} from "@/api/questV2Contracts";
import { formatTimestampDateTime } from "@/domain/datetime";
import type { SupportedLocale } from "@/locales/locale";
import { memberNotificationMessages } from "@/locales/memberNotificationMessages";
import { pushMessage } from "@/locales/pushMessages";

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
    Pick<
      MemberNotification,
      | "questTitle"
      | "disputeStatus"
      | "viewerWon"
      | "failureReason"
      | "cancellationReason"
    >
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
  const until = notification.expiresAt
    ? formatTimestampDateTime(notification.expiresAt, locale)
    : null;
  const quest = questV2PushTypeSchema.safeParse(notification.type);
  if (quest.success) {
    if (quest.data === QuestV2PushTypeValue.UNDERFILLED_DECISION_PENDING)
      return messages.quest.decisionPending(until);
    if (quest.data === QuestV2PushTypeValue.UNDERFILLED_CONSENT_PENDING)
      return messages.quest.consentPending(until);
    if (
      quest.data === QuestV2PushTypeValue.QUEST_FAILED &&
      notification.failureReason === "COMPLETION_NOT_APPROVED"
    )
      return messages.quest.completionNotApproved;
    return pushMessage(locale, quest.data, {
      failureReason:
        notification.failureReason === "COMPLETION_NOT_APPROVED"
          ? undefined
          : (notification.failureReason ?? undefined),
      cancellationReason: notification.cancellationReason ?? undefined,
    });
  }
  const type = memberNotificationTypeSchema.safeParse(notification.type);
  if (!type.success) return messages.generic;
  return messages.types[type.data](notification.result ?? null, until);
}
