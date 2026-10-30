import { z } from "zod";
import { ApiClient, type RequestOptions } from "./ApiClient";

/** Member Notification `type` values the app has copy for (ADR 0035). */
export const memberNotificationTypeSchema = z.enum([
  "PENALTY_RED_FLAG_APPLIED",
  "PENALTY_RED_FLAG_EXPIRED",
  "PENALTY_BAN_APPLIED",
  "PENALTY_BAN_ENDED",
  "CONDUCT_REPORT_UPHELD",
]);
export type MemberNotificationType = z.infer<
  typeof memberNotificationTypeSchema
>;

export const memberPenaltyResultSchema = z.enum([
  "RED_FLAG",
  "TEMPORARY_BAN",
  "PERMANENT_BAN",
]);
export type MemberPenaltyResult = z.infer<typeof memberPenaltyResultSchema>;

/**
 * One `listMemberNotifications` row. `type` stays a plain string so a type
 * added later by the server renders as a generic row instead of failing the
 * whole page.
 */
export const memberNotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  questId: z.string().nullable(),
  result: memberPenaltyResultSchema.nullable().catch(null),
  expiresAt: z.string().nullable(),
});
export type MemberNotification = z.infer<typeof memberNotificationSchema>;

const notificationPageSchema = z.object({
  items: z.array(memberNotificationSchema),
  nextCursor: z.string().nullable(),
});
export type MemberNotificationPage = z.infer<typeof notificationPageSchema>;

const unreadCountSchema = z.object({ count: z.coerce.number().int().min(0) });

export type MarkNotificationsReadTarget = { ids: string[] } | { all: true };

export class NotificationApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  listNotifications(
    params: { cursor?: string | null; limit?: number; unreadOnly?: boolean },
    options: RequestOptions = {}
  ): Promise<MemberNotificationPage> {
    return this.client.get("/api/v1/notifications", notificationPageSchema, {
      ...options,
      query: {
        limit: params.limit,
        cursor: params.cursor ?? undefined,
        unreadOnly: params.unreadOnly,
      },
    });
  }

  async countUnread(options: RequestOptions = {}): Promise<number> {
    const result = await this.client.get(
      "/api/v1/notifications/unread-count",
      unreadCountSchema,
      options
    );
    return result.count;
  }

  /** Idempotent: a read row keeps its first `readAt`. */
  async markRead(target: MarkNotificationsReadTarget): Promise<void> {
    await this.client.send("POST", "/api/v1/notifications/read", z.unknown(), {
      json: target,
    });
  }
}

export const notificationApi = new NotificationApi();
