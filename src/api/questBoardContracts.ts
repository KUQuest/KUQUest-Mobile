import { z } from "zod";

/** Runtime contracts for the Backend v2 Quest Board transport boundary. */
export const QUEST_BOARD_API_VERSION = "v2" as const;

const questIdSchema = z.string().uuid();
const dateTimeSchema = z.string().datetime({ offset: true });
const positiveIntegerSchema = z.number().int().positive();

export const questBoardModeSchema = z.enum(["NO_CANDIDATE", "CANDIDATE"]);
export const questBoardParticipationSchema = z.enum(["SOLO", "GROUP"]);
export const questBoardStatusSchema = z.enum([
  "QUEST_DRAFT",
  "QUEST_OPEN",
  "QUEST_AWAITING_CONSENT",
  "QUEST_ASSIGNED",
  "QUEST_IN_PROGRESS",
  "QUEST_SUBMITTED",
  "QUEST_APPROVED",
  "QUEST_REWORK",
  "QUEST_COMPLETED",
  "QUEST_CANCELLED",
  "QUEST_DISPUTED",
  "QUEST_FAILED",
]);

export const questBoardTagSchema = z.object({
  id: questIdSchema,
  name: z.string(),
});

export const questBoardLocationSchema = z.object({
  label: z.string().nullable(),
});

export const questBoardImageSchema = z.object({
  fileId: questIdSchema,
  position: z.number().int().nonnegative(),
  url: z.string().url(),
});

/** The Quest Board card returned by GET /api/v2/quests. */
export const questBoardCardSchema = z.object({
  id: questIdSchema,
  title: z.string(),
  reward: positiveIntegerSchema,
  tag: questBoardTagSchema,
  mode: questBoardModeSchema,
  participation: questBoardParticipationSchema,
  headcount: positiveIntegerSchema,
  startTime: dateTimeSchema,
  estimatedDurationMinutes: positiveIntegerSchema.nullable(),
  hirerName: z.string(),
  location: questBoardLocationSchema.nullable(),
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
  condition: z.string(),
  reward: positiveIntegerSchema,
  tag: questBoardTagSchema.nullable(),
  mode: questBoardModeSchema,
  participation: questBoardParticipationSchema,
  questStatus: questBoardStatusSchema,
  hiddenAt: dateTimeSchema.nullable().optional(),
  headcount: positiveIntegerSchema,
  startTime: dateTimeSchema,
  dueAt: dateTimeSchema.nullable(),
  estimatedDurationMinutes: positiveIntegerSchema.nullable(),
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
const queryDateTimeSchema = z.string().datetime({ offset: true });

/** Query parameters accepted by GET /api/v2/quests. */
export const questBoardQuerySchema = z.object({
  q: z.string().max(200).optional(),
  tagId: questIdSchema.optional(),
  mode: questBoardModeSchema.optional(),
  participation: questBoardParticipationSchema.optional(),
  maxDurationMinutes: queryIntegerSchema.pipe(positiveIntegerSchema).optional(),
  minReward: queryIntegerSchema.pipe(z.number().int().min(1).max(700_000)).optional(),
  maxReward: queryIntegerSchema.pipe(z.number().int().min(1).max(700_000)).optional(),
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
