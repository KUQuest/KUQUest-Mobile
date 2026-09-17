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
  "ASSIGNMENT_CANCELLED",
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
  dueAt: z.string().nullable(),
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

export const questV2OwnerImageSchema = z.object({
  imageId: questV2IdSchema,
  fileId: questV2IdSchema,
  position: z.number().int().nonnegative(),
  url: z.string(),
  urlExpiresAt: z.string(),
});
export type QuestV2OwnerImage = z.infer<typeof questV2OwnerImageSchema>;
export type QuestV2Image = QuestV2OwnerImage;

export const questV2PublicImageSchema = z.object({
  imageId: questV2IdSchema,
  fileId: z.string().optional(),
  position: z.number().int().nonnegative(),
  url: z.string(),
  urlExpiresAt: z.string(),
});
export type QuestV2PublicImage = z.infer<typeof questV2PublicImageSchema>;

export const questV2ImageSchema = questV2OwnerImageSchema;
export const questV2CanonicalQuestSchema = z.object({
  id: questV2IdSchema,
  version: z.number().int().min(1),
  hiddenAt: z.string().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  condition: z.object({
    items: z.array(questV2ConditionItemSchema),
  }),
  tag: questV2TagSchema.nullable(),
  mode: questV2ModeSchema,
  participation: questV2ParticipationSchema,
  state: questV2StateSchema,
  questFundingTotal: z.number().nonnegative(),
  headcount: z.number().int().min(1),
  startTime: z.string(),
  dueAt: z.string().nullable(),
  proofRequired: z.boolean(),
  locations: z.array(questV2LocationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type QuestV2CanonicalQuest = z.infer<typeof questV2CanonicalQuestSchema>;

export const questV2CanonicalQuestResponseSchema = z.object({
  success: z.literal(true),
  data: questV2CanonicalQuestSchema,
});

export const questV2DetailSchema = questV2CanonicalQuestSchema.extend({
  images: z.array(questV2ImageSchema),
});
export type QuestV2Detail = z.infer<typeof questV2DetailSchema>;

export const questV2DetailResponseSchema = z.object({
  success: z.literal(true),
  data: questV2DetailSchema,
});

export const questV2PublicDetailSchema = z.object({
  id: questV2IdSchema,
  title: z.string().min(1),
  description: z.string().nullable(),
  condition: z.object({
    items: z.array(questV2ConditionItemSchema),
  }),
  tag: questV2TagSchema.nullable(),
  mode: questV2ModeSchema,
  participation: questV2ParticipationSchema,
  state: questV2StateSchema,
  questReward: z.number().nonnegative(),
  headcount: z.number().int().min(1),
  activeWorkerCount: z.number().int().nonnegative(),
  startTime: z.string(),
  dueAt: z.string().nullable(),
  proofRequired: z.boolean(),
  hirerName: z.string(),
  locations: z.array(questV2LocationSchema),
  images: z.array(questV2PublicImageSchema),
  hasJoined: z.boolean().optional(),
  assignmentId: questV2IdSchema.nullable().optional(),
  assignmentStatus: questV2AssignmentStateSchema.nullable().optional(),
});
export type QuestV2PublicDetail = z.infer<typeof questV2PublicDetailSchema>;

export const questV2PublicDetailResponseSchema = z.object({
  success: z.literal(true),
  data: questV2PublicDetailSchema,
});

export const questV2ParticipationDetailSchema =
  questV2PublicDetailSchema.extend({
    assignment: z.object({
      status: questV2AssignmentStateSchema,
      startedAt: z.string().nullable(),
    }),
    capabilities: z.object({
      canViewOnly: z.boolean(),
    }),
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
    quest: questV2CanonicalQuestSchema,
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
  startedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type QuestV2Assignment = z.infer<typeof questV2AssignmentSchema>;

export const questV2AssignmentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(questV2AssignmentSchema),
  }),
});
export type QuestV2AssignmentsResponse = z.infer<
  typeof questV2AssignmentsResponseSchema
>;

export const questV2AssignmentsMineResponseSchema =
  questV2AssignmentsResponseSchema;
export type QuestV2AssignmentsMineResponse = QuestV2AssignmentsResponse;

export const questV2AssignmentResponseSchema = z.object({
  success: z.literal(true),
  data: questV2AssignmentSchema,
});
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
export const questV2ApplicationStateSchema = z.enum([
  "APPLICATION_APPLIED",
  "APPLICATION_SELECTED",
  "APPLICATION_REJECTED",
  "APPLICATION_WITHDRAWN",
]);
export type QuestV2ApplicationState = z.infer<
  typeof questV2ApplicationStateSchema
>;

export const questV2ApplicationSchema = z.object({
  id: questV2IdSchema,
  questId: questV2IdSchema,
  memberId: questV2IdSchema,
  state: questV2ApplicationStateSchema,
  appliedAt: z.string(),
});
export type QuestV2Application = z.infer<typeof questV2ApplicationSchema>;

export const questV2ApplicationListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ items: z.array(questV2ApplicationSchema) }),
});
export const questV2ApplicationResponseSchema = z.object({
  success: z.literal(true),
  data: questV2ApplicationSchema,
});
export const questV2ApplicationSelectionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    assignments: z.array(questV2AssignmentSchema),
    questState: questV2StateSchema,
  }),
});
export type QuestV2ApplicationSelection = z.infer<
  typeof questV2ApplicationSelectionResponseSchema
>["data"];

export const questV2TeamStateSchema = z.enum([
  "TEAM_FORMING",
  "TEAM_SUBMITTED",
  "TEAM_SELECTED",
  "TEAM_REJECTED",
  "TEAM_DISBANDED",
]);
export type QuestV2TeamState = z.infer<typeof questV2TeamStateSchema>;

export const questV2TeamMemberSchema = z.object({
  memberId: questV2IdSchema,
  joinedAt: z.string(),
});
export type QuestV2TeamMember = z.infer<typeof questV2TeamMemberSchema>;

export const questV2TeamSubmissionSchema = z.object({
  text: z.string(),
  fileIds: z.array(questV2IdSchema),
  submittedAt: z.string(),
});
export type QuestV2TeamSubmission = z.infer<typeof questV2TeamSubmissionSchema>;

export const questV2TeamSchema = z.object({
  id: questV2IdSchema,
  questId: questV2IdSchema,
  leaderId: questV2IdSchema,
  name: z.string(),
  headcount: z.number().int().min(2),
  state: questV2TeamStateSchema,
  joinCode: z.string().nullable(),
  joinCodeExpiresAt: z.string().nullable(),
  members: z.array(questV2TeamMemberSchema),
  submission: questV2TeamSubmissionSchema.nullable(),
  createdAt: z.string(),
});
export type QuestV2Team = z.infer<typeof questV2TeamSchema>;

export const questV2TeamListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ items: z.array(questV2TeamSchema) }),
});
export const questV2TeamResponseSchema = z.object({
  success: z.literal(true),
  data: questV2TeamSchema,
});
export const questV2TeamFileSchema = z.object({
  fileId: z.string().min(1),
  fileName: z.string().min(1),
  mediaType: z.string().optional(),
  sizeBytes: z.number().int().positive(),
  createdAt: z.string().optional(),
});
export type QuestV2TeamFile = z.infer<typeof questV2TeamFileSchema>;
export const questV2TeamFileResponseSchema = z.object({
  success: z.literal(true),
  data: questV2TeamFileSchema,
});
export const questV2TeamSelectionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    questState: questV2StateSchema,
    assignments: z.array(questV2AssignmentSchema),
  }),
});
export type QuestV2TeamSelection = z.infer<
  typeof questV2TeamSelectionResponseSchema
>["data"];

export const questV2UnderfilledStateSchema = z.enum([
  "UNDERFILLED_DECISION_PENDING",
  "UNDERFILLED_CONSENT_PENDING",
  "UNDERFILLED_COMPLETED",
  "UNDERFILLED_CANCELLED",
]);
export type QuestV2UnderfilledState = z.infer<
  typeof questV2UnderfilledStateSchema
>;

export const questV2UnderfilledDecisionStatusSchema = z.enum([
  "UNDERFILLED_DECISION_PENDING",
  "UNDERFILLED_DECISION_PROCEEDED",
  "UNDERFILLED_DECISION_CANCELLED",
]);
export const questV2UnderfilledConsentStatusSchema = z.enum([
  "UNDERFILLED_CONSENT_NOT_STARTED",
  "UNDERFILLED_CONSENT_PENDING",
  "UNDERFILLED_CONSENT_COMPLETED",
  "UNDERFILLED_CONSENT_CANCELLED",
]);
export const questV2UnderfilledDecisionSchema = z.object({
  status: questV2UnderfilledDecisionStatusSchema,
  value: z.enum(["PROCEED", "CANCEL"]).nullable(),
  expiresAt: z.string().nullable(),
});
export const questV2UnderfilledConsentSchema = z.object({
  status: questV2UnderfilledConsentStatusSchema,
  expiresAt: z.string().nullable(),
  totalCount: z.number().int().nonnegative(),
  acceptedCount: z.number().int().nonnegative(),
  declinedCount: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
});
export const questV2UnderfilledResponseItemSchema = z.object({
  workerId: questV2IdSchema,
  assignmentId: questV2IdSchema,
  decision: z.enum(["ACCEPT", "DECLINE"]).nullable(),
  questReward: z.number().nonnegative().nullable(),
  respondedAt: z.string().nullable(),
});
export const questV2UnderfilledOwnResponseSchema = z.object({
  workerId: questV2IdSchema.optional(),
  assignmentId: questV2IdSchema.optional(),
  decision: z.enum(["ACCEPT", "DECLINE"]).nullable(),
  questReward: z.number().nonnegative().nullable(),
  respondedAt: z.string().nullable(),
});
export type QuestV2UnderfilledOwnResponse = z.infer<
  typeof questV2UnderfilledOwnResponseSchema
>;

export const questV2UnderfilledSchema = z.object({
  id: questV2IdSchema,
  questId: questV2IdSchema,
  questState: questV2StateSchema,
  state: questV2UnderfilledStateSchema,
  activeWorkerCount: z.number().int().nonnegative(),
  headcount: z.number().int().min(1),
  workerRewardPool: z.number().nonnegative().nullable(),
  questReward: z.number().nonnegative().nullable(),
  dueAt: z.string().nullable(),
  decision: questV2UnderfilledDecisionSchema,
  consent: questV2UnderfilledConsentSchema,
  responses: z.array(questV2UnderfilledResponseItemSchema).optional(),
  ownResponse: questV2UnderfilledOwnResponseSchema.nullable().optional(),
});
export type QuestV2Underfilled = z.infer<typeof questV2UnderfilledSchema>;
export const questV2UnderfilledResponseSchema = z.object({
  success: z.literal(true),
  data: questV2UnderfilledSchema,
});

export const questV2EditRequestStatusSchema = z.enum([
  "EDIT_REQUEST_PENDING",
  "EDIT_REQUEST_APPLIED",
  "EDIT_REQUEST_FAILED",
]);
export const questV2EditRequestFailureCodeSchema = z
  .enum(["EDIT_REQUEST_DECLINED", "EDIT_REQUEST_TIMEOUT", "ACTIVE_WORKER_LEFT"])
  .nullable();
export const questV2EditResponseSchema = z.object({
  workerId: questV2IdSchema,
  decision: z
    .enum(["EDIT_RESPONSE_ACCEPTED", "EDIT_RESPONSE_DECLINED"])
    .nullable(),
  reason: z.string().nullable(),
  respondedAt: z.string().nullable(),
});
export const questV2EditWorkerResponseSchema = z.object({
  workerId: questV2IdSchema.optional(),
  decision: z
    .enum(["EDIT_RESPONSE_ACCEPTED", "EDIT_RESPONSE_DECLINED"])
    .nullable(),
  reason: z.string().nullable(),
  respondedAt: z.string().nullable(),
});
export type QuestV2EditWorkerResponse = z.infer<
  typeof questV2EditWorkerResponseSchema
>;
export const questV2EditRequestSchema = z.object({
  requestId: questV2IdSchema,
  questId: questV2IdSchema,
  status: questV2EditRequestStatusSchema,
  failureCode: questV2EditRequestFailureCodeSchema,
  createdAt: z.string(),
  expiresAt: z.string(),
  appliedAt: z.string().nullable(),
  failedAt: z.string().nullable(),
  previousCondition: z.object({ items: z.array(questV2ConditionItemSchema) }),
  proposedCondition: z.object({ items: z.array(questV2ConditionItemSchema) }),
  responseSummary: z.object({
    totalCount: z.number().int().nonnegative(),
    acceptedCount: z.number().int().nonnegative(),
    declinedCount: z.number().int().nonnegative(),
    pendingCount: z.number().int().nonnegative(),
  }),
  responses: z.array(questV2EditResponseSchema).optional(),
  ownResponse: questV2EditWorkerResponseSchema.nullable().optional(),
});
export type QuestV2EditRequest = z.infer<typeof questV2EditRequestSchema>;
export const questV2EditRequestResponseSchema = z.object({
  success: z.literal(true),
  data: questV2EditRequestSchema,
});

export const questV2ProofStatusSchema = z.enum([
  "PROOF_PENDING",
  "PROOF_APPROVED",
  "PROOF_NOT_APPROVED",
]);
export const questV2ProofFileStatusSchema = z.enum([
  "PROOF_FILE_READY",
  "PROOF_FILE_FAILED",
  "PROOF_FILE_PENDING",
]);
export const questV2ProofFileSchema = z.object({
  fileId: questV2IdSchema,
  contentType: z.string(),
  sizeBytes: z.number().int().positive().nullable(),
  position: z.number().int().nonnegative(),
  uploadStatus: questV2ProofFileStatusSchema,
  failureCode: z.string().nullable(),
});
export const questV2ProofSubmissionSchema = z.object({
  id: questV2IdSchema,
  questId: questV2IdSchema,
  workerId: questV2IdSchema.nullable(),
  teamId: questV2IdSchema.nullable(),
  submittedByUserId: questV2IdSchema,
  description: z.string().nullable(),
  status: questV2ProofStatusSchema.nullable(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  visibility: z.enum(["FULL", "SUMMARY"]),
  fileIds: z.array(questV2IdSchema),
  files: z.array(questV2ProofFileSchema),
});
export type QuestV2ProofSubmission = z.infer<
  typeof questV2ProofSubmissionSchema
>;
export const questV2ProofResponseSchema = z.object({
  success: z.literal(true),
  data: questV2ProofSubmissionSchema,
});
export const questV2ProofListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ items: z.array(questV2ProofSubmissionSchema) }),
});
export const questV2ProofDeleteResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    deleted: z.literal(true),
    proofSubmissionId: questV2IdSchema,
  }),
});
export type QuestV2ProofDelete = z.infer<
  typeof questV2ProofDeleteResponseSchema
>["data"];
export const questV2ProofReviewResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    proof: z.object({
      id: questV2IdSchema,
      status: questV2ProofStatusSchema,
    }),
    questStatus: questV2StateSchema,
  }),
});
export type QuestV2ProofReview = z.infer<
  typeof questV2ProofReviewResponseSchema
>["data"];
export const questV2CompletionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    confirmed: z.literal(true),
    confirmedAt: z.string(),
    questStatus: questV2StateSchema,
  }),
});
export type QuestV2Completion = z.infer<
  typeof questV2CompletionResponseSchema
>["data"];

export const questV2ReviewSchema = z.object({
  id: questV2IdSchema,
  questId: questV2IdSchema,
  reviewerId: questV2IdSchema,
  revieweeId: questV2IdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const questV2NonBlankString = (max: number) =>
  z
    .string()
    .refine((value) => value.trim().length > 0, "Expected a non-blank string")
    .refine(
      (value) => value.trim().length <= max,
      `Expected at most ${max} characters`
    );
const questV2OptionalDescriptionSchema = z
  .string()
  .refine((value) => value.length <= 1000, "Expected at most 1000 characters");
const questV2MoneySchema = z
  .number()
  .finite()
  .min(1)
  .max(700000)
  .refine(
    (value) => Number.isInteger(value * 100),
    "Expected at most two decimals"
  );
const questV2BangkokDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?\+07:00$/,
    "Expected an RFC3339 Bangkok (+07:00) date-time"
  );
const questV2ConditionInputSchema = z
  .object({
    items: z.array(questV2NonBlankString(255)).min(1),
  })
  .strict();
const questV2LocationInputSchema = z
  .object({
    label: questV2NonBlankString(100),
  })
  .strict();
const questV2QuestPayloadShape = {
  title: questV2NonBlankString(120),
  description: questV2OptionalDescriptionSchema.nullable().optional(),
  condition: questV2ConditionInputSchema,
  mode: questV2ModeSchema,
  participation: questV2ParticipationSchema,
  questFundingTotal: questV2MoneySchema,
  headcount: z.number().int().min(1).max(20),
  startTime: questV2BangkokDateTimeSchema,
  dueAt: questV2BangkokDateTimeSchema.nullable().optional(),
  tagId: questV2IdSchema.nullable().optional(),
  proofRequired: z.boolean().optional(),
  locations: z.array(questV2LocationInputSchema).max(10).optional(),
};
const questV2QuestPayloadRefinement = (
  value: {
    participation?: QuestV2Participation;
    headcount?: number;
    startTime?: string;
    dueAt?: string | null;
  },
  context: z.RefinementCtx
) => {
  if (
    value.participation === "SINGLE" &&
    value.headcount !== undefined &&
    value.headcount !== 1
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["headcount"],
      message: "SINGLE requires headcount 1",
    });
  }
  if (
    value.participation === "GROUP" &&
    value.headcount !== undefined &&
    value.headcount < 2
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["headcount"],
      message: "GROUP requires at least 2 participants",
    });
  }
  if (
    value.startTime !== undefined &&
    value.dueAt !== undefined &&
    value.dueAt !== null &&
    new Date(value.dueAt).getTime() <= new Date(value.startTime).getTime()
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dueAt"],
      message: "dueAt must be after startTime",
    });
  }
};
export const questV2CreatePayloadSchema = z
  .object(questV2QuestPayloadShape)
  .strict()
  .superRefine((value, context) =>
    questV2QuestPayloadRefinement(value, context)
  );
export const questV2EditPayloadSchema = z
  .object(questV2QuestPayloadShape)
  .partial()
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required"
  )
  .superRefine((value, context) =>
    questV2QuestPayloadRefinement(value, context)
  );
export const questV2EmptyBodySchema = z.object({}).strict();
export const questV2TeamCreatePayloadSchema = z
  .object({
    name: z
      .string()
      .refine(
        (value) => value.trim().length > 0,
        "Expected a non-blank team name"
      ),
    headcount: z.number().int().min(2),
  })
  .strict();
export const questV2TeamUpdatePayloadSchema = z
  .object({
    name: z
      .string()
      .refine(
        (value) => value.trim().length > 0,
        "Expected a non-blank team name"
      ),
  })
  .strict();
export const questV2TeamJoinPayloadSchema = z
  .object({ joinCode: questV2NonBlankString(8) })
  .strict();
export const questV2TeamSubmitPayloadSchema = z
  .object({
    text: z.string(),
    fileIds: z.array(questV2IdSchema),
  })
  .strict();
export const questV2UnderfilledDecisionPayloadSchema = z
  .object({ decision: z.enum(["PROCEED", "CANCEL"]) })
  .strict();
export const questV2UnderfilledConsentPayloadSchema = z
  .object({ decision: z.enum(["ACCEPT", "DECLINE"]) })
  .strict();
export const questV2EditRequestCreatePayloadSchema = z
  .object({ condition: questV2ConditionInputSchema })
  .strict();
export const questV2EditRequestRespondPayloadSchema = z
  .object({
    decision: z.enum(["EDIT_RESPONSE_ACCEPTED", "EDIT_RESPONSE_DECLINED"]),
    reason: questV2NonBlankString(255).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.decision === "EDIT_RESPONSE_ACCEPTED" &&
      value.reason !== undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Reason is only allowed for a decline",
      });
    }
  });
export const questV2ProofCreatePayloadSchema = z
  .object({
    description: questV2OptionalDescriptionSchema.optional(),
    fileIds: z.array(questV2IdSchema).min(1).optional(),
  })
  .strict()
  .refine(
    (value) =>
      (value.description !== undefined &&
        value.description.trim().length > 0) ||
      (value.fileIds !== undefined && value.fileIds.length > 0),
    "Description or at least one file is required"
  );
export const questV2ProofUpdatePayloadSchema = z
  .object({
    description: questV2OptionalDescriptionSchema.optional(),
    fileIds: z.array(questV2IdSchema).optional(),
  })
  .strict()
  .refine(
    (value) => value.description !== undefined || value.fileIds !== undefined,
    "At least one field is required"
  );
export const questV2ProofRetryPayloadSchema = z
  .object({
    description: questV2OptionalDescriptionSchema.optional(),
    retryPosition: z.number().int().nonnegative(),
  })
  .strict();
export const questV2ProofReviewPayloadSchema = z
  .object({
    decision: z.enum(["PROOF_APPROVED", "PROOF_NOT_APPROVED"]),
    reason: z
      .string()
      .refine((value) => value.trim().length > 0, "Expected a non-blank reason")
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.decision === "PROOF_NOT_APPROVED" && value.reason === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Reason is required when proof is not approved",
      });
    }
    if (value.decision === "PROOF_APPROVED" && value.reason !== undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Reason is not allowed when proof is approved",
      });
    }
  });
export const questV2ReviewCreatePayloadSchema = z
  .object({
    revieweeId: questV2IdSchema.optional(),
    rating: z.number().int().min(1).max(5),
    comment: questV2NonBlankString(1000).optional(),
  })
  .strict();
export const questV2ReviewUpdatePayloadSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: questV2NonBlankString(1000).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required"
  );
export type QuestV2Review = z.infer<typeof questV2ReviewSchema>;
export const questV2ReviewResponseSchema = z.object({
  success: z.literal(true),
  data: questV2ReviewSchema,
});
