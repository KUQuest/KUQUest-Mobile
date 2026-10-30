import {
  Ban,
  Bell,
  Flag,
  FlagOff,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";

import {
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
