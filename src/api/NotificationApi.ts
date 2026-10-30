import { z } from "zod";
import { ApiClient, type RequestOptions } from "./ApiClient";
import {
  questV2PushTypeSchema,
  questV2UnderfilledCancellationReasonSchema,
} from "./questV2Contracts";

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

/**
 * Dispute Case `type` values (staging, 2026-10-31). They stay out of
 * `memberNotificationTypeSchema`, which also validates the penalty Push.
 */
export const memberDisputeNotificationTypeSchema = z.enum([
  "DISPUTE_CASE_FILED_AGAINST_YOU",
  "DISPUTE_CASE_DECIDED",
]);
export type MemberDisputeNotificationType = z.infer<
  typeof memberDisputeNotificationTypeSchema
>;

export const memberDisputeStatusSchema = z.enum([
  "DISPUTE_CASE_DISMISSED",
  "DISPUTE_CASE_RESOLVED",
]);

export const memberNotificationCategorySchema = z.enum([
  "PENALTY",
  "QUEST",
  "DISPUTE",
]);
export type MemberNotificationCategory = z.infer<
  typeof memberNotificationCategorySchema
>;

/** Quest lifecycle rows reuse the eight Quest push types. */
export const memberQuestNotificationTypeSchema = questV2PushTypeSchema;

/** `failureReason` of a `QUEST_FAILED` row; the push omits the middle value. */
export const memberFailureReasonSchema = z.enum([
  "PROOF_NOT_APPROVED",
  "COMPLETION_NOT_APPROVED",
  "DUE_AT_MISSED",
]);
export type MemberFailureReason = z.infer<typeof memberFailureReasonSchema>;

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
  questTitle: z.string().nullable().optional(),
  /** Quest rows only. */
  failureReason: memberFailureReasonSchema.nullable().catch(null).optional(),
  cancellationReason: questV2UnderfilledCancellationReasonSchema
    .nullable()
    .catch(null)
    .optional(),
  /** Dispute rows only. `viewerWon` is the server's answer for this Member. */
  disputeCaseId: z.string().nullable().optional(),
  disputeStatus: memberDisputeStatusSchema.nullable().catch(null).optional(),
  viewerWon: z.boolean().nullable().optional(),
});
export type MemberNotification = z.infer<typeof memberNotificationSchema>;

const notificationPageSchema = z.object({
  items: z.array(memberNotificationSchema),
  nextCursor: z.string().nullable(),
});
export type MemberNotificationPage = z.infer<typeof notificationPageSchema>;

const unreadNumber = z.coerce.number().int().min(0);
const unreadSummarySchema = z.object({
  count: unreadNumber,
  byCategory: z
    .object({
      PENALTY: unreadNumber,
      QUEST: unreadNumber,
      DISPUTE: unreadNumber,
    })
    .catch({ PENALTY: 0, QUEST: 0, DISPUTE: 0 }),
});
export type MemberUnreadSummary = z.infer<typeof unreadSummarySchema>;

/** `category` narrows `all` to one category. */
export type MarkNotificationsReadTarget =
  { ids: string[] } | { all: true; category?: MemberNotificationCategory };

export class NotificationApi {
  constructor(private readonly client: ApiClient = new ApiClient()) {}

  listNotifications(
    params: {
      cursor?: string | null;
      limit?: number;
      unreadOnly?: boolean;
      category?: MemberNotificationCategory;
    },
    options: RequestOptions = {}
  ): Promise<MemberNotificationPage> {
    return this.client.get("/api/v1/notifications", notificationPageSchema, {
      ...options,
      query: {
        limit: params.limit,
        cursor: params.cursor ?? undefined,
        unreadOnly: params.unreadOnly,
        category: params.category,
      },
    });
  }

  unreadSummary(options: RequestOptions = {}): Promise<MemberUnreadSummary> {
    return this.client.get(
      "/api/v1/notifications/unread-count",
      unreadSummarySchema,
      options
    );
  }

  async countUnread(options: RequestOptions = {}): Promise<number> {
    return (await this.unreadSummary(options)).count;
  }

  /** Idempotent: a read row keeps its first `readAt`. */
  async markRead(target: MarkNotificationsReadTarget): Promise<void> {
    await this.client.send("POST", "/api/v1/notifications/read", z.unknown(), {
      json: target,
    });
  }
}

export const notificationApi = new NotificationApi();
