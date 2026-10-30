import {
  Ban,
  Bell,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Flag,
  FlagOff,
  Hourglass,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";

import { questV2PushTypeSchema } from "@/api/questV2Contracts";
import {
  memberDisputeNotificationTypeSchema,
  memberNotificationTypeSchema,
  type MemberNotification,
  type MemberNotificationType,
} from "@/api/NotificationApi";
import { routeForPush } from "@/features/notifications/push/pushPayload";
import type { ThemeColors } from "@/theme/colors";

export type NotificationTone = "warning" | "success" | "danger" | "neutral";

type Presentation = { icon: LucideIcon; tone: NotificationTone };

/** Tone is support only: the row title carries the meaning. */
export const notificationPresentationByType: Record<
  MemberNotificationType,
  Presentation
> = {
  PENALTY_RED_FLAG_APPLIED: { icon: Flag, tone: "warning" },
  PENALTY_RED_FLAG_EXPIRED: { icon: FlagOff, tone: "success" },
  PENALTY_BAN_APPLIED: { icon: Ban, tone: "danger" },
  PENALTY_BAN_ENDED: { icon: ShieldCheck, tone: "success" },
  CONDUCT_REPORT_UPHELD: { icon: Flag, tone: "warning" },
};

const questPresentation: Record<
  ReturnType<typeof questV2PushTypeSchema.parse>,
  Presentation
> = {
  UNDERFILLED_DECISION_PENDING: { icon: Hourglass, tone: "warning" },
  UNDERFILLED_CONSENT_PENDING: { icon: Hourglass, tone: "warning" },
  UNDERFILLED_COMPLETED: { icon: CircleCheck, tone: "success" },
  UNDERFILLED_CANCELLED: { icon: CircleX, tone: "danger" },
  QUEST_ASSIGNED: { icon: ClipboardCheck, tone: "success" },
  PROOF_NOT_APPROVED: { icon: CircleX, tone: "danger" },
  QUEST_COMPLETED_DISPUTE_WINDOW_OPEN: { icon: Scale, tone: "warning" },
  QUEST_FAILED: { icon: CircleX, tone: "danger" },
};

const NEUTRAL: Presentation = { icon: Bell, tone: "neutral" };
const DISPUTE: Presentation = { icon: Scale, tone: "warning" };

export const notificationToneStyle: Record<
  NotificationTone,
  { tile: string; iconColor: keyof ThemeColors }
> = {
  warning: { tile: "bg-ku-surface-warning", iconColor: "warningDark" },
  success: { tile: "bg-ku-surface-success", iconColor: "success" },
  danger: { tile: "bg-ku-surface-danger", iconColor: "dangerDark" },
  neutral: { tile: "bg-ku-surface-muted", iconColor: "textMuted" },
};

export function notificationPresentation(
  notification: Pick<MemberNotification, "type" | "result">
): Presentation {
  if (memberDisputeNotificationTypeSchema.safeParse(notification.type).success)
    return DISPUTE;
  const quest = questV2PushTypeSchema.safeParse(notification.type);
  if (quest.success) return questPresentation[quest.data];
  const type = memberNotificationTypeSchema.safeParse(notification.type);
  if (!type.success) return NEUTRAL;
  if (
    type.data === "CONDUCT_REPORT_UPHELD" &&
    (notification.result === "TEMPORARY_BAN" ||
      notification.result === "PERMANENT_BAN")
  ) {
    return { icon: Ban, tone: "danger" };
  }
  return notificationPresentationByType[type.data];
}

/** Penalty rows open the Profile, where the Member sees their penalty status. */
export function notificationOpensProfile(
  notification: Pick<MemberNotification, "type" | "result">
): boolean {
  return notification.type === "CONDUCT_REPORT_UPHELD" || !!notification.result;
}

/** A case filed against the viewer opens the statement form. */
export function notificationOpensRespondForm(
  notification: Pick<MemberNotification, "type" | "disputeCaseId">
): boolean {
  return (
    notification.type === "DISPUTE_CASE_FILED_AGAINST_YOU" &&
    !!notification.disputeCaseId
  );
}

/**
 * Where a Dispute result or Quest row leads: the Quest, or the partial-start
 * consent screen for `UNDERFILLED_CONSENT_PENDING` (same as its Push).
 */
export function notificationQuestRoute(
  notification: Pick<MemberNotification, "type" | "questId">
) {
  if (!notification.questId) return null;
  if (notification.type === "DISPUTE_CASE_DECIDED") {
    return {
      pathname: "/quest/[id]",
      params: { id: notification.questId },
    } as const;
  }
  const quest = questV2PushTypeSchema.safeParse(notification.type);
  return quest.success
    ? routeForPush({ type: quest.data, questId: notification.questId })
    : null;
}
