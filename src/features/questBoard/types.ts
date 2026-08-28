/* The contract exposes named values and matching string-union types. */
/* eslint-disable @typescript-eslint/no-redeclare */

export const MAX_QUEST_IMAGES = 3;
export const SATANG_PER_BAHT = 100;

/** Raw Quest lifecycle values returned by the Quest API. */
export const QuestStatus = {
  QUEST_DRAFT: 'QUEST_DRAFT',
  QUEST_OPEN: 'QUEST_OPEN',
  /** Legacy umbrella value. New adapter state never emits this value. */
  QUEST_AWAITING_CONSENT: 'QUEST_AWAITING_CONSENT',
  QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT: 'QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT',
  QUEST_AWAITING_EDIT_CONSENT: 'QUEST_AWAITING_EDIT_CONSENT',
  QUEST_ASSIGNED: 'QUEST_ASSIGNED',
  QUEST_IN_PROGRESS: 'QUEST_IN_PROGRESS',
  QUEST_SUBMITTED: 'QUEST_SUBMITTED',
  QUEST_APPROVED: 'QUEST_APPROVED',
  QUEST_REWORK: 'QUEST_REWORK',
  QUEST_COMPLETED: 'QUEST_COMPLETED',
  QUEST_CANCELLED: 'QUEST_CANCELLED',
  QUEST_DISPUTED: 'QUEST_DISPUTED',
  QUEST_HIDDEN: 'QUEST_HIDDEN',
} as const;
export type QuestStatus = typeof QuestStatus[keyof typeof QuestStatus];
export const QUEST_STATUS_VALUES = Object.values(QuestStatus);

export const QuestParticipation = {
  SINGLE: 'SINGLE',
  GROUP: 'GROUP',
} as const;
export type QuestParticipation = typeof QuestParticipation[keyof typeof QuestParticipation];

export const QuestCandidateMode = {
  NO_CANDIDATE: 'NO_CANDIDATE',
  CANDIDATE: 'CANDIDATE',
} as const;
export type CanonicalQuestCandidateMode = typeof QuestCandidateMode[keyof typeof QuestCandidateMode];
export type QuestCandidateMode = CanonicalQuestCandidateMode;

export const QuestTeamStatus = {
  TEAM_FORMING: 'TEAM_FORMING',
  TEAM_SUBMITTED: 'TEAM_SUBMITTED',
  TEAM_SELECTED: 'TEAM_SELECTED',
  TEAM_REJECTED: 'TEAM_REJECTED',
} as const;
export type QuestTeamStatus = typeof QuestTeamStatus[keyof typeof QuestTeamStatus];

export const QuestInvitationStatus = {
  INVITATION_PENDING: 'INVITATION_PENDING',
  INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
  INVITATION_DECLINED: 'INVITATION_DECLINED',
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  INVITATION_REVOKED: 'INVITATION_REVOKED',
} as const;
export type QuestInvitationStatus = typeof QuestInvitationStatus[keyof typeof QuestInvitationStatus];

export const QuestApplicationStatus = {
  APPLICATION_APPLIED: 'APPLICATION_APPLIED',
  APPLICATION_SELECTED: 'APPLICATION_SELECTED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
  APPLICATION_WITHDRAWN: 'APPLICATION_WITHDRAWN',
} as const;
export type QuestApplicationStatus = typeof QuestApplicationStatus[keyof typeof QuestApplicationStatus];

export const QuestAssignmentStatus = {
  ASSIGNMENT_ACTIVE: 'ASSIGNMENT_ACTIVE',
  ASSIGNMENT_COMPLETED: 'ASSIGNMENT_COMPLETED',
  ASSIGNMENT_INCOMPLETE: 'ASSIGNMENT_INCOMPLETE',
  ASSIGNMENT_CANCELLED: 'ASSIGNMENT_CANCELLED',
} as const;
export type QuestAssignmentStatus = typeof QuestAssignmentStatus[keyof typeof QuestAssignmentStatus];

export const QuestProofStatus = {
  PROOF_PENDING: 'PROOF_PENDING',
  PROOF_APPROVED: 'PROOF_APPROVED',
  PROOF_REJECTED: 'PROOF_REJECTED',
  PROOF_AUTO_APPROVED: 'PROOF_AUTO_APPROVED',
} as const;
export type QuestProofStatus = typeof QuestProofStatus[keyof typeof QuestProofStatus];

export const QuestEditRequestStatus = {
  EDIT_REQUEST_PENDING: 'EDIT_REQUEST_PENDING',
  EDIT_REQUEST_APPROVED: 'EDIT_REQUEST_APPROVED',
  EDIT_REQUEST_REJECTED: 'EDIT_REQUEST_REJECTED',
} as const;
export type QuestEditRequestStatus = typeof QuestEditRequestStatus[keyof typeof QuestEditRequestStatus];

export const QuestEditResponseStatus = {
  EDIT_RESPONSE_APPROVED: 'EDIT_RESPONSE_APPROVED',
  EDIT_RESPONSE_REJECTED: 'EDIT_RESPONSE_REJECTED',
} as const;
export type QuestEditResponseStatus = typeof QuestEditResponseStatus[keyof typeof QuestEditResponseStatus];

export type QuestLocationMode = 'online' | 'on-campus';
export type QuestParticipationMode = 'single' | 'team';
export type QuestBoardSort = 'newest' | 'deadline-soonest' | 'reward-highest';
export type QuestAvailability = 'available' | 'full' | 'closed';

export interface SatangReward {
  rewardSatang: number;
  currency: 'THB';
}

export interface QuestLocation {
  /** A human-readable label only. Coordinates and addresses are not part of the contract. */
  label: string | null;
}

export interface QuestReward extends SatangReward {
  /** Optional display helper; calculations must use rewardSatang. */
  perWorker?: number;
}

export interface QuestTeamMember {
  workerId: string;
  role: 'LEADER' | 'MEMBER';
  displayName?: string;
}

export interface QuestTeam {
  /** Stable proposal/team identity. A team has no user-editable name. */
  id: string;
  /** Set when the forming team is submitted as a Candidate Proposal. */
  proposalId?: string;
  questId: string;
  leaderId: string;
  status: QuestTeamStatus;
  members: QuestTeamMember[];
  requiredHeadcount: number;
  createdAt: string;
}

export interface QuestInvitation {
  id: string;
  questId: string;
  teamId: string;
  invitedWorkerId: string;
  status: QuestInvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface QuestApplication {
  /** Candidate Proposal identity; `id` remains the transport-compatible name. */
  id: string;
  proposalId?: string;
  questId: string;
  applicantId?: string;
  teamId?: string;
  status: QuestApplicationStatus;
  submittedAt: string;
  decidedAt?: string;
  note?: string;
}

export interface QuestAssignment {
  id: string;
  questId: string;
  workerId: string;
  source: 'DIRECT_JOIN' | 'APPLICATION' | 'TEAM';
  status: QuestAssignmentStatus;
  rewardSatang: number;
  joinedAt: string;
  startedAt?: string;
  completedAt?: string;
  applicationId?: string;
  teamId?: string;
}

export interface QuestProof {
  id: string;
  questId: string;
  ownerId: string;
  teamId?: string;
  status: QuestProofStatus;
  imageUris: string[];
  note?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewReason?: string;
  reworkCount: number;
  reworkLimit: number;
}

export interface QuestEditConsentResponse {
  workerId: string;
  status: QuestEditResponseStatus;
  respondedAt: string;
}

export const QuestPartialStartConsentStatus = {
  PARTIAL_START_PENDING: 'PARTIAL_START_PENDING',
  PARTIAL_START_APPROVED: 'PARTIAL_START_APPROVED',
  PARTIAL_START_REJECTED: 'PARTIAL_START_REJECTED',
  PARTIAL_START_TIMED_OUT: 'PARTIAL_START_TIMED_OUT',
} as const;
export type QuestPartialStartConsentStatus = typeof QuestPartialStartConsentStatus[keyof typeof QuestPartialStartConsentStatus];

export const QuestPartialStartVoteStatus = {
  PARTIAL_START_VOTE_APPROVED: 'PARTIAL_START_VOTE_APPROVED',
  PARTIAL_START_VOTE_REJECTED: 'PARTIAL_START_VOTE_REJECTED',
} as const;
export type QuestPartialStartVoteStatus = typeof QuestPartialStartVoteStatus[keyof typeof QuestPartialStartVoteStatus];

export interface QuestPartialStartConsentResponse {
  voterId: string;
  /** Compatibility alias for consumers that model every voter as a Worker. */
  workerId?: string;
  role: 'HIRER' | 'WORKER';
  status: QuestPartialStartVoteStatus;
  respondedAt: string;
}

export interface QuestPartialStartConsent {
  id: string;
  questId: string;
  status: QuestPartialStartConsentStatus;
  requestedAt: string;
  responseDeadlineAt: string;
  requiredVoterIds: string[];
  requiredVoterCount?: number;
  frozenWorkerIds: string[];
  approvedVoterCount: number;
  /** Compatibility alias for the edit-consent count naming. */
  approvedCount?: number;
  responses: QuestPartialStartConsentResponse[];
}

export interface QuestEditConsent {
  id: string;
  questId: string;
  previousStatus: QuestStatus;
  status: QuestEditRequestStatus;
  requestedChanges: Partial<Pick<QuestContract, 'description' | 'completionCriteria' | 'startAt' | 'endAt' | 'deadlineAt' | 'location' | 'imageUris'>>;
  requestedAt: string;
  responseDeadlineAt: string;
  requiredWorkerCount: number;
  approvedWorkerCount: number;
  responses: QuestEditConsentResponse[];
}

export type ConversationReadOnlyReason = 'TERMINAL' | 'INACTIVE_WORKER' | 'NOT_A_MEMBER' | 'NOT_STARTED';

export interface WorkConversationCapability {
  conversationId: string | null;
  canRead: boolean;
  canWrite: boolean;
  readOnly: boolean;
  readOnlyReason?: ConversationReadOnlyReason;
}

export type QuestAction =
  | 'DIRECT_JOIN'
  | 'APPLY'
  | 'WITHDRAW_APPLICATION'
  | 'CREATE_TEAM'
  | 'INVITE_WORKER'
  | 'RESPOND_INVITATION'
  | 'SUBMIT_TEAM'
  | 'SELECT_CANDIDATE'
  | 'REJECT_CANDIDATE'
  | 'REJECT_TEAM'
  | 'REQUEST_EDIT'
  | 'VOTE_EDIT_CONSENT'
  | 'VOTE_PARTIAL_GROUP_START_CONSENT'
  | 'SUBMIT_PROOF'
  | 'REWORK_PROOF'
  | 'REVIEW_PROOF'
  | 'OPEN_DISPUTE'
  | 'RESOLVE_DISPUTE'
  | 'CONFIRM_COMPLETION'
  | 'COMPLETE'
  | 'CANCEL'
  | 'PUBLISH';

export interface QuestCapabilities {
  availableActions: QuestAction[];
  canReadConversation: boolean;
  canWriteConversation: boolean;
}

export interface QuestEditConsentCapabilities {
  canRespond: boolean;
  hasResponded: boolean;
  approvedWorkerCount: number;
  requiredWorkerCount: number;
  responseDeadlineAt: string;
}

export interface QuestPartialStartConsentCapabilities {
  canRespond: boolean;
  hasResponded: boolean;
  approvedVoterCount: number;
  requiredVoterCount: number;
  responseDeadlineAt: string;
}

export type WorkConversationCapabilities = WorkConversationCapability;
export type QuestRewardSatang = SatangReward;
export type QuestLocationLabel = QuestLocation;

export interface QuestEscrowSummary {
  rewardPoolSatang: number;
  platformFeeSatang: number;
  totalRequiredSatang: number;
  headcount: number;
  rewardSatangPerWorker: number;
  platformFeeSatangPerWorker: number;
  feeRateBasisPoints: number;
}

export interface QuestPublishCheck {
  canPublish: boolean;
  blockers: string[];
  warnings: string[];
  escrow: QuestEscrowSummary;
}

export interface QuestSettlementSummary {
  requestedHeadcount: number;
  actualHeadcount: number;
  rewardSatangPerWorker: number;
  reservedRewardSatang: number;
  settledRewardSatang: number;
  refundSatang: number;
  fullRefund: boolean;
}

export interface QuestContract {
  id: string;
  status: QuestStatus;
  title: string;
  description: string;
  completionCriteria: string;
  proofRequired: 'required' | 'optional' | 'none';
  reward: QuestReward;
  location: QuestLocation;
  participation: QuestParticipation;
  candidateMode: CanonicalQuestCandidateMode;
  /** Requested capacity; retained as `headcount` for the existing API. */
  headcount: number;
  requestedHeadcount?: number;
  tags: string[];
  startAt: string;
  endAt?: string;
  deadlineAt: string;
  postedAt: string;
  imageUris: string[];
  hirerId: string;
  prototypeOnly?: boolean;
  prototypeScenario?: QuestBoardQuest['prototypeScenario'];
}

export interface QuestDetailState {
  quest: QuestContract;
  /** All independent Quest Teams/proposals for GROUP + CANDIDATE. */
  teams: QuestTeam[];
  /** Candidate Proposal alias; `applications` remains for existing screens. */
  proposals?: QuestApplication[];
  /** @deprecated Use `teams`; retained as a read projection for the existing prototype UI. */
  team?: QuestTeam;
  invitations: QuestInvitation[];
  applications: QuestApplication[];
  assignments: QuestAssignment[];
  /** Actual roster size; requested capacity remains `quest.headcount`. */
  actualHeadcount?: number;
  settlement?: QuestSettlementSummary;
  proofs: QuestProof[];
  partialStartConsent?: QuestPartialStartConsent;
  editConsent?: QuestEditConsent;
  conversation: WorkConversationCapability;
  /** Server-provided membership projection; the client never derives conversation IDs. */
  conversationMemberIds?: string[];
  capabilities: QuestCapabilities;
  publishCheck?: QuestPublishCheck;
}

export function isValidSatang(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Parse a user-entered THB amount without using floating-point arithmetic. */
export function parseSatangInput(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(2, '0') || '0');
  const satang = whole * SATANG_PER_BAHT + fraction;
  return Number.isSafeInteger(satang) ? satang : null;
}

export function formatSatang(value: number, locale: 'en' | 'th' = 'en'): string {
  if (!isValidSatang(value)) return '฿0';
  const baht = Math.floor(value / SATANG_PER_BAHT);
  const satang = value % SATANG_PER_BAHT;
  const formattedBaht = baht.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US');
  return satang === 0 ? `฿${formattedBaht}` : `฿${formattedBaht}.${String(satang).padStart(2, '0')}`;
}

export interface QuestBoardQuest {
  id: string;
  title: string;
  tags: string[];
  description: string;
  completionCriteria: string;
  proofRequired: 'required' | 'optional' | 'none';
  rewardPerPerson: number;
  /** Canonical integer amount, retained alongside the legacy board display field. */
  rewardSatang?: number;
  headcount: number;
  acceptedParticipants: number;
  startDate: string;
  deadline: string;
  timeRange?: string;
  postedAt: string;
  location: string;
  /** Canonical location projection; only `label` is server-owned. */
  locationDetails?: QuestLocation;
  locationMode: QuestLocationMode;
  participationMode: QuestParticipationMode;
  candidateMode: QuestCandidateMode;
  creator: { name: string; faculty?: string; avatarUri?: string };
  imageUris?: string[];
  studentInterestMatch: boolean;
  ownerStudentId: string;
  /** Prototype-only scenario fixtures remain route/test addressable but hidden from discovery. */
  prototypeOnly?: boolean;
  prototypeScenario?: 'team-forming-demo' | 'team-selection-demo' | 'single-candidate-demo' | 'partial-group-start-demo';
  /** Canonical state/capability fields are optional for legacy board consumers. */
  status?: QuestStatus;
  conversation?: WorkConversationCapability;
}

export type DeadlineFilter = 'today' | 'within-3-days' | 'within-7-days';
export type StartTimeBucket = 'morning' | 'afternoon' | 'evening';

export interface QuestBoardFilter {
  query: string;
  tags: string[];
  rewardMin: number | null;
  rewardMax: number | null;
  deadline: DeadlineFilter | null;
  startTimeBuckets: StartTimeBucket[];
  locationModes: QuestLocationMode[];
}

export interface QuestBoardQueryOptions {
  currentStudentId?: string;
  now?: Date;
}

export const emptyQuestBoardFilter: QuestBoardFilter = {
  query: '',
  tags: [],
  rewardMin: null,
  rewardMax: null,
  deadline: null,
  startTimeBuckets: [],
  locationModes: [],
};
