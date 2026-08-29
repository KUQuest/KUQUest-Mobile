import { z } from 'zod';

/** Contract version for the Quest resources exposed by the backend. */
export const QUEST_API_VERSION = 'v1' as const;

/** Quest IDs are UUIDs on the wire; keep them opaque to the mobile client. */
export const questApiV1IdSchema = z.string().min(1);
export const questApiV1DateTimeSchema = z.string().datetime({ offset: true });
export const questApiV1UriSchema = z.string().url();

function integerLikeSchema(minimum: number, maximum?: number) {
  const bounded = maximum === undefined
    ? z.number().int().min(minimum).refine(Number.isSafeInteger, 'Expected a safe integer')
    : z.number().int().min(minimum).max(maximum).refine(Number.isSafeInteger, 'Expected a safe integer');
  return z.union([
    z.number().int(),
    z.string().regex(/^-?\d+$/, 'Expected an integer').transform(Number),
  ]).pipe(bounded);
}

const nonBlank = (maximum: number) => z.string().min(1).max(maximum).regex(/\S/);
const nullableOptional = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

export const questApiV1RewardSchema = integerLikeSchema(1, 700_000);
export const questApiV1NonNegativeIntegerSchema = integerLikeSchema(0);
export const questApiV1HeadcountSchema = integerLikeSchema(1, 20);
export const questApiV1DurationSchema = integerLikeSchema(1);
export const questApiV1PositionSchema = integerLikeSchema(0);

export const questApiV1ModeSchema = z.enum(['NO_CANDIDATE', 'CANDIDATE']);
export const questApiV1ParticipationSchema = z.enum(['SOLO', 'GROUP']);
export const questApiV1QuestStatusSchema = z.enum([
  'QUEST_DRAFT',
  'QUEST_OPEN',
  'QUEST_AWAITING_CONSENT',
  'QUEST_ASSIGNED',
  'QUEST_IN_PROGRESS',
  'QUEST_SUBMITTED',
  'QUEST_APPROVED',
  'QUEST_REWORK',
  'QUEST_COMPLETED',
  'QUEST_CANCELLED',
  'QUEST_DISPUTED',
  'QUEST_HIDDEN',
]);
export const questApiV1ApplicationStatusSchema = z.enum([
  'APPLICATION_APPLIED',
  'APPLICATION_SELECTED',
  'APPLICATION_REJECTED',
  'APPLICATION_WITHDRAWN',
]);
export const questApiV1AssignmentStatusSchema = z.enum([
  'ASSIGNMENT_ACTIVE',
  'ASSIGNMENT_COMPLETED',
  'ASSIGNMENT_INCOMPLETE',
  'ASSIGNMENT_CANCELLED',
]);
export const questApiV1TeamStatusSchema = z.enum([
  'TEAM_FORMING',
  'TEAM_SUBMITTED',
  'TEAM_SELECTED',
  'TEAM_REJECTED',
  'TEAM_DISBANDED',
]);
export const questApiV1InvitationStatusSchema = z.enum([
  'INVITATION_PENDING',
  'INVITATION_ACCEPTED',
  'INVITATION_DECLINED',
  'INVITATION_EXPIRED',
  'INVITATION_REVOKED',
]);
export const questApiV1ProofStatusSchema = z.enum([
  'PROOF_PENDING',
  'PROOF_APPROVED',
  'PROOF_REJECTED',
  'PROOF_AUTO_APPROVED',
]);
export const questApiV1ProofReviewStatusSchema = z.enum(['PROOF_APPROVED', 'PROOF_REJECTED']);
export const questApiV1EditResponseDecisionSchema = z.enum([
  'EDIT_RESPONSE_APPROVED',
  'EDIT_RESPONSE_REJECTED',
]);

export const questApiV1TagSchema = z.object({
  id: questApiV1IdSchema,
  name: z.string(),
}).passthrough();

export const questApiV1LocationSchema = z.object({
  label: z.string().nullable(),
}).passthrough();

/** The API permits an omitted label in create/edit location objects. */
export const questApiV1LocationInputSchema = z.object({
  label: nullableOptional(z.string().max(100).regex(/\S/)),
}).strict();

export const questApiV1ImageSchema = z.object({
  fileId: questApiV1IdSchema,
  position: questApiV1PositionSchema,
  url: questApiV1UriSchema,
}).passthrough();

export const questApiV1QuestBoardItemSchema = z.object({
  id: questApiV1IdSchema,
  title: z.string(),
  reward: questApiV1RewardSchema,
  tag: z.union([questApiV1TagSchema, z.null()]),
  mode: questApiV1ModeSchema,
  participation: questApiV1ParticipationSchema,
  headcount: questApiV1HeadcountSchema,
  startTime: questApiV1DateTimeSchema,
  estimatedDurationMinutes: z.union([questApiV1DurationSchema, z.null()]),
  hirerName: z.string(),
  location: z.union([questApiV1LocationSchema, z.null()]),
}).passthrough();

export const questApiV1QuestMineItemSchema = questApiV1QuestBoardItemSchema.extend({
  questStatus: questApiV1QuestStatusSchema,
});

export const questApiV1QuestDetailSchema = z.object({
  id: questApiV1IdSchema,
  title: z.string(),
  description: z.string().nullable(),
  condition: z.string(),
  reward: questApiV1RewardSchema,
  tag: z.union([questApiV1TagSchema, z.null()]),
  mode: questApiV1ModeSchema,
  participation: questApiV1ParticipationSchema,
  questStatus: questApiV1QuestStatusSchema,
  headcount: questApiV1HeadcountSchema,
  startTime: questApiV1DateTimeSchema,
  dueAt: z.union([questApiV1DateTimeSchema, z.null()]),
  estimatedDurationMinutes: z.union([questApiV1DurationSchema, z.null()]),
  proofRequired: z.boolean(),
  hirerName: z.string(),
  locations: z.array(questApiV1LocationSchema),
  images: z.array(questApiV1ImageSchema),
}).passthrough();

export const questApiV1ReasonSchema = z.object({
  code: z.string(),
  message: z.string(),
}).passthrough();

export const questApiV1PublishCheckSchema = z.object({
  blockingReasons: z.array(questApiV1ReasonSchema),
  warnings: z.array(questApiV1ReasonSchema),
  escrowRequirement: questApiV1NonNegativeIntegerSchema,
  canPublish: z.boolean(),
}).passthrough();

export const questApiV1ApplicationSchema = z.object({
  id: questApiV1IdSchema,
  questId: questApiV1IdSchema,
  workerId: questApiV1IdSchema,
  applicationStatus: questApiV1ApplicationStatusSchema,
  reworkLimit: questApiV1NonNegativeIntegerSchema,
  appliedAt: questApiV1DateTimeSchema,
}).passthrough();

export const questApiV1AssignmentSchema = z.object({
  id: questApiV1IdSchema,
  questId: questApiV1IdSchema,
  workerId: questApiV1IdSchema,
  assignmentStatus: questApiV1AssignmentStatusSchema,
  startedAt: z.union([questApiV1DateTimeSchema, z.null()]),
  createdAt: questApiV1DateTimeSchema,
}).passthrough();

export const questApiV1TeamMemberSchema = z.object({
  userId: questApiV1IdSchema,
  joinedAt: questApiV1DateTimeSchema,
}).passthrough();

export const questApiV1TeamSchema = z.object({
  id: questApiV1IdSchema,
  questId: questApiV1IdSchema,
  leaderId: questApiV1IdSchema,
  name: z.string(),
  teamStatus: questApiV1TeamStatusSchema,
  reworkLimit: questApiV1NonNegativeIntegerSchema,
  createdAt: questApiV1DateTimeSchema,
  members: z.array(questApiV1TeamMemberSchema),
}).passthrough();

export const questApiV1InvitationSchema = z.object({
  id: questApiV1IdSchema,
  teamId: questApiV1IdSchema,
  invitedUserId: questApiV1IdSchema,
  invitedByUserId: questApiV1IdSchema,
  invitationStatus: questApiV1InvitationStatusSchema,
  createdAt: questApiV1DateTimeSchema,
  respondedAt: z.union([questApiV1DateTimeSchema, z.null()]),
  expiresAt: questApiV1DateTimeSchema,
}).passthrough();

export const questApiV1ProofSchema = z.object({
  id: questApiV1IdSchema,
  questId: questApiV1IdSchema,
  workerId: z.union([questApiV1IdSchema, z.null()]),
  teamId: z.union([questApiV1IdSchema, z.null()]),
  submittedByUserId: questApiV1IdSchema,
  content: z.string(),
  submissionStatus: questApiV1ProofStatusSchema,
  reviewNote: z.union([z.string(), z.null()]),
  submittedAt: questApiV1DateTimeSchema,
  reviewedAt: z.union([questApiV1DateTimeSchema, z.null()]),
  images: z.array(questApiV1IdSchema),
}).passthrough();

export const questApiV1EditResponseSchema = z.object({
  userId: questApiV1IdSchema,
  decision: z.union([z.string(), z.null()]),
  respondedAt: z.union([questApiV1DateTimeSchema, z.null()]),
}).passthrough();

export const questApiV1EditRequestSchema = z.object({
  id: questApiV1IdSchema,
  questId: questApiV1IdSchema,
  requestedByUserId: questApiV1IdSchema,
  status: z.string().min(1),
  previousQuestStatus: questApiV1QuestStatusSchema,
  createdAt: questApiV1DateTimeSchema,
  expiresAt: questApiV1DateTimeSchema,
  proposedChanges: z.record(z.unknown()),
  responses: z.array(questApiV1EditResponseSchema),
}).passthrough();

export const questApiV1CreateQuestRequestSchema = z.object({
  title: nonBlank(120),
  description: nullableOptional(nonBlank(1000)),
  condition: nonBlank(1000),
  mode: questApiV1ModeSchema,
  participation: questApiV1ParticipationSchema,
  reward: questApiV1RewardSchema,
  headcount: questApiV1HeadcountSchema,
  startTime: questApiV1DateTimeSchema,
  dueAt: nullableOptional(questApiV1DateTimeSchema),
  tagId: nullableOptional(questApiV1IdSchema),
  proofRequired: z.boolean().optional(),
  locations: z.array(questApiV1LocationInputSchema).max(10).optional(),
}).strict();

export const questApiV1EditQuestRequestSchema = z.object({
  title: nonBlank(120).optional(),
  description: nullableOptional(nonBlank(1000)),
  condition: nonBlank(1000).optional(),
  startTime: questApiV1DateTimeSchema.optional(),
  dueAt: nullableOptional(questApiV1DateTimeSchema),
  proofRequired: z.boolean().optional(),
  locations: z.array(questApiV1LocationInputSchema).max(10).optional(),
}).strict();

export const questApiV1CreateApplicationRequestSchema = z.object({
  reworkLimit: questApiV1NonNegativeIntegerSchema.optional(),
}).strict();

export const questApiV1CreateTeamRequestSchema = z.object({
  name: nonBlank(100),
  reworkLimit: questApiV1NonNegativeIntegerSchema.optional(),
}).strict();

export const questApiV1UpdateTeamRequestSchema = z.object({
  name: nonBlank(100).optional(),
  reworkLimit: questApiV1NonNegativeIntegerSchema.optional(),
}).strict();

export const questApiV1CreateInvitationRequestSchema = z.object({
  invitedUserId: questApiV1IdSchema,
}).strict();

export const questApiV1SubmitProofJsonRequestSchema = z.object({
  content: nonBlank(5000),
  fileIds: z.array(questApiV1IdSchema).max(3).optional(),
  imageIds: z.array(questApiV1IdSchema).max(3).optional(),
}).strict();

export const questApiV1ReviewProofRequestSchema = z.object({
  status: questApiV1ProofReviewStatusSchema,
  reviewNote: z.union([z.string().max(1000), z.null()]).optional(),
}).strict();

export const questApiV1ConfirmWorkRequestSchema = z.object({}).strict();

export const questApiV1CreateEditRequestSchema = z.object({
  title: nonBlank(120).optional(),
  description: nullableOptional(nonBlank(1000)),
  condition: nonBlank(1000).optional(),
  startTime: questApiV1DateTimeSchema.optional(),
  dueAt: nullableOptional(questApiV1DateTimeSchema),
  proofRequired: z.boolean().optional(),
  locations: z.array(questApiV1LocationInputSchema).max(10).optional(),
  images: z.array(questApiV1IdSchema).max(3).optional(),
  mode: questApiV1ModeSchema.optional(),
  participation: questApiV1ParticipationSchema.optional(),
  reward: questApiV1RewardSchema.optional(),
  headcount: questApiV1HeadcountSchema.optional(),
  tagId: nullableOptional(questApiV1IdSchema),
}).strict();

export const questApiV1RespondEditRequestSchema = z.object({
  decision: questApiV1EditResponseDecisionSchema,
}).strict();

export const questApiV1BoardQuerySchema = z.object({
  q: z.string().max(200).optional(),
  tagId: questApiV1IdSchema.optional(),
  mode: questApiV1ModeSchema.optional(),
  participation: questApiV1ParticipationSchema.optional(),
  maxDurationMinutes: questApiV1DurationSchema.optional(),
  minReward: questApiV1RewardSchema.optional(),
  maxReward: questApiV1RewardSchema.optional(),
  startFrom: questApiV1DateTimeSchema.optional(),
  startTo: questApiV1DateTimeSchema.optional(),
  limit: integerLikeSchema(1, 50).optional(),
  cursor: z.string().optional(),
}).strict();

export const questApiV1MineQuerySchema = z.object({
  limit: integerLikeSchema(1, 50).optional(),
  cursor: z.string().optional(),
}).strict();

const successEnvelope = <T extends z.ZodTypeAny>(data: T) => z.object({
  success: z.literal(true),
  data,
}).passthrough();

export const questApiV1SuccessResponseSchema = z.object({ success: z.literal(true) }).passthrough();
export const questApiV1ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string() }).passthrough(),
}).passthrough();

export const questApiV1CreateQuestResponseSchema = successEnvelope(z.object({ id: questApiV1IdSchema }).passthrough());
export const questApiV1QuestBoardResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1QuestBoardItemSchema),
  nextCursor: z.union([z.string(), z.null()]),
}).passthrough());
export const questApiV1QuestMineResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1QuestMineItemSchema),
  nextCursor: z.union([z.string(), z.null()]),
}).passthrough());
export const questApiV1QuestDetailResponseSchema = successEnvelope(questApiV1QuestDetailSchema);
export const questApiV1PublishCheckResponseSchema = successEnvelope(questApiV1PublishCheckSchema);
export const questApiV1ApplicationResponseSchema = successEnvelope(questApiV1ApplicationSchema);
export const questApiV1ApplicationsResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1ApplicationSchema),
}).passthrough());
export const questApiV1SelectionResponseSchema = successEnvelope(z.object({
  assignments: z.array(questApiV1AssignmentSchema),
  questStatus: questApiV1QuestStatusSchema,
}).passthrough());
export const questApiV1TeamResponseSchema = successEnvelope(questApiV1TeamSchema);
export const questApiV1TeamsResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1TeamSchema),
}).passthrough());
export const questApiV1TeamMembersResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1TeamMemberSchema),
}).passthrough());
export const questApiV1InvitationResponseSchema = successEnvelope(questApiV1InvitationSchema);
export const questApiV1InvitationsResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1InvitationSchema),
}).passthrough());
export const questApiV1ProofResponseSchema = successEnvelope(questApiV1ProofSchema);
export const questApiV1ProofsResponseSchema = successEnvelope(z.object({
  items: z.array(questApiV1ProofSchema),
}).passthrough());
export const questApiV1ConfirmWorkResponseSchema = successEnvelope(z.object({
  confirmed: z.boolean(),
  questStatus: z.string(),
}).passthrough());
export const questApiV1ReviewProofResponseSchema = successEnvelope(z.object({
  proof: questApiV1ProofSchema,
  questStatus: z.string(),
}).passthrough());
export const questApiV1CreateEditRequestResponseSchema = successEnvelope(z.object({
  status: z.string(),
  requestId: questApiV1IdSchema,
  expiresAt: questApiV1DateTimeSchema,
}).passthrough());
export const questApiV1EditRequestResponseSchema = successEnvelope(questApiV1EditRequestSchema);
export const questApiV1RespondEditRequestResponseSchema = successEnvelope(z.object({
  status: z.string(),
  requestId: questApiV1IdSchema,
}).passthrough());
export const questApiV1CancelResponseSchema = successEnvelope(z.object({
  questStatus: z.literal('QUEST_CANCELLED'),
  outcome: z.literal('CANCELLED'),
  paidSatang: questApiV1NonNegativeIntegerSchema,
  refundedSatang: questApiV1NonNegativeIntegerSchema,
}).passthrough());

export type QuestApiV1Id = z.infer<typeof questApiV1IdSchema>;
export type QuestApiV1DateTime = z.infer<typeof questApiV1DateTimeSchema>;
export type QuestApiV1Mode = z.infer<typeof questApiV1ModeSchema>;
export type QuestApiV1Participation = z.infer<typeof questApiV1ParticipationSchema>;
export type QuestApiV1QuestStatus = z.infer<typeof questApiV1QuestStatusSchema>;
export type QuestApiV1ApplicationStatus = z.infer<typeof questApiV1ApplicationStatusSchema>;
export type QuestApiV1AssignmentStatus = z.infer<typeof questApiV1AssignmentStatusSchema>;
export type QuestApiV1TeamStatus = z.infer<typeof questApiV1TeamStatusSchema>;
export type QuestApiV1InvitationStatus = z.infer<typeof questApiV1InvitationStatusSchema>;
export type QuestApiV1ProofStatus = z.infer<typeof questApiV1ProofStatusSchema>;
export type QuestApiV1QuestBoardItem = z.infer<typeof questApiV1QuestBoardItemSchema>;
export type QuestApiV1QuestMineItem = z.infer<typeof questApiV1QuestMineItemSchema>;
export type QuestApiV1QuestDetail = z.infer<typeof questApiV1QuestDetailSchema>;
export type QuestApiV1PublishCheck = z.infer<typeof questApiV1PublishCheckSchema>;
export type QuestApiV1Application = z.infer<typeof questApiV1ApplicationSchema>;
export type QuestApiV1Assignment = z.infer<typeof questApiV1AssignmentSchema>;
export type QuestApiV1TeamMember = z.infer<typeof questApiV1TeamMemberSchema>;
export type QuestApiV1Team = z.infer<typeof questApiV1TeamSchema>;
export type QuestApiV1Invitation = z.infer<typeof questApiV1InvitationSchema>;
export type QuestApiV1Proof = z.infer<typeof questApiV1ProofSchema>;
export type QuestApiV1EditRequest = z.infer<typeof questApiV1EditRequestSchema>;
export type QuestApiV1CreateQuestInput = z.infer<typeof questApiV1CreateQuestRequestSchema>;
export type QuestApiV1EditQuestInput = z.infer<typeof questApiV1EditQuestRequestSchema>;
export type QuestApiV1CreateApplicationInput = z.infer<typeof questApiV1CreateApplicationRequestSchema>;
export type QuestApiV1CreateTeamInput = z.infer<typeof questApiV1CreateTeamRequestSchema>;
export type QuestApiV1UpdateTeamInput = z.infer<typeof questApiV1UpdateTeamRequestSchema>;
export type QuestApiV1CreateInvitationInput = z.infer<typeof questApiV1CreateInvitationRequestSchema>;
export type QuestApiV1SubmitProofJsonInput = z.infer<typeof questApiV1SubmitProofJsonRequestSchema>;
export type QuestApiV1ReviewProofInput = z.infer<typeof questApiV1ReviewProofRequestSchema>;
export type QuestApiV1CreateEditRequestInput = z.infer<typeof questApiV1CreateEditRequestSchema>;
export type QuestApiV1RespondEditRequestInput = z.infer<typeof questApiV1RespondEditRequestSchema>;
export type QuestApiV1BoardQuery = z.infer<typeof questApiV1BoardQuerySchema>;
export type QuestApiV1MineQuery = z.infer<typeof questApiV1MineQuerySchema>;

// Short names are useful to feature code while the explicit names document
// the API version for consumers that keep generated contracts side by side.
export const questBoardResponseSchema = questApiV1QuestBoardResponseSchema;
export const questMineResponseSchema = questApiV1QuestMineResponseSchema;
export const questDetailResponseSchema = questApiV1QuestDetailResponseSchema;
export const questCreateRequestSchema = questApiV1CreateQuestRequestSchema;
export const questCreateResponseSchema = questApiV1CreateQuestResponseSchema;
export const questPublishCheckResponseSchema = questApiV1PublishCheckResponseSchema;
export const questApplicationSchema = questApiV1ApplicationSchema;
export const questApplicationResponseSchema = questApiV1ApplicationResponseSchema;
export const questApplicationsResponseSchema = questApiV1ApplicationsResponseSchema;
export const questTeamSchema = questApiV1TeamSchema;
export const questTeamResponseSchema = questApiV1TeamResponseSchema;
export const questTeamsResponseSchema = questApiV1TeamsResponseSchema;
export const questTeamMembersResponseSchema = questApiV1TeamMembersResponseSchema;
export const questInvitationSchema = questApiV1InvitationSchema;
export const questInvitationResponseSchema = questApiV1InvitationResponseSchema;
export const questInvitationsResponseSchema = questApiV1InvitationsResponseSchema;
export const questProofSchema = questApiV1ProofSchema;
export const questProofResponseSchema = questApiV1ProofResponseSchema;
export const questProofsResponseSchema = questApiV1ProofsResponseSchema;
export const questEditRequestSchema = questApiV1EditRequestSchema;
export const questEditRequestResponseSchema = questApiV1EditRequestResponseSchema;
