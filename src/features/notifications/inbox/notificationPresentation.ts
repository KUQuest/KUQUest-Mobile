import {
  Ban,
  Bell,
  Flag,
  FlagOff,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";

import {
  memberDisputeNotificationTypeSchema,
  memberNotificationTypeSchema,
  type MemberNotification,
  type MemberNotificationType,
} from "@/api/NotificationApi";
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

/** A decided case opens its Quest, where the Member reads the money result. */
export function notificationOpensQuest(
  notification: Pick<MemberNotification, "type" | "questId">
): boolean {
  return notification.type === "DISPUTE_CASE_DECIDED" && !!notification.questId;
}
