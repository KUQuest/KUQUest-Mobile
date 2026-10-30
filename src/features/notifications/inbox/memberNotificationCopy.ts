import {
  memberNotificationTypeSchema,
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
  },
  locale: SupportedLocale
): { title: string; body: string; known: boolean } {
  const messages = memberNotificationMessages[locale];
  const type = memberNotificationTypeSchema.safeParse(notification.type);
  if (!type.success) return { ...messages.generic, known: false };
  const until = notification.expiresAt
    ? formatTimestampDateTime(notification.expiresAt, locale)
    : null;
  return {
    ...messages.types[type.data](notification.result ?? null, until),
    known: true,
  };
}
