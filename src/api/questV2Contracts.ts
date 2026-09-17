import { z } from "zod";

export const QUEST_V2_API_VERSION = "v2" as const;

export const questV2IdSchema = z.string().min(1);

export const questV2ModeSchema = z.enum([
  "FIRST_COME_FIRST_SERVED",
  "CANDIDATE",
]);
export type QuestV2Mode = z.infer<typeof questV2ModeSchema>;

export const questV2ParticipationSchema = z.enum(["SINGLE", "GROUP"]);
export type QuestV2Participation = z.infer<typeof questV2ParticipationSchema>;

export const questV2StateSchema = z.enum([
  "QUEST_DRAFT",
  "QUEST_OPEN",
  "QUEST_ASSIGNED",
  "QUEST_IN_PROGRESS",
  "QUEST_COMPLETED",
  "QUEST_CANCELLED",
  "QUEST_FAILED",
]);
export type QuestV2State = z.infer<typeof questV2StateSchema>;

export const questV2AssignmentStateSchema = z.enum([
  "ASSIGNMENT_ACTIVE",
  "ASSIGNMENT_COMPLETED",
  "ASSIGNMENT_INCOMPLETE",
]);
export type QuestV2AssignmentState = z.infer<
  typeof questV2AssignmentStateSchema
>;

export const questV2TagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type QuestV2Tag = z.infer<typeof questV2TagSchema>;

export const questV2LocationSchema = z.object({
  label: z.string().min(1),
});

export const questV2ConditionItemSchema = z.object({
  position: z.number().int().nonnegative(),
  text: z.string().min(1),
});

export const questV2BoardCardSchema = z.object({
  id: questV2IdSchema,
  title: z.string().min(1),
  questReward: z.number().nonnegative(),
  tag: questV2TagSchema.nullable(),
  mode: questV2ModeSchema,
  participation: questV2ParticipationSchema,
  headcount: z.number().int().min(1),
  activeWorkerCount: z.number().int().nonnegative(),
  startTime: z.string(),
  dueAt: z.string(),
  hirerName: z.string(),
  location: z.string().nullable(),
});
export type QuestV2BoardCard = z.infer<typeof questV2BoardCardSchema>;

export const questV2BoardResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(questV2BoardCardSchema),
    nextCursor: z.string().nullable(),
  }),
});
export type QuestV2BoardResponse = z.infer<typeof questV2BoardResponseSchema>;

export const questV2ImageSchema = z.object({
  imageId: questV2IdSchema,
  fileId: z.string().optional(),
  position: z.number().int().nonnegative(),
  url: z.string(),
  urlExpiresAt: z.string(),
});
export type QuestV2Image = z.infer<typeof questV2ImageSchema>;

export const questV2PublicImageSchema = questV2ImageSchema;
export type QuestV2PublicImage = QuestV2Image;

export const questV2CanonicalQuestSchema = z.object({
  id: questV2IdSchema,
  version: z.number().int().min(1),
  hiddenAt: z.string().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  condition: z.object({
    items: z.array(questV2ConditionItemSchema),
  }),
  tag: questV2TagSchema.nullable().optional(),
  mode: questV2ModeSchema,
  participation: questV2ParticipationSchema,
  state: questV2StateSchema,
  questFundingTotal: z.number().nonnegative(),
  headcount: z.number().int().min(1),
  startTime: z.string(),
  dueAt: z.string().nullable().optional(),
  proofRequired: z.boolean(),
  locations: z.array(questV2LocationSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type QuestV2CanonicalQuest = z.infer<typeof questV2CanonicalQuestSchema>;

export const questV2DetailSchema = questV2CanonicalQuestSchema.extend({
  images: z.array(questV2ImageSchema).default([]),
});
export type QuestV2Detail = z.infer<typeof questV2DetailSchema>;

export const questV2DetailResponseSchema = z.object({
  success: z.literal(true),
  data: questV2DetailSchema,
});

export const questV2PublicDetailSchema = z.object({
  id: questV2IdSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  condition: z.object({
    items: z.array(questV2ConditionItemSchema),
  }),
  tag: questV2TagSchema.nullable().optional(),
  mode: questV2ModeSchema,
  participation: questV2ParticipationSchema,
  state: questV2StateSchema,
  questReward: z.number().nonnegative(),
  headcount: z.number().int().min(1),
  activeWorkerCount: z.number().int().nonnegative().default(0),
  startTime: z.string(),
  dueAt: z.string().nullable().optional(),
  proofRequired: z.boolean(),
  hirerName: z.string(),
  locations: z.array(questV2LocationSchema).default([]),
  images: z.array(questV2PublicImageSchema).default([]),
});
export type QuestV2PublicDetail = z.infer<typeof questV2PublicDetailSchema>;

export const questV2PublicDetailResponseSchema = z.object({
  success: z.literal(true),
  data: questV2PublicDetailSchema,
});

export const questV2ParticipationDetailSchema =
  questV2PublicDetailSchema.extend({
    assignment: z
      .object({
        status: z.string(),
        startedAt: z.string().nullable().optional(),
      })
      .optional(),
    capabilities: z
      .object({
        canViewOnly: z.boolean(),
      })
      .optional(),
  });
export type QuestV2ParticipationDetail = z.infer<
  typeof questV2ParticipationDetailSchema
>;

export const questV2ParticipationDetailResponseSchema = z.object({
  success: z.literal(true),
  data: questV2ParticipationDetailSchema,
});

export const questV2ImagesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    images: z.array(questV2ImageSchema),
  }),
});
export type QuestV2ImagesResponse = z.infer<typeof questV2ImagesResponseSchema>;

export const questV2EscrowSchema = z.object({
  reservationId: z.string().min(1),
  questFundingTotal: z.number().nonnegative(),
  questFundingTotalSatang: z.number().int().nonnegative(),
  questReward: z.number().nonnegative(),
  questRewardSatang: z.number().int().nonnegative(),
  platformFee: z.number().nonnegative(),
  platformFeeSatang: z.number().int().nonnegative(),
  escrowRequirement: z.number().nonnegative(),
  escrowRequirementSatang: z.number().int().nonnegative(),
  headcount: z.number().int().min(1),
  platformFeeBps: z.number().int().nonnegative(),
  feeRoundingMode: z.literal("UP"),
  policyRevisionId: z.string().min(1),
  policyRevision: z.number().int().min(1),
});

export type QuestV2Escrow = z.infer<typeof questV2EscrowSchema>;

export const questV2PublishResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    quest: questV2DetailSchema,
    questEscrow: questV2EscrowSchema,
  }),
});

export const questV2MineResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(questV2CanonicalQuestSchema),
    nextCursor: z.string().nullable(),
  }),
});
export type QuestV2MineResponse = z.infer<typeof questV2MineResponseSchema>;

export const questV2AssignmentSchema = z.object({
  id: questV2IdSchema,
  questId: questV2IdSchema,
  workerId: questV2IdSchema,
  state: questV2AssignmentStateSchema,
  questState: questV2StateSchema,
  startedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type QuestV2Assignment = z.infer<typeof questV2AssignmentSchema>;

export const questV2AssignmentsMineResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(questV2AssignmentSchema),
  }),
});
export type QuestV2AssignmentsMineResponse = z.infer<
  typeof questV2AssignmentsMineResponseSchema
>;

export const questV2PublishCheckReasonSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const questV2PublishCheckSchema = z.object({
  questFundingTotalSatang: z.number().int().nonnegative(),
  questRewardSatang: z.number().int().nonnegative(),
  platformFeeSatang: z.number().int().nonnegative(),
  escrowRequirementSatang: z.number().int().nonnegative(),
  headcount: z.number().int().min(1),
  platformFeeBps: z.number().int().nonnegative(),
  feeRoundingMode: z.literal("UP"),
  policyRevisionId: z.string().min(1),
  policyRevision: z.number().int().min(1),
  blockingReasons: z.array(questV2PublishCheckReasonSchema),
  warnings: z.array(questV2PublishCheckReasonSchema),
  canPublish: z.boolean(),
  questFundingTotal: z.number().nonnegative(),
  questReward: z.number().nonnegative(),
  platformFee: z.number().nonnegative(),
  escrowRequirement: z.number().nonnegative(),
});
export type QuestV2PublishCheck = z.infer<typeof questV2PublishCheckSchema>;

export const questV2PublishCheckResponseSchema = z.object({
  success: z.literal(true),
  data: questV2PublishCheckSchema,
});

export const questV2CancellationOutcomeSchema = z.object({
  questStatus: z.literal("QUEST_CANCELLED"),
  outcome: z.literal("CANCELLED"),
  paidSatang: z.number().int().nonnegative(),
  refundedSatang: z.number().int().nonnegative(),
});
export type QuestV2CancellationOutcome = z.infer<
  typeof questV2CancellationOutcomeSchema
>;

export const questV2CancellationResponseSchema = z.object({
  success: z.literal(true),
  data: questV2CancellationOutcomeSchema,
});
