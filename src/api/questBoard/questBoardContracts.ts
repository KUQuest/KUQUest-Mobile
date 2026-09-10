import { z } from "zod";

/** Runtime contracts for the Backend v2 Quest Board transport boundary. */
export const QUEST_BOARD_API_VERSION = "v2" as const;

const questIdSchema = z.string().uuid();
const dateTimeSchema = z.string().datetime({ offset: true });
const questRewardSchema = z.number().finite().min(0).max(700_000);
const positiveIntegerSchema = z.number().int().positive();
const nonNegativeIntegerSchema = z.number().int().nonnegative();

export const questBoardModeSchema = z.enum([
  "FIRST_COME_FIRST_SERVED",
  "CANDIDATE",
]);
export const questBoardParticipationSchema = z.enum(["SINGLE", "GROUP"]);
export const questBoardStatusSchema = z.enum([
  "QUEST_DRAFT",
  "QUEST_OPEN",
  "QUEST_ASSIGNED",
  "QUEST_IN_PROGRESS",
  "QUEST_COMPLETED",
  "QUEST_CANCELLED",
  "QUEST_FAILED",
]);

export const questBoardTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const questBoardLocationSchema = z.object({
  label: z.string().min(1),
});

export const questBoardImageSchema = z.object({
  imageId: questIdSchema,
  position: nonNegativeIntegerSchema,
  url: z.string().url(),
  urlExpiresAt: dateTimeSchema,
});

/** The Quest Board card returned by GET /api/v2/quests. */
export const questBoardCardSchema = z.object({
  id: questIdSchema,
  title: z.string(),
  questReward: questRewardSchema,
  tag: questBoardTagSchema,
  mode: questBoardModeSchema,
  participation: questBoardParticipationSchema,
  headcount: positiveIntegerSchema,
  activeWorkerCount: nonNegativeIntegerSchema.max(20),
  startTime: dateTimeSchema,
  dueAt: dateTimeSchema,
  hirerName: z.string(),
  location: z.string().nullable(),
});

export const questBoardCursorSchema = z.object({
  items: z.array(questBoardCardSchema),
  nextCursor: z.string().nullable(),
});

/** Success envelope returned by GET /api/v2/quests. */
export const questBoardResponseSchema = z.object({
  success: z.literal(true),
  data: questBoardCursorSchema,
});

/** The Quest detail returned by GET /api/v2/quests/:questId. */
export const questBoardDetailSchema = z.object({
  id: questIdSchema,
  title: z.string(),
  description: z.string().nullable(),
  condition: z.object({
    items: z.array(z.object({
      position: nonNegativeIntegerSchema,
      text: z.string(),
    })).min(1),
  }),
  tag: questBoardTagSchema,
  mode: questBoardModeSchema,
  participation: questBoardParticipationSchema,
  state: questBoardStatusSchema,
  questReward: questRewardSchema,
  headcount: positiveIntegerSchema,
  activeWorkerCount: nonNegativeIntegerSchema.max(20),
  startTime: dateTimeSchema,
  dueAt: dateTimeSchema,
  proofRequired: z.boolean(),
  hirerName: z.string(),
  locations: z.array(questBoardLocationSchema),
  images: z.array(questBoardImageSchema),
});

/** Success envelope returned by GET /api/v2/quests/:questId. */
export const questBoardDetailResponseSchema = z.object({
  success: z.literal(true),
  data: questBoardDetailSchema,
});

const queryIntegerSchema = z.union([
  z.number().int(),
  z.string().regex(/^\d+$/).transform(Number),
]);
const queryRewardSchema = z.union([
  z.number().refine(
    (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
    "Reward must have at most two decimal places",
  ),
  z.string().regex(/^\d+(?:\.\d{1,2})?$/).transform(Number),
]).pipe(z.number().min(0).max(700_000));
const queryDateTimeSchema = z.string().datetime({ offset: true });

/** Query parameters accepted by GET /api/v2/quests. */
export const questBoardQuerySchema = z.object({
  q: z.string().max(200).optional(),
  tagId: z.string().min(1).optional(),
  mode: questBoardModeSchema.optional(),
  participation: questBoardParticipationSchema.optional(),
  maxDurationMinutes: queryIntegerSchema.pipe(positiveIntegerSchema).optional(),
  minQuestReward: queryRewardSchema.optional(),
  maxQuestReward: queryRewardSchema.optional(),
  startFrom: queryDateTimeSchema.optional(),
  startTo: queryDateTimeSchema.optional(),
  limit: queryIntegerSchema.pipe(z.number().int().min(1).max(50)).optional(),
  cursor: z.string().optional(),
}).strict();

export type QuestBoardMode = z.infer<typeof questBoardModeSchema>;
export type QuestBoardParticipation = z.infer<
  typeof questBoardParticipationSchema
>;
export type QuestBoardStatus = z.infer<typeof questBoardStatusSchema>;
export type QuestBoardTag = z.infer<typeof questBoardTagSchema>;
export type QuestBoardLocation = z.infer<typeof questBoardLocationSchema>;
export type QuestBoardImage = z.infer<typeof questBoardImageSchema>;
export type QuestBoardCard = z.infer<typeof questBoardCardSchema>;
export type QuestBoardCursor = z.infer<typeof questBoardCursorSchema>;
export type QuestBoardResponse = z.infer<typeof questBoardResponseSchema>;
export type QuestBoardDetail = z.infer<typeof questBoardDetailSchema>;
export type QuestBoardDetailResponse = z.infer<
  typeof questBoardDetailResponseSchema
>;
export type QuestBoardQuery = z.infer<typeof questBoardQuerySchema>;

export const questApiV2BoardCardSchema = questBoardCardSchema;
export const questApiV2BoardResponseSchema = questBoardResponseSchema;
export const questApiV2BoardDetailSchema = questBoardDetailSchema;
export const questApiV2BoardDetailResponseSchema =
  questBoardDetailResponseSchema;
export const questApiV2BoardQuerySchema = questBoardQuerySchema;

export type QuestApiV2BoardCard = QuestBoardCard;
export type QuestApiV2BoardResponse = QuestBoardResponse;
export type QuestApiV2BoardDetail = QuestBoardDetail;
export type QuestApiV2BoardDetailResponse = QuestBoardDetailResponse;
export type QuestApiV2BoardQuery = QuestBoardQuery;
