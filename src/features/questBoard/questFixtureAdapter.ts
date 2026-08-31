import { questFixtures } from "./questFixtures";
import type {
  ChatAttachment,
  ChatConversation,
  ChatMessage,
  LocalizedText,
} from "../chat/chatTypes";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestCandidateMode,
  QuestEditRequestStatus,
  QuestEditResponseStatus,
  QuestInvitationStatus,
  QuestPartialStartConsentStatus,
  QuestPartialStartVoteStatus,
  QuestParticipation,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
  formatSatang,
  isValidSatang,
  type CanonicalQuestCandidateMode,
  type QuestAction,
  type QuestApplication,
  type QuestAssignment,
  type QuestBoardQuest,
  type QuestContract,
  type QuestDetailState,
  type QuestEditConsent,
  type QuestEditConsentResponse,
  type QuestEscrowSummary,
  type QuestLocation,
  type QuestPartialStartConsent,
  type QuestPartialStartConsentResponse,
  type QuestProof,
  type QuestPublishCheck,
  type QuestSettlementSummary,
  type QuestStatus as QuestStatusValue,
  type QuestTeam,
  type QuestTeamMember,
  type WorkConversationCapability,
} from "./types";

export const DEFAULT_PROTOTYPE_VIEWER_ID = "student-demo";
export const DEFAULT_PLATFORM_FEE_BASIS_POINTS = 500;
export const EDIT_CONSENT_WINDOW_MS = 5 * 60 * 1000;
export const PARTIAL_GROUP_START_CONSENT_WINDOW_MS = 5 * 60 * 1000;
/** Alias kept explicit for callers that use the shorter domain term. */
export const PARTIAL_START_CONSENT_WINDOW_MS =
  PARTIAL_GROUP_START_CONSENT_WINDOW_MS;
export const INVITATION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_REWORK_LIMIT = 2;
export const PROTOTYPE_NOW = "2026-08-12T09:00:00.000Z";

export type QuestFixtureErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS"
  | "INVALID_MODE"
  | "CAPACITY_REACHED"
  | "DUPLICATE_ACTION"
  | "TEAM_REQUIRED"
  | "TEAM_NOT_FOUND"
  | "TEAM_NOT_READY"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_EXPIRED"
  | "IMMUTABLE_TEAM"
  | "APPLICATION_NOT_FOUND"
  | "PROOF_NOT_FOUND"
  | "PROOF_NOT_READY"
  | "EDIT_NOT_ALLOWED"
  | "PUBLISH_BLOCKED"
  | "INVALID_MESSAGE";

export interface QuestFixtureError {
  code: QuestFixtureErrorCode;
  message: string;
}

export type QuestFixtureResult =
  | { ok: true; state: QuestDetailState }
  | { ok: false; state: QuestDetailState; error: QuestFixtureError };

export type QuestFixtureValueResult<T> =
  | { ok: true; value: T; state?: QuestDetailState }
  | { ok: false; error: QuestFixtureError; state?: QuestDetailState };

export type QuestActionResult =
  | QuestFixtureResult
  | QuestFixtureValueResult<ChatMessage>
  | QuestFixtureValueResult<ChatConversation>;

export interface QuestMemberSearchResult {
  id: string;
  workerId: string;
  displayName: string;
}

export interface QuestFixtureAdapterOptions {
  now?: Date;
  states?: QuestDetailState[];
  platformFeeBasisPoints?: number;
  /** Injectable KU directory seam used by the team invitation search prototype. */
  memberDirectory?: QuestMemberSearchResult[];
}

/** The typed create payload shared by the demo Create Quest flow and adapter. */
export interface QuestFixtureCreateInput {
  title: string;
  tag: string;
  description: string;
  conditions: string;
  proofRequired: QuestContract["proofRequired"];
  startDate: string;
  deadline: string;
  startTime: string;
  endTime: string;
  location: QuestLocation;
  candidateMode: CanonicalQuestCandidateMode;
  /** `SOLO` is the create payload vocabulary; `SINGLE` is accepted for callers using the adapter vocabulary. */
  participation: "SOLO" | "SINGLE" | "GROUP";
  headcount: number;
  rewardSatang: number;
  imageUris: string[];
}

export type QuestFixtureCreatePayload = QuestFixtureCreateInput;

export type QuestFixtureAction =
  | {
      type: "CREATE_AND_PUBLISH";
      payload: QuestFixtureCreateInput;
      hirerId?: string;
    }
  | { type: "DIRECT_JOIN"; questId: string; workerId?: string }
  | { type: "APPLY"; questId: string; workerId?: string }
  | {
      type: "WITHDRAW_APPLICATION";
      questId: string;
      applicationId?: string;
      workerId?: string;
      applicantId?: string;
    }
  | {
      type: "CREATE_TEAM";
      questId: string;
      leaderId?: string;
      /** Deprecated: team names are ignored. */ name?: string;
    }
  | {
      type: "INVITE_WORKER";
      questId: string;
      workerId: string;
      leaderId?: string;
    }
  | {
      type: "REVOKE_INVITATION";
      questId: string;
      invitationId: string;
      leaderId?: string;
    }
  | {
      type: "RESPOND_INVITATION";
      questId: string;
      invitationId: string;
      workerId: string;
      accept: boolean;
    }
  | { type: "SUBMIT_TEAM"; questId: string; leaderId?: string }
  | {
      type: "SELECT_CANDIDATE";
      questId: string;
      applicationId: string;
      hirerId?: string;
    }
  | {
      type: "REJECT_CANDIDATE";
      questId: string;
      applicationId: string;
      hirerId?: string;
    }
  | { type: "REJECT_TEAM"; questId: string; teamId: string; hirerId?: string }
  | { type: "SELECT_TEAM"; questId: string; teamId: string; hirerId?: string }
  | {
      type: "REQUEST_EDIT";
      questId: string;
      changes: QuestEditConsent["requestedChanges"];
      hirerId?: string;
    }
  | {
      type: "VOTE_EDIT_CONSENT";
      questId: string;
      workerId: string;
      approve: boolean;
    }
  | {
      type: "VOTE_PARTIAL_GROUP_START_CONSENT";
      questId: string;
      voterId: string;
      approve: boolean;
    }
  | {
      type: "VOTE_PARTIAL_START_CONSENT";
      questId: string;
      voterId: string;
      approve: boolean;
    }
  | {
      type: "SUBMIT_PROOF";
      questId: string;
      ownerId?: string;
      imageUris?: string[];
      note?: string;
    }
  | {
      type: "REVIEW_PROOF";
      questId: string;
      proofId: string;
      approve: boolean;
      reason?: string;
      hirerId?: string;
    }
  | {
      type: "REWORK_PROOF";
      questId: string;
      proofId: string;
      ownerId?: string;
      imageUris?: string[];
      note?: string;
    }
  | { type: "CONFIRM_COMPLETION"; questId: string; workerId?: string }
  | { type: "COMPLETE"; questId: string; hirerId?: string }
  | { type: "OPEN_DISPUTE"; questId: string; actorId?: string }
  | { type: "RESOLVE_DISPUTE"; questId: string; actorId?: string }
  | { type: "CANCEL"; questId: string; actorId?: string }
  | { type: "PUBLISH"; questId: string; hirerId?: string };

export type ChatAction =
  | {
      type: "SEND_MESSAGE";
      conversationId: string;
      senderId: string;
      body: string;
    }
  | {
      type: "MARK_CONVERSATION_READ";
      conversationId: string;
      viewerId?: string;
    };

export type QuestWorkflowAction = QuestFixtureAction | ChatAction;

export interface QuestFixtureAdapter {
  readonly now: Date;
  getState(
    questId: string,
    viewerId?: string,
    now?: Date
  ): QuestDetailState | null;
  getQuestDetail(
    questId: string,
    viewerId?: string,
    now?: Date
  ): QuestDetailState | null;
  listStates(viewerId?: string, now?: Date): QuestDetailState[];
  listBoardQuests(viewerId?: string, now?: Date): QuestBoardQuest[];
  getPublishCheck(questId: string, now?: Date): QuestPublishCheck | null;
  getEscrowSummary(rewardSatang: number, headcount: number): QuestEscrowSummary;
  getConversationCapability(
    questId: string,
    viewerId?: string,
    now?: Date
  ): WorkConversationCapability;
  /** Returns only conversations readable by the viewer, ordered by latest message. */
  listConversations(viewerId?: string, now?: Date): ChatConversation[];
  /** Returns a conversation only when its server id and viewer membership match. */
  getConversation(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): ChatConversation | null;
  /** Returns messages in a readable server conversation, or an empty list when denied. */
  getConversationMessages(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): ChatMessage[];
  /** Short alias for callers that already have a conversation context. */
  getMessages(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): ChatMessage[];
  /** Appends a session-only message after re-checking server conversation capability. */
  sendMessage(
    conversationId: string,
    senderId: string,
    body: string,
    now?: Date
  ): QuestFixtureValueResult<ChatMessage>;
  /** Explicit alias for the chat action. */
  sendChatMessage(
    conversationId: string,
    senderId: string,
    body: string,
    now?: Date
  ): QuestFixtureValueResult<ChatMessage>;
  /** Marks the viewer read cursor for a server conversation. */
  markConversationRead(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): QuestFixtureValueResult<ChatConversation>;
  /** Short alias for marking the viewer read cursor. */
  markRead(
    conversationId: string,
    viewerId?: string,
    now?: Date
  ): QuestFixtureValueResult<ChatConversation>;
  /** Compatibility projection for the pre-adapter inbox; fixture data still lives in the adapter. */
  listFixtureConversations(viewerId?: string, now?: Date): ChatConversation[];
  getSettlement(questId: string, now?: Date): QuestSettlementSummary | null;
  searchKuMembers(
    questId: string,
    query: string,
    leaderId?: string,
    now?: Date
  ): QuestMemberSearchResult[];
  /** Alias for the KU-member search seam. */
  searchMembers(
    questId: string,
    query: string,
    leaderId?: string,
    now?: Date
  ): QuestMemberSearchResult[];
  /** Creates and publishes a new in-memory demo Quest; drafts remain in SecureStore. */
  createQuest(
    payload: QuestFixtureCreateInput,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  createAndPublishQuest(
    payload: QuestFixtureCreateInput,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  dispatch(
    action: {
      type: "SEND_MESSAGE";
      conversationId: string;
      senderId: string;
      body: string;
    },
    now?: Date
  ): QuestFixtureValueResult<ChatMessage>;
  dispatch(
    action: {
      type: "MARK_CONVERSATION_READ";
      conversationId: string;
      viewerId?: string;
    },
    now?: Date
  ): QuestFixtureValueResult<ChatConversation>;
  dispatch(action: QuestFixtureAction, now?: Date): QuestFixtureResult;
  dispatch(
    action: QuestWorkflowAction,
    now?: Date
  ):
    | QuestFixtureResult
    | QuestFixtureValueResult<ChatMessage>
    | QuestFixtureValueResult<ChatConversation>;
  subscribe(listener: () => void): () => void;
  reset(): void;
  joinDirect(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  directJoin(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  applyCandidate(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  submitApplication(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  withdrawApplication(
    questId: string,
    applicationId?: string,
    workerIdOrNow?: string | Date,
    now?: Date
  ): QuestFixtureResult;
  withdrawCandidate(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  createTeam(
    questId: string,
    leaderId?: string,
    nameOrNow?: string | Date,
    now?: Date
  ): QuestFixtureResult;
  inviteWorker(
    questId: string,
    workerId: string,
    leaderId?: string,
    now?: Date
  ): QuestFixtureResult;
  revokeInvitation(
    questId: string,
    invitationId: string,
    leaderId?: string,
    now?: Date
  ): QuestFixtureResult;
  respondToInvitation(
    questId: string,
    invitationId: string,
    workerId: string,
    accept: boolean,
    now?: Date
  ): QuestFixtureResult;
  acceptInvitation(
    questId: string,
    invitationId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  declineInvitation(
    questId: string,
    invitationId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  submitTeam(
    questId: string,
    leaderId?: string,
    now?: Date
  ): QuestFixtureResult;
  selectCandidate(
    questId: string,
    applicationId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  rejectCandidate(
    questId: string,
    applicationId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  rejectTeam(
    questId: string,
    teamId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  selectTeam(
    questId: string,
    teamId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  requestEdit(
    questId: string,
    changes: QuestEditConsent["requestedChanges"],
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  voteEditConsent(
    questId: string,
    workerId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  respondToEditConsent(
    questId: string,
    workerId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  votePartialGroupStartConsent(
    questId: string,
    voterId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  votePartialStartConsent(
    questId: string,
    voterId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  respondToPartialStartConsent(
    questId: string,
    voterId: string,
    approve: boolean,
    now?: Date
  ): QuestFixtureResult;
  submitProof(
    questId: string,
    ownerId?: string,
    imageUris?: string[],
    note?: string,
    now?: Date
  ): QuestFixtureResult;
  reviewProof(
    questId: string,
    proofId: string,
    approve: boolean,
    reason?: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  approveProof(
    questId: string,
    proofId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  rejectProof(
    questId: string,
    proofId: string,
    reason?: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  submitRework(
    questId: string,
    proofId: string,
    ownerId?: string,
    imageUris?: string[],
    note?: string,
    now?: Date
  ): QuestFixtureResult;
  confirmCompletion(
    questId: string,
    workerId?: string,
    now?: Date
  ): QuestFixtureResult;
  completeQuest(
    questId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
  openDispute(
    questId: string,
    actorId?: string,
    now?: Date
  ): QuestFixtureResult;
  resolveDispute(
    questId: string,
    actorId?: string,
    now?: Date
  ): QuestFixtureResult;
  cancelQuest(
    questId: string,
    actorId?: string,
    now?: Date
  ): QuestFixtureResult;
  publishQuest(
    questId: string,
    hirerId?: string,
    now?: Date
  ): QuestFixtureResult;
}

interface FixtureSeed {
  state: QuestDetailState;
  conversationMemberIds: string[];
}

interface FixtureChatMessageSeed {
  id: string;
  senderId: string;
  text?: LocalizedText;
  time: string;
  sentAt?: string;
  minutesAgo?: number;
  attachment?: ChatAttachment;
}

interface FixtureChatSeed {
  id: string;
  questId?: string;
  memberIds: string[];
  questTitle: LocalizedText;
  participantName: string;
  participantRole: ChatConversation["participantRole"];
  initials: string;
  avatarColor: string;
  messages: FixtureChatMessageSeed[];
  readAt?: Record<string, string>;
}

interface FixtureChatMessage extends FixtureChatMessageSeed {
  sentAt: string;
}

interface FixtureChatConversation extends Omit<
  FixtureChatSeed,
  "messages" | "readAt"
> {
  messages: FixtureChatMessage[];
  readAt: Record<string, string>;
}

const DEFAULT_MEMBER_DIRECTORY: QuestMemberSearchResult[] = [
  {
    id: "demo-worker-2",
    workerId: "demo-worker-2",
    displayName: "Demo Worker 2",
  },
  {
    id: "demo-worker-3",
    workerId: "demo-worker-3",
    displayName: "Demo Worker 3",
  },
  {
    id: "demo-worker-4",
    workerId: "demo-worker-4",
    displayName: "Demo Worker 4",
  },
  {
    id: "team-worker-a",
    workerId: "team-worker-a",
    displayName: "Team Worker A",
  },
  {
    id: "team-worker-b",
    workerId: "team-worker-b",
    displayName: "Team Worker B",
  },
  {
    id: "team-worker-c",
    workerId: "team-worker-c",
    displayName: "Team Worker C",
  },
];

const QUEST_OWNER_GREETING: LocalizedText = {
  en: "Hi! Feel free to ask about this Quest.",
  th: "สวัสดี สอบถามรายละเอียดเควสต์นี้ได้เลย",
};

function questConversationId(questId: string): string {
  return `conversation-fixture-${questId}`;
}

function chatSentAt(minutesAgo = 0): string {
  return new Date(
    new Date(PROTOTYPE_NOW).getTime() - minutesAgo * 60 * 1000
  ).toISOString();
}

function chatMessage(
  id: string,
  senderId: string,
  time: string,
  text?: LocalizedText,
  attachment?: ChatAttachment,
  minutesAgo = 0
): FixtureChatMessageSeed {
  return { id, senderId, time, text, attachment, minutesAgo };
}

/**
 * Server-shaped chat fixtures live beside the other adapter seeds. The UI
 * projection in chatData intentionally contains no copy of these messages.
 */
const FIXTURE_CHAT_SEEDS: FixtureChatSeed[] = [
  {
    id: "quest-move-boxes-group",
    questId: "move-boxes",
    memberIds: ["student-creator-1", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Help move boxes to the dorm", th: "ช่วยยกกล่องไปหอพัก" },
    participantName: "Quest team",
    participantRole: "member",
    initials: "QT",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "move-boxes-welcome",
        "student-creator-1",
        "Now",
        {
          en: "Welcome to the Quest team chat.",
          th: "ยินดีต้อนรับสู่แชตกลุ่มของเควสต์",
        },
        undefined,
        1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "quest-clean-fan-group",
    questId: "clean-fan",
    memberIds: ["demo-hirer", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Clean a dorm fan", th: "ล้างพัดลมหอพัก" },
    participantName: "Quest team",
    participantRole: "member",
    initials: "QT",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "clean-fan-welcome",
        "demo-hirer",
        "Now",
        {
          en: "Use this chat to coordinate with the Quest team.",
          th: "ใช้แชตนี้ประสานงานกับทีมเควสต์ได้เลย",
        },
        undefined,
        1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "quest-buy-lunch-group",
    questId: "buy-lunch",
    memberIds: ["student-creator-4", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Buy lunch from the canteen", th: "ซื้อข้าวจากโรงอาหาร" },
    participantName: "Quest team",
    participantRole: "member",
    initials: "QT",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "buy-lunch-welcome",
        "student-creator-4",
        "Now",
        {
          en: "The Quest team chat is ready.",
          th: "แชตกลุ่มของเควสต์พร้อมใช้งานแล้ว",
        },
        undefined,
        1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "campus-survey-crew",
    memberIds: ["demo-hirer", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: { en: "Campus Survey Crew", th: "ทีมเก็บข้อมูลภาคสนาม" },
    participantName: "Ethan Smith",
    participantRole: "owner",
    initials: "ES",
    avatarColor: "#DDE9D9",
    messages: [
      chatMessage(
        "campus-1",
        "demo-hirer",
        "10:18",
        {
          en: "Hi! Are we still meeting at the Faculty of Economics at 10:00?",
          th: "สวัสดี เรายังนัดเจอกันที่คณะเศรษฐศาสตร์ตอน 10 โมงเหมือนเดิมไหม",
        },
        undefined,
        24
      ),
      chatMessage(
        "campus-2",
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "10:21",
        {
          en: "Yes, I’ll bring the printed consent forms.",
          th: "ใช่ เดี๋ยวฉันนำแบบฟอร์มยินยอมฉบับพิมพ์ไปให้",
        },
        undefined,
        21
      ),
      chatMessage(
        "campus-3",
        "demo-hirer",
        "10:32",
        {
          en: "Could you send the final schedule to the team?",
          th: "ช่วยส่งกำหนดการฉบับสุดท้ายให้ทีมได้ไหม",
        },
        undefined,
        10
      ),
      chatMessage(
        "campus-4",
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "10:35",
        undefined,
        { name: "fieldwork-schedule.pdf", meta: "PDF · 248 KB", kind: "pdf" },
        7
      ),
      chatMessage(
        "campus-5",
        "demo-hirer",
        "10:42",
        {
          en: "Thanks — I’ll share it with the rest of the Quest team.",
          th: "ขอบคุณ เดี๋ยวฉันแชร์ให้ทีมเควสต์ที่เหลือ",
        },
        undefined,
        2
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: chatSentAt(11) },
  },
  {
    id: "open-day-media",
    memberIds: ["demo-worker-2", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: {
      en: "Open Day Media Team",
      th: "ทีมสื่อประชาสัมพันธ์วันเปิดบ้าน",
    },
    participantName: "Nina K.",
    participantRole: "member",
    initials: "NK",
    avatarColor: "#EAF6ED",
    messages: [
      chatMessage(
        "open-day-1",
        "demo-worker-2",
        "Yesterday",
        {
          en: "The poster looks good. I’ll upload the final version.",
          th: "โปสเตอร์ดูดีแล้ว เดี๋ยวฉันอัปโหลดฉบับสุดท้าย",
        },
        undefined,
        24 * 60 + 1
      ),
      chatMessage(
        "open-day-2",
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "Yesterday",
        {
          en: "Great. Please keep the venue details unchanged.",
          th: "เยี่ยมเลย รบกวนคงรายละเอียดสถานที่ไว้เหมือนเดิมนะ",
        },
        undefined,
        24 * 60
      ),
      chatMessage(
        "open-day-3",
        "demo-worker-2",
        "Yesterday",
        undefined,
        { name: "open-day-poster.png", meta: "PNG · 1.4 MB", kind: "image" },
        24 * 60 - 1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
  {
    id: "faculty-research-assistant",
    memberIds: ["demo-hirer", DEFAULT_PROTOTYPE_VIEWER_ID],
    questTitle: {
      en: "Faculty Research Assistant",
      th: "ผู้ช่วยงานวิจัยประจำคณะ",
    },
    participantName: "Ploy Rattanaporn",
    participantRole: "owner",
    initials: "PR",
    avatarColor: "#F0F4F1",
    messages: [
      chatMessage(
        "research-1",
        "demo-hirer",
        "Mon",
        {
          en: "I’ve attached the consent form for your review.",
          th: "ฉันแนบแบบฟอร์มยินยอมสำหรับตรวจสอบไว้แล้ว",
        },
        undefined,
        24 * 60
      ),
      chatMessage(
        "research-2",
        "demo-hirer",
        "Mon",
        undefined,
        { name: "participant-consent.pdf", meta: "PDF · 326 KB", kind: "pdf" },
        24 * 60 - 1
      ),
    ],
    readAt: { [DEFAULT_PROTOTYPE_VIEWER_ID]: PROTOTYPE_NOW },
  },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeDate(value: Date | string | undefined, fallback: Date): Date {
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value ?? fallback);
  return Number.isNaN(date.getTime()) ? new Date(fallback.getTime()) : date;
}

function addMilliseconds(value: string, milliseconds: number): string {
  return new Date(new Date(value).getTime() + milliseconds).toISOString();
}

function dateTime(
  date: string,
  time: string | undefined,
  fallback = "09:00"
): string {
  const selectedTime = time?.match(/\d{1,2}:\d{2}/)?.[0] ?? fallback;
  return new Date(`${date}T${selectedTime}:00Z`).toISOString();
}

function splitTimeRange(value: string | undefined): {
  start: string;
  end: string;
} {
  const match = value?.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  return { start: match?.[1] ?? "09:00", end: match?.[2] ?? "10:00" };
}

function parseCreateDateTime(
  dateValue: unknown,
  timeValue: unknown
): string | null {
  if (typeof dateValue !== "string" || typeof timeValue !== "string")
    return null;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(timeValue)
  )
    return null;
  const parsed = new Date(`${dateValue}T${timeValue}:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const iso = parsed.toISOString();
  return iso.slice(0, 10) === dateValue && iso.slice(11, 16) === timeValue
    ? iso
    : null;
}

function createPayloadBlockers(payload: QuestFixtureCreateInput): string[] {
  const record =
    payload && typeof payload === "object"
      ? (payload as unknown as Record<string, unknown>)
      : {};
  const blockers: string[] = [];
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const tag = typeof record.tag === "string" ? record.tag.trim() : "";
  const description =
    typeof record.description === "string" ? record.description.trim() : "";
  const conditions =
    typeof record.conditions === "string" ? record.conditions.trim() : "";
  const location =
    record.location && typeof record.location === "object"
      ? (record.location as Record<string, unknown>)
      : null;
  const locationLabel = location?.label;
  const startAt = parseCreateDateTime(record.startDate, record.startTime);
  const endAt = parseCreateDateTime(record.startDate, record.endTime);
  const deadlineAt = parseCreateDateTime(record.deadline, record.endTime);
  const participation = record.participation;
  const headcount = record.headcount;
  const isSingle =
    participation === "SOLO" || participation === QuestParticipation.SINGLE;

  if (!title) blockers.push("TITLE_REQUIRED");
  if (!tag) blockers.push("TAG_REQUIRED");
  if (!description) blockers.push("DESCRIPTION_REQUIRED");
  if (!conditions) blockers.push("COMPLETION_CRITERIA_REQUIRED");
  if (
    record.proofRequired !== "required" &&
    record.proofRequired !== "optional" &&
    record.proofRequired !== "none"
  )
    blockers.push("PROOF_INVALID");
  if (!startAt) blockers.push("START_REQUIRED");
  if (
    !endAt ||
    (startAt && new Date(endAt).getTime() <= new Date(startAt).getTime())
  )
    blockers.push("TIME_ORDER_INVALID");
  if (
    !deadlineAt ||
    (startAt && new Date(deadlineAt).getTime() <= new Date(startAt).getTime())
  )
    blockers.push("DEADLINE_REQUIRED");
  if (
    !location ||
    (locationLabel !== null &&
      (typeof locationLabel !== "string" || !locationLabel.trim()))
  )
    blockers.push("LOCATION_REQUIRED");
  if (
    record.candidateMode !== QuestCandidateMode.NO_CANDIDATE &&
    record.candidateMode !== QuestCandidateMode.CANDIDATE
  )
    blockers.push("CANDIDATE_MODE_INVALID");
  if (!isSingle && participation !== QuestParticipation.GROUP)
    blockers.push("PARTICIPATION_INVALID");
  if (
    !Number.isSafeInteger(record.rewardSatang) ||
    !isValidSatang(record.rewardSatang as number)
  )
    blockers.push("REWARD_INVALID");
  if (!Number.isSafeInteger(headcount) || (headcount as number) < 1)
    blockers.push("HEADCOUNT_INVALID");
  if (isSingle && headcount !== 1)
    blockers.push("SINGLE_HEADCOUNT_MUST_BE_ONE");
  if (
    !Array.isArray(record.imageUris) ||
    record.imageUris.some((uri) => typeof uri !== "string")
  )
    blockers.push("IMAGES_INVALID");
  return [...new Set(blockers)];
}

type CreatedQuestStateResult =
  { state: QuestDetailState } | { blockers: string[] };

function buildCreatedQuestState(
  payload: QuestFixtureCreateInput,
  questId: string,
  hirerId: string,
  now: Date
): CreatedQuestStateResult {
  const blockers = createPayloadBlockers(payload);
  if (blockers.length > 0) return { blockers };

  const startAt = parseCreateDateTime(payload.startDate, payload.startTime);
  const endAt = parseCreateDateTime(payload.startDate, payload.endTime);
  const deadlineAt = parseCreateDateTime(payload.deadline, payload.endTime);
  if (!startAt || !endAt || !deadlineAt)
    return { blockers: ["START_REQUIRED", "DEADLINE_REQUIRED"] };
  const headcount =
    payload.participation === "SOLO" ||
    payload.participation === QuestParticipation.SINGLE
      ? 1
      : payload.headcount;
  const locationLabel =
    payload.location.label === null ? null : payload.location.label.trim();
  const fixture: QuestBoardQuest = {
    id: questId,
    title: payload.title.trim(),
    tags: [payload.tag.trim()],
    description: payload.description.trim(),
    completionCriteria: payload.conditions.trim(),
    proofRequired: payload.proofRequired,
    rewardPerPerson: payload.rewardSatang / 100,
    rewardSatang: payload.rewardSatang,
    headcount,
    acceptedParticipants: 0,
    startDate: startAt.slice(0, 10),
    deadline: deadlineAt.slice(0, 10),
    timeRange: `${payload.startTime}–${payload.endTime}`,
    postedAt: now.toISOString(),
    location: locationLabel ?? "Online",
    locationMode: locationLabel === null ? "online" : "on-campus",
    participationMode: payload.participation === "GROUP" ? "team" : "single",
    candidateMode: payload.candidateMode,
    creator: { name: hirerId },
    imageUris: [...payload.imageUris].slice(0, 3),
    studentInterestMatch: false,
    ownerStudentId: hirerId,
  };
  const state = createState(fixture, QuestStatus.QUEST_DRAFT);
  state.quest.startAt = startAt;
  state.quest.endAt = endAt;
  state.quest.deadlineAt = deadlineAt;
  state.quest.requestedHeadcount = headcount;
  return { state };
}

function canonicalCandidateMode(
  value: QuestBoardQuest["candidateMode"]
): CanonicalQuestCandidateMode {
  return value === QuestCandidateMode.NO_CANDIDATE
    ? QuestCandidateMode.NO_CANDIDATE
    : QuestCandidateMode.CANDIDATE;
}

function canonicalQuest(
  fixture: QuestBoardQuest,
  status: QuestStatusValue
): QuestContract {
  const times = splitTimeRange(fixture.timeRange);
  const rewardSatang =
    fixture.rewardSatang ?? Math.round(fixture.rewardPerPerson * 100);
  return {
    id: fixture.id,
    status,
    title: fixture.title,
    description: fixture.description,
    completionCriteria: fixture.completionCriteria,
    proofRequired: fixture.proofRequired,
    reward: { rewardSatang, currency: "THB" },
    location: {
      label: fixture.locationMode === "online" ? null : fixture.location,
    },
    participation:
      fixture.participationMode === "team"
        ? QuestParticipation.GROUP
        : QuestParticipation.SINGLE,
    candidateMode: canonicalCandidateMode(fixture.candidateMode),
    headcount: fixture.headcount,
    tags: [...fixture.tags],
    startAt: dateTime(fixture.startDate, times.start),
    endAt: dateTime(fixture.startDate, times.end),
    deadlineAt: dateTime(fixture.deadline, times.end),
    postedAt: fixture.postedAt,
    imageUris: [...(fixture.imageUris ?? [])].slice(0, 3),
    hirerId: fixture.ownerStudentId,
  };
}

function blankCapabilities(): QuestDetailState["capabilities"] {
  return {
    availableActions: [],
    canReadConversation: false,
    canWriteConversation: false,
  };
}

function createState(
  fixture: QuestBoardQuest,
  status: QuestStatusValue
): QuestDetailState {
  return {
    quest: canonicalQuest(fixture, status),
    teams: [],
    invitations: [],
    applications: [],
    assignments: [],
    actualHeadcount: 0,
    proofs: [],
    conversation: {
      conversationId: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "NOT_STARTED",
    },
    conversationMemberIds: [],
    capabilities: blankCapabilities(),
  };
}

function createDraftState(): QuestDetailState {
  const now = new Date(PROTOTYPE_NOW);
  const draft: QuestBoardQuest = {
    id: "draft-escrow-demo",
    title: "Draft campus photo session",
    tags: ["design"],
    description: "A deterministic draft used to preview publishing and Escrow.",
    completionCriteria: "Upload the final photo set.",
    proofRequired: "required",
    rewardPerPerson: 250,
    rewardSatang: 25000,
    headcount: 2,
    acceptedParticipants: 0,
    startDate: "2026-08-26",
    deadline: "2026-08-27",
    timeRange: "09:00–12:00",
    postedAt: now.toISOString(),
    location: "Student activity building",
    locationMode: "on-campus",
    participationMode: "team",
    candidateMode: "CANDIDATE",
    creator: { name: "Demo Hirer" },
    imageUris: [],
    studentInterestMatch: false,
    ownerStudentId: "demo-hirer",
  };
  return createState(draft, QuestStatus.QUEST_DRAFT);
}

function assignment(
  quest: QuestContract,
  workerId: string,
  source: QuestAssignment["source"],
  status: QuestAssignment["status"] = QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
  suffix = workerId,
  applicationId?: string,
  teamId?: string
): QuestAssignment {
  const startedStatuses: QuestStatusValue[] = [
    QuestStatus.QUEST_IN_PROGRESS,
    QuestStatus.QUEST_SUBMITTED,
    QuestStatus.QUEST_APPROVED,
    QuestStatus.QUEST_REWORK,
    QuestStatus.QUEST_COMPLETED,
    QuestStatus.QUEST_DISPUTED,
  ];
  return {
    id: `fixture-assignment-${quest.id}-${suffix}`,
    questId: quest.id,
    workerId,
    source,
    status,
    rewardSatang: quest.reward.rewardSatang,
    joinedAt: quest.postedAt,
    startedAt: startedStatuses.includes(quest.status)
      ? quest.startAt
      : undefined,
    completedAt:
      status === QuestAssignmentStatus.ASSIGNMENT_COMPLETED
        ? quest.deadlineAt
        : undefined,
    applicationId,
    teamId,
  };
}

function application(
  questId: string,
  applicantId: string | undefined,
  status: QuestApplication["status"] = QuestApplicationStatus.APPLICATION_APPLIED,
  teamId?: string,
  suffix = applicantId ?? teamId ?? "candidate",
  submittedAt = PROTOTYPE_NOW
): QuestApplication {
  return {
    id: `fixture-application-${questId}-${suffix}`,
    questId,
    applicantId,
    teamId,
    status,
    submittedAt,
  };
}

function makeTeam(
  quest: QuestContract,
  leaderId: string,
  members: QuestTeamMember[],
  status: QuestTeam["status"] = QuestTeamStatus.TEAM_FORMING,
  suffix = leaderId
): QuestTeam {
  return {
    id: `fixture-team-${quest.id}-${suffix}`,
    questId: quest.id,
    leaderId,
    status,
    members,
    requiredHeadcount: quest.headcount,
    createdAt: PROTOTYPE_NOW,
  };
}

function proof(
  quest: QuestContract,
  ownerId: string,
  status: QuestProof["status"],
  reworkCount = 0,
  reviewReason?: string,
  teamId?: string
): QuestProof {
  return {
    id: `fixture-proof-${quest.id}-${ownerId}`,
    questId: quest.id,
    ownerId,
    teamId,
    status,
    imageUris: ["fixture://proof-image"],
    note: "Fixture proof for the Quest prototype.",
    submittedAt: PROTOTYPE_NOW,
    reviewedAt:
      status === QuestProofStatus.PROOF_PENDING ? undefined : PROTOTYPE_NOW,
    reviewReason,
    reworkCount,
    reworkLimit: DEFAULT_REWORK_LIMIT,
  };
}

function addScenarioStates(
  seeds: FixtureSeed[],
  byId: Map<string, FixtureSeed>
): void {
  const forming = byId.get("team-forming-demo");
  if (forming) {
    forming.state.teams.push(
      makeTeam(forming.state.quest, "demo-team-leader", [
        {
          workerId: "demo-team-leader",
          role: "LEADER",
          displayName: "Demo Team Leader",
        },
      ])
    );
  }

  const selection = byId.get("team-selection-demo");
  if (selection) {
    const firstTeam = makeTeam(
      selection.state.quest,
      "team-leader-a",
      [
        {
          workerId: "team-leader-a",
          role: "LEADER",
          displayName: "Team Leader A",
        },
        {
          workerId: "team-worker-a",
          role: "MEMBER",
          displayName: "Team Worker A",
        },
      ],
      QuestTeamStatus.TEAM_SUBMITTED,
      "a"
    );
    const secondTeam = makeTeam(
      selection.state.quest,
      "team-leader-b",
      [
        {
          workerId: "team-leader-b",
          role: "LEADER",
          displayName: "Team Leader B",
        },
        {
          workerId: "team-worker-b",
          role: "MEMBER",
          displayName: "Team Worker B",
        },
        {
          workerId: "team-worker-c",
          role: "MEMBER",
          displayName: "Team Worker C",
        },
      ],
      QuestTeamStatus.TEAM_SUBMITTED,
      "b"
    );
    selection.state.teams.push(firstTeam, secondTeam);
    selection.state.applications.push(
      application(
        selection.state.quest.id,
        undefined,
        QuestApplicationStatus.APPLICATION_APPLIED,
        firstTeam.id,
        "team-a"
      ),
      application(
        selection.state.quest.id,
        undefined,
        QuestApplicationStatus.APPLICATION_APPLIED,
        secondTeam.id,
        "team-b"
      )
    );
  }

  const single = byId.get("single-candidate-demo");
  if (single) {
    single.state.applications.push(
      application(single.state.quest.id, "single-applicant-a"),
      application(single.state.quest.id, "single-applicant-b"),
      application(single.state.quest.id, "single-applicant-c")
    );
  }

  const partial = byId.get("partial-group-start-demo");
  if (partial) {
    partial.state.assignments.push(
      assignment(
        partial.state.quest,
        DEFAULT_PROTOTYPE_VIEWER_ID,
        "DIRECT_JOIN"
      ),
      assignment(
        partial.state.quest,
        "demo-worker-2",
        "DIRECT_JOIN",
        QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
        "demo-worker-2"
      )
    );
    ensureConversation(partial.state, [
      partial.state.quest.hirerId,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      "demo-worker-2",
    ]);
    // The hidden demo enters at the fixture clock so its five-minute window is immediately visible.
    openPartialStartConsent(partial.state, PROTOTYPE_NOW);
  }

  // Keep the generated scenario records in the same seed list as ordinary fixtures.
  void seeds;
}

function seedStates(): FixtureSeed[] {
  const statuses: Record<string, QuestStatusValue> = {
    "move-boxes": QuestStatus.QUEST_OPEN,
    "clean-fan": QuestStatus.QUEST_OPEN,
    "print-documents": QuestStatus.QUEST_OPEN,
    "buy-lunch": QuestStatus.QUEST_ASSIGNED,
    "run-together": QuestStatus.QUEST_OPEN,
    "move-club-equipment": QuestStatus.QUEST_REWORK,
    "print-event-posters": QuestStatus.QUEST_SUBMITTED,
    "clean-study-table": QuestStatus.QUEST_COMPLETED,
    "clean-bike": QuestStatus.QUEST_CANCELLED,
    "clean-fridge": QuestStatus.QUEST_DISPUTED,
    "walk-together": QuestStatus.QUEST_AWAITING_EDIT_CONSENT,
    "play-badminton": QuestStatus.QUEST_OPEN,
  };
  const seeds = questFixtures.map((fixture) => ({
    state: createState(fixture, statuses[fixture.id] ?? QuestStatus.QUEST_OPEN),
    conversationMemberIds: [] as string[],
  }));
  const byId = new Map(seeds.map((seed) => [seed.state.quest.id, seed]));
  const get = (id: string): FixtureSeed => {
    const seed = byId.get(id);
    if (!seed) throw new Error(`Missing fixture ${id}`);
    return seed;
  };

  const moveBoxes = get("move-boxes");
  moveBoxes.state.applications.push(
    application(moveBoxes.state.quest.id, "demo-worker-2")
  );

  const buyLunch = get("buy-lunch");
  const buyLunchApplication = application(
    buyLunch.state.quest.id,
    DEFAULT_PROTOTYPE_VIEWER_ID,
    QuestApplicationStatus.APPLICATION_SELECTED
  );
  buyLunch.state.applications.push(buyLunchApplication);
  buyLunch.state.assignments.push(
    assignment(
      buyLunch.state.quest,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      "APPLICATION",
      QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      buyLunchApplication.id
    )
  );
  ensureConversation(buyLunch.state, [
    buyLunch.state.quest.hirerId,
    DEFAULT_PROTOTYPE_VIEWER_ID,
  ]);

  const submitted = get("print-event-posters");
  const submittedApplication = application(
    submitted.state.quest.id,
    "demo-worker-3",
    QuestApplicationStatus.APPLICATION_SELECTED
  );
  submitted.state.applications.push(submittedApplication);
  submitted.state.assignments.push(
    assignment(
      submitted.state.quest,
      "demo-worker-3",
      "APPLICATION",
      QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
      "demo-worker-3",
      submittedApplication.id
    )
  );
  submitted.state.proofs.push(
    proof(
      submitted.state.quest,
      "demo-worker-3",
      QuestProofStatus.PROOF_PENDING
    )
  );
  ensureConversation(submitted.state, [
    submitted.state.quest.hirerId,
    "demo-worker-3",
  ]);

  const rework = get("move-club-equipment");
  const reworkTeam = makeTeam(
    rework.state.quest,
    "demo-worker-3",
    [
      {
        workerId: "demo-worker-3",
        role: "LEADER",
        displayName: "Demo Worker 3",
      },
    ],
    QuestTeamStatus.TEAM_SELECTED,
    "rework"
  );
  rework.state.teams.push(reworkTeam);
  const reworkApplication = application(
    rework.state.quest.id,
    undefined,
    QuestApplicationStatus.APPLICATION_SELECTED,
    reworkTeam.id,
    "rework-team"
  );
  rework.state.applications.push(reworkApplication);
  rework.state.assignments.push(
    assignment(
      rework.state.quest,
      "demo-worker-3",
      "TEAM",
      QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
      "demo-worker-3",
      reworkApplication.id,
      reworkTeam.id
    )
  );
  rework.state.proofs.push(
    proof(
      rework.state.quest,
      reworkTeam.id,
      QuestProofStatus.PROOF_REJECTED,
      1,
      "Please include all equipment in one clear set of photos.",
      reworkTeam.id
    )
  );
  ensureConversation(rework.state, [
    rework.state.quest.hirerId,
    "demo-worker-3",
  ]);

  const completed = get("clean-study-table");
  completed.state.assignments.push(
    assignment(
      completed.state.quest,
      "demo-worker-3",
      "DIRECT_JOIN",
      QuestAssignmentStatus.ASSIGNMENT_COMPLETED
    )
  );
  completed.state.proofs.push(
    proof(
      completed.state.quest,
      "demo-worker-3",
      QuestProofStatus.PROOF_APPROVED
    )
  );
  ensureConversation(completed.state, [
    completed.state.quest.hirerId,
    "demo-worker-3",
  ]);

  const cancelled = get("clean-bike");
  cancelled.state.assignments.push(
    assignment(
      cancelled.state.quest,
      "demo-worker-3",
      "APPLICATION",
      QuestAssignmentStatus.ASSIGNMENT_CANCELLED
    )
  );
  ensureConversation(cancelled.state, [
    cancelled.state.quest.hirerId,
    "demo-worker-3",
  ]);

  const disputed = get("clean-fridge");
  const disputedApplication = application(
    disputed.state.quest.id,
    "demo-worker-3",
    QuestApplicationStatus.APPLICATION_SELECTED
  );
  disputed.state.applications.push(disputedApplication);
  disputed.state.assignments.push(
    assignment(
      disputed.state.quest,
      "demo-worker-3",
      "APPLICATION",
      QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
      "demo-worker-3",
      disputedApplication.id
    )
  );
  disputed.state.proofs.push(
    proof(
      disputed.state.quest,
      "demo-worker-3",
      QuestProofStatus.PROOF_REJECTED,
      DEFAULT_REWORK_LIMIT,
      "The submitted proof did not show the completed Quest."
    )
  );
  ensureConversation(disputed.state, [
    disputed.state.quest.hirerId,
    "demo-worker-3",
  ]);

  const consent = get("walk-together");
  consent.state.assignments.push(
    assignment(consent.state.quest, DEFAULT_PROTOTYPE_VIEWER_ID, "DIRECT_JOIN")
  );
  consent.state.assignments.push(
    assignment(
      consent.state.quest,
      "demo-worker-2",
      "DIRECT_JOIN",
      QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
      "demo-worker-2"
    )
  );
  consent.state.editConsent = {
    id: "fixture-edit-consent-walk-together",
    questId: consent.state.quest.id,
    previousStatus: QuestStatus.QUEST_IN_PROGRESS,
    status: QuestEditRequestStatus.EDIT_REQUEST_PENDING,
    requestedChanges: {
      description:
        "Take a relaxed walk around campus before sunset. Meet at the library entrance.",
      location: { label: "University Library entrance" },
    },
    requestedAt: PROTOTYPE_NOW,
    responseDeadlineAt: addMilliseconds(PROTOTYPE_NOW, EDIT_CONSENT_WINDOW_MS),
    requiredWorkerCount: 2,
    approvedWorkerCount: 0,
    responses: [],
  };
  ensureConversation(consent.state, [
    consent.state.quest.hirerId,
    DEFAULT_PROTOTYPE_VIEWER_ID,
    "demo-worker-2",
  ]);

  const teamQuest = get("play-badminton");
  const members: QuestTeamMember[] = [
    {
      workerId: DEFAULT_PROTOTYPE_VIEWER_ID,
      role: "LEADER",
      displayName: "Demo Student",
    },
    { workerId: "demo-worker-2", role: "MEMBER", displayName: "Demo Worker 2" },
    { workerId: "demo-worker-3", role: "MEMBER", displayName: "Demo Worker 3" },
  ];
  const submittedTeam = makeTeam(
    teamQuest.state.quest,
    DEFAULT_PROTOTYPE_VIEWER_ID,
    members,
    QuestTeamStatus.TEAM_SUBMITTED,
    "badminton"
  );
  teamQuest.state.teams.push(submittedTeam);
  teamQuest.state.applications.push(
    application(
      teamQuest.state.quest.id,
      undefined,
      QuestApplicationStatus.APPLICATION_APPLIED,
      submittedTeam.id,
      "team"
    )
  );

  addScenarioStates(seeds, byId);

  // Proof/completion fixtures are intentionally adapter-only records. They are
  // not discovery fixtures, but keep the existing prototype proof transitions
  // reachable by route/tests.
  const proofFixture: QuestBoardQuest = {
    id: "proof-in-progress-demo",
    title: "Submit a project proof",
    tags: ["design"],
    description: "Upload proof for a completed design task.",
    completionCriteria: "The final design is uploaded for review.",
    proofRequired: "required",
    rewardPerPerson: 350,
    rewardSatang: 35000,
    headcount: 1,
    acceptedParticipants: 1,
    startDate: "2026-08-11",
    deadline: "2026-08-15",
    timeRange: "09:00–12:00",
    postedAt: PROTOTYPE_NOW,
    location: "Online",
    locationMode: "online",
    participationMode: "single",
    candidateMode: "NO_CANDIDATE",
    creator: { name: "Demo Hirer" },
    imageUris: [],
    studentInterestMatch: false,
    ownerStudentId: "demo-hirer",
  };
  const proofState = createState(proofFixture, QuestStatus.QUEST_IN_PROGRESS);
  proofState.assignments.push(
    assignment(proofState.quest, DEFAULT_PROTOTYPE_VIEWER_ID, "DIRECT_JOIN")
  );
  ensureConversation(proofState, [
    proofState.quest.hirerId,
    DEFAULT_PROTOTYPE_VIEWER_ID,
  ]);
  seeds.push({
    state: proofState,
    conversationMemberIds: [...(proofState.conversationMemberIds ?? [])],
  });

  const proofFreeFixture: QuestBoardQuest = {
    ...proofFixture,
    id: "proof-free-in-progress-demo",
    title: "Confirm a proof-free Quest",
    proofRequired: "none",
    rewardPerPerson: 100,
    rewardSatang: 10000,
  };
  const proofFreeState = createState(
    proofFreeFixture,
    QuestStatus.QUEST_IN_PROGRESS
  );
  proofFreeState.assignments.push(
    assignment(proofFreeState.quest, DEFAULT_PROTOTYPE_VIEWER_ID, "DIRECT_JOIN")
  );
  ensureConversation(proofFreeState, [
    proofFreeState.quest.hirerId,
    DEFAULT_PROTOTYPE_VIEWER_ID,
  ]);
  seeds.push({
    state: proofFreeState,
    conversationMemberIds: [...(proofFreeState.conversationMemberIds ?? [])],
  });

  const workerPendingFixture: QuestBoardQuest = {
    ...questFixtures.find((fixture) => fixture.id === "team-forming-demo")!,
    id: "worker-pending-demo",
    title: "Join a campus event team",
  };
  const workerPendingState = createState(
    workerPendingFixture,
    QuestStatus.QUEST_OPEN
  );
  workerPendingState.applications.push(
    application(workerPendingState.quest.id, DEFAULT_PROTOTYPE_VIEWER_ID)
  );
  seeds.push({ state: workerPendingState, conversationMemberIds: [] });

  const workerHistoryFixture: QuestBoardQuest = {
    ...proofFreeFixture,
    id: "worker-history-demo",
    title: "Review a completed project",
  };
  const workerHistoryState = createState(
    workerHistoryFixture,
    QuestStatus.QUEST_COMPLETED
  );
  workerHistoryState.assignments.push(
    assignment(
      workerHistoryState.quest,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      "DIRECT_JOIN",
      QuestAssignmentStatus.ASSIGNMENT_COMPLETED
    )
  );
  workerHistoryState.proofs.push(
    proof(
      workerHistoryState.quest,
      DEFAULT_PROTOTYPE_VIEWER_ID,
      QuestProofStatus.PROOF_APPROVED
    )
  );
  ensureConversation(workerHistoryState, [
    workerHistoryState.quest.hirerId,
    DEFAULT_PROTOTYPE_VIEWER_ID,
  ]);
  seeds.push({
    state: workerHistoryState,
    conversationMemberIds: [
      ...(workerHistoryState.conversationMemberIds ?? []),
    ],
  });

  return seeds;
}

function normalizeStateShape(value: QuestDetailState): QuestDetailState {
  const state = value;
  if (!Array.isArray(state.teams)) state.teams = state.team ? [state.team] : [];
  if (!Array.isArray(state.invitations)) state.invitations = [];
  if (!Array.isArray(state.applications)) state.applications = [];
  if (!Array.isArray(state.assignments)) state.assignments = [];
  if (!Array.isArray(state.proofs)) state.proofs = [];
  if (!Array.isArray(state.conversationMemberIds))
    state.conversationMemberIds = [];
  if (state.actualHeadcount === undefined)
    state.actualHeadcount = countAdmitted(state);
  if (!state.capabilities) state.capabilities = blankCapabilities();
  if (!state.conversation)
    state.conversation = {
      conversationId: null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "NOT_STARTED",
    };
  return state;
}

function countAdmitted(state: QuestDetailState): number {
  return state.assignments.filter(
    (item) => item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
  ).length;
}

function activeAssignments(state: QuestDetailState): QuestAssignment[] {
  return state.assignments.filter(
    (item) => item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function setActualHeadcount(
  state: QuestDetailState,
  count = countAdmitted(state)
): void {
  state.actualHeadcount = Math.max(0, count);
}

function settlementFor(
  state: QuestDetailState,
  actualHeadcount: number,
  fullRefund = false
): QuestSettlementSummary {
  const requestedHeadcount = state.quest.headcount;
  const rewardSatangPerWorker = state.quest.reward.rewardSatang;
  const reservedRewardSatang =
    rewardSatangPerWorker * Math.max(0, requestedHeadcount);
  const settledRewardSatang = fullRefund
    ? 0
    : rewardSatangPerWorker * Math.max(0, actualHeadcount);
  const refundSatang = fullRefund
    ? reservedRewardSatang
    : rewardSatangPerWorker * Math.max(0, requestedHeadcount - actualHeadcount);
  return {
    requestedHeadcount,
    actualHeadcount: Math.max(0, actualHeadcount),
    rewardSatangPerWorker,
    reservedRewardSatang,
    settledRewardSatang,
    refundSatang,
    fullRefund,
  };
}

function makeReadOnly(state: QuestDetailState): void {
  if (!state.conversation.conversationId) return;
  state.conversation = {
    ...state.conversation,
    canRead: true,
    canWrite: false,
    readOnly: true,
    readOnlyReason: "TERMINAL",
  };
}

function cancelBeforeStart(
  state: QuestDetailState,
  removeAssignments = true
): void {
  state.quest.status = QuestStatus.QUEST_CANCELLED;
  if (removeAssignments) state.assignments = [];
  else
    state.assignments.forEach((item) => {
      if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
        item.status = QuestAssignmentStatus.ASSIGNMENT_CANCELLED;
    });
  setActualHeadcount(state, 0);
  state.settlement = settlementFor(state, 0, true);
  if (
    state.partialStartConsent?.status ===
    QuestPartialStartConsentStatus.PARTIAL_START_PENDING
  ) {
    state.partialStartConsent.status =
      QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT;
  }
  makeReadOnly(state);
}

function transitionToInProgress(state: QuestDetailState): void {
  if (countAdmitted(state) === 0) {
    cancelBeforeStart(state);
    return;
  }
  state.quest.status = QuestStatus.QUEST_IN_PROGRESS;
  setActualHeadcount(state);
  state.settlement = settlementFor(
    state,
    state.actualHeadcount ?? countAdmitted(state)
  );
  activeAssignments(state).forEach((item) => {
    item.startedAt = item.startedAt ?? state.quest.startAt;
  });
}

function ensureConversation(
  state: QuestDetailState,
  memberIds: string[]
): void {
  // IDs come from the fixture's server-shaped conversation seed. The
  // deterministic fallback is used only by custom adapter states that provide
  // no conversation id of their own.
  const conversationId =
    state.conversation.conversationId ?? questConversationId(state.quest.id);
  state.conversation = {
    conversationId,
    canRead: true,
    canWrite: true,
    readOnly: false,
  };
  state.conversationMemberIds = unique([
    ...(state.conversationMemberIds ?? []),
    ...memberIds,
  ]);
}

function normalizeInvitationStatuses(state: QuestDetailState, now: Date): void {
  const nowMs = now.getTime();
  state.invitations.forEach((invitation) => {
    if (invitation.status !== QuestInvitationStatus.INVITATION_PENDING) return;
    const expiry = new Date(invitation.expiresAt).getTime();
    if (Number.isFinite(expiry) && nowMs >= expiry)
      invitation.status = QuestInvitationStatus.INVITATION_EXPIRED;
  });
}

function openPartialStartConsent(
  state: QuestDetailState,
  requestedAt = state.quest.startAt
): void {
  const frozenWorkerIds = unique(
    state.assignments
      .filter(
        (item) => item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
      )
      .map((item) => item.workerId)
  );
  if (
    frozenWorkerIds.length === 0 ||
    frozenWorkerIds.length >= state.quest.headcount
  ) {
    if (frozenWorkerIds.length === 0) cancelBeforeStart(state);
    else transitionToInProgress(state);
    return;
  }
  state.actualHeadcount = frozenWorkerIds.length;
  state.quest.status = QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT;
  state.partialStartConsent = {
    id: `fixture-partial-start-consent-${state.quest.id}`,
    questId: state.quest.id,
    status: QuestPartialStartConsentStatus.PARTIAL_START_PENDING,
    requestedAt,
    responseDeadlineAt: addMilliseconds(
      requestedAt,
      PARTIAL_GROUP_START_CONSENT_WINDOW_MS
    ),
    requiredVoterIds: [state.quest.hirerId, ...frozenWorkerIds],
    frozenWorkerIds,
    approvedVoterCount: 0,
    responses: [],
  };
}

function cancelPartialStart(
  state: QuestDetailState,
  status: QuestPartialStartConsentStatus
): void {
  if (state.partialStartConsent) state.partialStartConsent.status = status;
  state.assignments = [];
  state.quest.status = QuestStatus.QUEST_CANCELLED;
  setActualHeadcount(state, 0);
  state.settlement = settlementFor(state, 0, true);
  makeReadOnly(state);
}

function applyEditChanges(
  state: QuestDetailState,
  changes: QuestEditConsent["requestedChanges"]
): void {
  if (changes.description !== undefined)
    state.quest.description = changes.description;
  if (changes.completionCriteria !== undefined)
    state.quest.completionCriteria = changes.completionCriteria;
  if (changes.startAt !== undefined) state.quest.startAt = changes.startAt;
  if (changes.endAt !== undefined) state.quest.endAt = changes.endAt;
  if (changes.deadlineAt !== undefined)
    state.quest.deadlineAt = changes.deadlineAt;
  if (changes.location !== undefined) state.quest.location = changes.location;
  if (changes.imageUris !== undefined)
    state.quest.imageUris = [...changes.imageUris].slice(0, 3);
}

/**
 * Apply clock-driven effects to a clone. The stored fixture is never changed by
 * a read at another clock value.
 */
function projectLifecycle(state: QuestDetailState, now: Date): void {
  normalizeInvitationStatuses(state, now);

  // Older fixture data used one umbrella status. Keep it readable, but project
  // edit requests into their canonical state before applying clock effects.
  if (state.quest.status === QuestStatus.QUEST_AWAITING_CONSENT) {
    state.quest.status =
      state.editConsent?.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING
        ? QuestStatus.QUEST_AWAITING_EDIT_CONSENT
        : QuestStatus.QUEST_OPEN;
  }

  const editConsent = state.editConsent;
  const editDeadline = editConsent
    ? new Date(editConsent.responseDeadlineAt).getTime()
    : Number.NaN;
  if (
    editConsent?.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING &&
    Number.isFinite(editDeadline) &&
    now.getTime() >= editDeadline
  ) {
    editConsent.status = QuestEditRequestStatus.EDIT_REQUEST_REJECTED;
    state.quest.status = editConsent.previousStatus;
  }

  const partialConsent = state.partialStartConsent;
  const partialDeadline = partialConsent
    ? new Date(partialConsent.responseDeadlineAt).getTime()
    : Number.NaN;
  if (
    state.quest.status ===
      QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT &&
    partialConsent?.status ===
      QuestPartialStartConsentStatus.PARTIAL_START_PENDING
  ) {
    if (Number.isFinite(partialDeadline) && now.getTime() >= partialDeadline) {
      cancelPartialStart(
        state,
        QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
      );
    }
    return;
  }

  const startAt = new Date(state.quest.startAt).getTime();
  if (!Number.isFinite(startAt) || now.getTime() < startAt) return;

  if (state.quest.status === QuestStatus.QUEST_ASSIGNED) {
    transitionToInProgress(state);
    return;
  }

  if (state.quest.status !== QuestStatus.QUEST_OPEN) return;

  const admitted = countAdmitted(state);
  if (
    state.quest.participation === QuestParticipation.GROUP &&
    state.quest.candidateMode === QuestCandidateMode.NO_CANDIDATE
  ) {
    if (admitted === 0) cancelBeforeStart(state);
    else if (admitted >= state.quest.headcount) transitionToInProgress(state);
    else {
      openPartialStartConsent(state);
      const openedConsent = state.partialStartConsent;
      if (
        openedConsent?.status ===
          QuestPartialStartConsentStatus.PARTIAL_START_PENDING &&
        now.getTime() >= new Date(openedConsent.responseDeadlineAt).getTime()
      ) {
        cancelPartialStart(
          state,
          QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        );
      }
    }
    return;
  }

  // An unselected Candidate (individual or team) cannot silently start.
  if (admitted === 0) cancelBeforeStart(state);
  else transitionToInProgress(state);
}

function projectedState(state: QuestDetailState, now: Date): QuestDetailState {
  const result = normalizeStateShape(clone(state));
  projectLifecycle(result, now);
  return result;
}

function teamForId(
  state: QuestDetailState,
  teamId: string | undefined
): QuestTeam | undefined {
  return teamId ? state.teams.find((item) => item.id === teamId) : undefined;
}

function teamForViewer(
  state: QuestDetailState,
  viewerId: string
): QuestTeam | undefined {
  return (
    state.teams.find(
      (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
    ) ??
    state.teams.find((teamItem) =>
      teamItem.members.some((member) => member.workerId === viewerId)
    )
  );
}

function syncLegacyTeamProjection(
  state: QuestDetailState,
  viewerId: string
): void {
  const selected = state.teams.find(
    (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
  );
  const own = state.teams.find((teamItem) =>
    teamItem.members.some((member) => member.workerId === viewerId)
  );
  const first = state.teams[0];
  state.team = selected ?? own ?? first;
}

function hasActiveAssignment(
  state: QuestDetailState,
  workerId: string
): boolean {
  return state.assignments.some(
    (item) =>
      item.workerId === workerId &&
      item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
  );
}

function hasAssignment(state: QuestDetailState, workerId: string): boolean {
  return state.assignments.some(
    (item) =>
      item.workerId === workerId &&
      item.status !== QuestAssignmentStatus.ASSIGNMENT_CANCELLED
  );
}

function isTeamMember(state: QuestDetailState, workerId: string): boolean {
  return state.teams.some((teamItem) =>
    teamItem.members.some((member) => member.workerId === workerId)
  );
}

function isPendingInvitation(
  state: QuestDetailState,
  workerId: string
): boolean {
  return state.invitations.some(
    (item) =>
      item.invitedWorkerId === workerId &&
      item.status === QuestInvitationStatus.INVITATION_PENDING
  );
}

function isTeamParticipant(state: QuestDetailState, workerId: string): boolean {
  return isTeamMember(state, workerId) || isPendingInvitation(state, workerId);
}

function isTerminal(status: QuestStatusValue): boolean {
  return (
    status === QuestStatus.QUEST_COMPLETED ||
    status === QuestStatus.QUEST_CANCELLED
  );
}

function conversationFor(
  state: QuestDetailState,
  viewerId: string
): WorkConversationCapability {
  const conversationId = state.conversation.conversationId;
  const isMember = Boolean(
    conversationId &&
    (state.conversationMemberIds
      ? state.conversationMemberIds.includes(viewerId)
      : state.conversation.canRead)
  );
  if (!conversationId || !isMember) {
    return {
      conversationId: conversationId ?? null,
      canRead: false,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "NOT_A_MEMBER",
    };
  }
  if (
    state.conversation.readOnly &&
    state.conversation.canRead &&
    !state.conversation.canWrite
  ) {
    return { ...state.conversation, conversationId };
  }
  if (isTerminal(state.quest.status)) {
    return {
      conversationId,
      canRead: true,
      canWrite: false,
      readOnly: true,
      readOnlyReason: "TERMINAL",
    };
  }
  return { conversationId, canRead: true, canWrite: true, readOnly: false };
}

function hydrateChatSeed(seed: FixtureChatSeed): FixtureChatConversation {
  return {
    id: seed.id,
    questId: seed.questId,
    memberIds: unique(seed.memberIds),
    questTitle: clone(seed.questTitle),
    participantName: seed.participantName,
    participantRole: seed.participantRole,
    initials: seed.initials,
    avatarColor: seed.avatarColor,
    messages: seed.messages.map((message) => ({
      ...message,
      sentAt: message.sentAt ?? chatSentAt(message.minutesAgo),
    })),
    readAt: { ...(seed.readAt ?? {}) },
  };
}

function projectChatMessage(
  message: FixtureChatMessage,
  viewerId: string
): ChatMessage {
  return {
    id: message.id,
    sender: message.senderId === viewerId ? "me" : "other",
    time: message.time,
    ...(message.text ? { text: clone(message.text) } : {}),
    ...(message.attachment ? { attachment: clone(message.attachment) } : {}),
  };
}

function latestChatMessage(
  conversation: FixtureChatConversation
): FixtureChatMessage | undefined {
  return conversation.messages.reduce<FixtureChatMessage | undefined>(
    (latest, message) => {
      if (!latest) return message;
      return new Date(message.sentAt).getTime() >=
        new Date(latest.sentAt).getTime()
        ? message
        : latest;
    },
    undefined
  );
}

function chatUnreadCount(
  conversation: FixtureChatConversation,
  viewerId: string
): number {
  const readAt = conversation.readAt[viewerId];
  const readAtMs = readAt
    ? new Date(readAt).getTime()
    : Number.NEGATIVE_INFINITY;
  return conversation.messages.filter(
    (message) =>
      message.senderId !== viewerId &&
      Number.isFinite(new Date(message.sentAt).getTime()) &&
      new Date(message.sentAt).getTime() > readAtMs
  ).length;
}

function projectChatConversation(
  conversation: FixtureChatConversation,
  viewerId: string,
  capability: WorkConversationCapability,
  state?: QuestDetailState
): ChatConversation {
  const latest = latestChatMessage(conversation);
  const latestMessage = latest?.text
    ? clone(latest.text)
    : {
        en: latest?.attachment?.name ?? "",
        th: latest?.attachment?.name ?? "",
      };
  return {
    id: conversation.id,
    ...(conversation.questId ? { questId: conversation.questId } : {}),
    ...(state ? { status: state.quest.status } : {}),
    capability: clone(capability),
    questTitle: clone(conversation.questTitle),
    participantName: conversation.participantName,
    participantRole: conversation.participantRole,
    initials: conversation.initials,
    avatarColor: conversation.avatarColor,
    latestMessage,
    latestTime: latest?.time ?? "Now",
    unreadCount: chatUnreadCount(conversation, viewerId),
    messages: conversation.messages
      .slice()
      .sort(
        (left, right) =>
          new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime()
      )
      .map((message) => projectChatMessage(message, viewerId)),
  };
}

function eligibleCandidateApplications(
  state: QuestDetailState
): QuestApplication[] {
  return state.applications.filter((item) => {
    if (item.status !== QuestApplicationStatus.APPLICATION_APPLIED)
      return false;
    if (state.quest.participation === QuestParticipation.SINGLE)
      return Boolean(item.applicantId) && !item.teamId;
    const candidateTeam = teamForId(state, item.teamId);
    return Boolean(
      item.teamId && candidateTeam?.status === QuestTeamStatus.TEAM_SUBMITTED
    );
  });
}

function actionForViewer(
  state: QuestDetailState,
  viewerId: string
): QuestAction[] {
  const actions: QuestAction[] = [];
  const quest = state.quest;
  const isHirer = viewerId === quest.hirerId;
  const active = hasActiveAssignment(state, viewerId);
  const ownTeam = teamForViewer(state, viewerId);
  const pendingInvitation = isPendingInvitation(state, viewerId);
  const full = countAdmitted(state) >= quest.headcount;
  const ownPendingApplication = state.applications.some(
    (item) =>
      item.applicantId === viewerId &&
      item.status === QuestApplicationStatus.APPLICATION_APPLIED
  );
  const ownRejectedApplication = state.applications.some(
    (item) =>
      item.applicantId === viewerId &&
      item.status === QuestApplicationStatus.APPLICATION_REJECTED
  );

  if (quest.status === QuestStatus.QUEST_DRAFT && isHirer)
    actions.push("PUBLISH");
  if (quest.status === QuestStatus.QUEST_OPEN && !isHirer) {
    if (
      quest.candidateMode === QuestCandidateMode.NO_CANDIDATE &&
      !full &&
      !hasAssignment(state, viewerId)
    )
      actions.push("DIRECT_JOIN");
    if (
      quest.candidateMode === QuestCandidateMode.CANDIDATE &&
      quest.participation === QuestParticipation.SINGLE &&
      !ownPendingApplication &&
      !ownRejectedApplication &&
      !hasAssignment(state, viewerId)
    )
      actions.push("APPLY");
    if (
      quest.candidateMode === QuestCandidateMode.CANDIDATE &&
      quest.participation === QuestParticipation.GROUP &&
      !isTeamParticipant(state, viewerId)
    )
      actions.push("CREATE_TEAM");
  }
  if (
    ownTeam?.leaderId === viewerId &&
    ownTeam.status === QuestTeamStatus.TEAM_FORMING
  ) {
    actions.push("INVITE_WORKER");
    if (ownTeam.members.length > 0) actions.push("SUBMIT_TEAM");
  }
  if (pendingInvitation) actions.push("RESPOND_INVITATION");
  const eligibleProposals = eligibleCandidateApplications(state);
  if (isHirer && eligibleProposals.length > 0) {
    actions.push("SELECT_CANDIDATE");
    if (quest.status === QuestStatus.QUEST_OPEN) {
      actions.push(
        quest.participation === QuestParticipation.GROUP
          ? "REJECT_TEAM"
          : "REJECT_CANDIDATE"
      );
    }
  }
  if (
    isHirer &&
    (
      [
        QuestStatus.QUEST_ASSIGNED,
        QuestStatus.QUEST_IN_PROGRESS,
      ] as QuestStatusValue[]
    ).includes(quest.status) &&
    activeAssignments(state).length > 0
  )
    actions.push("REQUEST_EDIT");

  const editConsent = state.editConsent;
  if (
    active &&
    quest.status === QuestStatus.QUEST_AWAITING_EDIT_CONSENT &&
    editConsent?.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING &&
    !editConsent.responses.some((response) => response.workerId === viewerId)
  )
    actions.push("VOTE_EDIT_CONSENT");

  const partialConsent = state.partialStartConsent;
  if (
    partialConsent?.status ===
      QuestPartialStartConsentStatus.PARTIAL_START_PENDING &&
    partialConsent.requiredVoterIds.includes(viewerId) &&
    !partialConsent.responses.some((response) => response.voterId === viewerId)
  )
    actions.push("VOTE_PARTIAL_GROUP_START_CONSENT");

  if (
    active &&
    quest.status === QuestStatus.QUEST_IN_PROGRESS &&
    quest.proofRequired !== "none"
  )
    actions.push("SUBMIT_PROOF");
  if (
    active &&
    quest.status === QuestStatus.QUEST_IN_PROGRESS &&
    quest.proofRequired === "none"
  )
    actions.push("CONFIRM_COMPLETION");
  if (active && quest.status === QuestStatus.QUEST_REWORK)
    actions.push("REWORK_PROOF");
  if (
    isHirer &&
    quest.status === QuestStatus.QUEST_SUBMITTED &&
    state.proofs.some((item) => item.status === QuestProofStatus.PROOF_PENDING)
  )
    actions.push("REVIEW_PROOF");
  if (
    !isTerminal(quest.status) &&
    (active || (isHirer && activeAssignments(state).length > 0))
  )
    actions.push("OPEN_DISPUTE");
  if (
    quest.status === QuestStatus.QUEST_DISPUTED &&
    (isHirer || viewerId === "admin-demo")
  )
    actions.push("RESOLVE_DISPUTE");
  if (isHirer && quest.status === QuestStatus.QUEST_APPROVED)
    actions.push("COMPLETE");
  if (
    isHirer &&
    (
      [
        QuestStatus.QUEST_OPEN,
        QuestStatus.QUEST_ASSIGNED,
        QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT,
        QuestStatus.QUEST_AWAITING_EDIT_CONSENT,
        QuestStatus.QUEST_IN_PROGRESS,
      ] as QuestStatusValue[]
    ).includes(quest.status)
  )
    actions.push("CANCEL");

  const conversation = conversationFor(state, viewerId);
  state.conversation = conversation;
  state.capabilities = {
    availableActions: [...new Set(actions)],
    canReadConversation: conversation.canRead,
    canWriteConversation: conversation.canWrite,
  };
  return state.capabilities.availableActions;
}

function stateForViewer(
  state: QuestDetailState,
  viewerId: string,
  now: Date
): QuestDetailState {
  const result = projectedState(state, now);
  if (
    viewerId === result.quest.hirerId &&
    result.quest.participation === QuestParticipation.GROUP &&
    result.quest.candidateMode === QuestCandidateMode.CANDIDATE
  ) {
    // A forming team is still available to its members, but is not a Hirer-selectable proposal.
    result.applications = result.applications.filter((item) => {
      if (!item.teamId) return false;
      const candidateTeam = teamForId(result, item.teamId);
      return (
        candidateTeam?.status === QuestTeamStatus.TEAM_SUBMITTED ||
        candidateTeam?.status === QuestTeamStatus.TEAM_SELECTED ||
        candidateTeam?.status === QuestTeamStatus.TEAM_REJECTED
      );
    });
  }
  syncLegacyTeamProjection(result, viewerId);
  actionForViewer(result, viewerId);
  if (result.quest.status === QuestStatus.QUEST_DRAFT)
    result.publishCheck = calculatePublishCheck(
      result.quest,
      DEFAULT_PLATFORM_FEE_BASIS_POINTS
    );
  return result;
}

export function calculateEscrow(
  rewardSatang: number,
  headcount: number,
  feeRateBasisPoints = DEFAULT_PLATFORM_FEE_BASIS_POINTS
): QuestEscrowSummary {
  const validReward = isValidSatang(rewardSatang) ? rewardSatang : 0;
  const validHeadcount =
    Number.isSafeInteger(headcount) && headcount > 0 ? headcount : 0;
  const perWorkerFee = Math.ceil((validReward * feeRateBasisPoints) / 10000);
  const rewardPool = validReward * validHeadcount;
  const platformFee = perWorkerFee * validHeadcount;
  return {
    rewardPoolSatang: rewardPool,
    platformFeeSatang: platformFee,
    totalRequiredSatang: rewardPool + platformFee,
    headcount: validHeadcount,
    rewardSatangPerWorker: validReward,
    platformFeeSatangPerWorker: perWorkerFee,
    feeRateBasisPoints,
  };
}

export function calculatePublishCheck(
  quest: QuestContract,
  feeRateBasisPoints: number
): QuestPublishCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!quest.title.trim()) blockers.push("TITLE_REQUIRED");
  if (!quest.description.trim()) blockers.push("DESCRIPTION_REQUIRED");
  if (!quest.completionCriteria.trim())
    blockers.push("COMPLETION_CRITERIA_REQUIRED");
  if (!quest.startAt) blockers.push("START_REQUIRED");
  if (!quest.deadlineAt) blockers.push("DEADLINE_REQUIRED");
  if (!isValidSatang(quest.reward.rewardSatang))
    blockers.push("REWARD_INVALID");
  if (
    quest.participation === QuestParticipation.SINGLE &&
    quest.headcount !== 1
  )
    blockers.push("SINGLE_HEADCOUNT_MUST_BE_ONE");
  if (
    quest.participation === QuestParticipation.GROUP &&
    (!Number.isSafeInteger(quest.headcount) || quest.headcount < 1)
  )
    blockers.push("HEADCOUNT_INVALID");
  if (quest.imageUris.length === 0) warnings.push("NO_IMAGES");
  return {
    canPublish: blockers.length === 0,
    blockers,
    warnings,
    escrow: calculateEscrow(
      quest.reward.rewardSatang,
      quest.headcount,
      feeRateBasisPoints
    ),
  };
}

function failure(
  state: QuestDetailState,
  code: QuestFixtureErrorCode,
  message: string,
  viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
  now = new Date(PROTOTYPE_NOW)
): QuestFixtureResult {
  return {
    ok: false,
    state: stateForViewer(state, viewerId, now),
    error: { code, message },
  };
}

function success(
  state: QuestDetailState,
  viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
  now = new Date(PROTOTYPE_NOW)
): QuestFixtureResult {
  return { ok: true, state: stateForViewer(state, viewerId, now) };
}

function currentWithProjection(
  state: QuestDetailState,
  now: Date
): QuestDetailState {
  return projectedState(state, now);
}

function applicationForSelection(
  state: QuestDetailState,
  id: string
): QuestApplication | undefined {
  return (
    state.applications.find(
      (item) =>
        item.id === id &&
        item.status === QuestApplicationStatus.APPLICATION_APPLIED
    ) ??
    state.applications.find(
      (item) =>
        item.teamId === id &&
        item.status === QuestApplicationStatus.APPLICATION_APPLIED
    )
  );
}

function nextApplicationId(
  state: QuestDetailState,
  applicantId: string
): string {
  const prefix = `fixture-application-${state.quest.id}-${applicantId}`;
  const used = new Set(state.applications.map((item) => item.id));
  if (!used.has(prefix)) return prefix;
  let index = 2;
  while (used.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function makeApplicationForApplicant(
  state: QuestDetailState,
  applicantId: string,
  now: Date
): QuestApplication {
  return {
    id: nextApplicationId(state, applicantId),
    questId: state.quest.id,
    applicantId,
    status: QuestApplicationStatus.APPLICATION_APPLIED,
    submittedAt: now.toISOString(),
  };
}

function makeTeamApplication(
  state: QuestDetailState,
  teamId: string,
  now: Date
): QuestApplication {
  return {
    id: `fixture-application-${state.quest.id}-${teamId}`,
    questId: state.quest.id,
    teamId,
    status: QuestApplicationStatus.APPLICATION_APPLIED,
    submittedAt: now.toISOString(),
  };
}

function resolveDateAndString(
  value: string | Date | undefined,
  fallback: Date
): { value?: string; now: Date } {
  if (value instanceof Date) return { now: safeDate(value, fallback) };
  return { value, now: new Date(fallback.getTime()) };
}

export function getConsentRemainingMs(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now = new Date()
): number | null {
  if (!consent) return null;
  const pending =
    "status" in consent
      ? consent.status === QuestEditRequestStatus.EDIT_REQUEST_PENDING ||
        consent.status === QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      : false;
  if (!pending) return null;
  return Math.max(
    0,
    new Date(consent.responseDeadlineAt).getTime() - now.getTime()
  );
}

export function formatConsentCountdown(
  consent: QuestEditConsent | QuestPartialStartConsent | undefined,
  now = new Date()
): string | null {
  const remaining = getConsentRemainingMs(consent, now);
  if (remaining === null) return null;
  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const getPartialStartConsentRemainingMs = getConsentRemainingMs;
export const formatPartialStartConsentCountdown = formatConsentCountdown;

export function getQuestRewardSatang(quest: QuestBoardQuest): number {
  return quest.rewardSatang ?? Math.round(quest.rewardPerPerson * 100);
}

export function toBoardQuest(state: QuestDetailState): QuestBoardQuest {
  const quest = state.quest;
  const start = new Date(quest.startAt);
  const end = new Date(quest.endAt ?? quest.deadlineAt);
  const timeRange =
    Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
      ? undefined
      : `${start.toISOString().slice(11, 16)}–${end.toISOString().slice(11, 16)}`;
  const location: QuestLocation = quest.location;
  const label = location.label ?? "Online";
  return {
    id: quest.id,
    title: quest.title,
    tags: [...quest.tags],
    description: quest.description,
    completionCriteria: quest.completionCriteria,
    proofRequired: quest.proofRequired,
    rewardPerPerson: quest.reward.rewardSatang / 100,
    rewardSatang: quest.reward.rewardSatang,
    headcount: quest.headcount,
    acceptedParticipants: countAdmitted(state),
    startDate: quest.startAt.slice(0, 10),
    deadline: quest.deadlineAt.slice(0, 10),
    timeRange,
    postedAt: quest.postedAt,
    location: label,
    locationDetails: location,
    locationMode: location.label === null ? "online" : "on-campus",
    participationMode:
      quest.participation === QuestParticipation.GROUP ? "team" : "single",
    candidateMode:
      quest.candidateMode === QuestCandidateMode.CANDIDATE
        ? "CANDIDATE"
        : "NO_CANDIDATE",
    creator: { name: quest.hirerId },
    imageUris: [...quest.imageUris],
    studentInterestMatch: false,
    ownerStudentId: quest.hirerId,
    prototypeOnly: state.quest.id.endsWith("-demo"),
    status: quest.status,
    conversation: state.conversation,
  };
}

export function createQuestFixtureAdapter(
  options: QuestFixtureAdapterOptions = {}
): QuestFixtureAdapter {
  const initialSeeds =
    options.states?.map((state) => ({
      state: normalizeStateShape(clone(state)),
      conversationMemberIds: [...(state.conversationMemberIds ?? [])],
    })) ?? seedStates();
  const states = new Map<string, QuestDetailState>();
  initialSeeds.forEach(({ state, conversationMemberIds }) => {
    state.conversationMemberIds = unique([
      ...(state.conversationMemberIds ?? []),
      ...conversationMemberIds,
    ]);
    if (state.assignments.length > 0 && !state.conversation.conversationId)
      ensureConversation(state, conversationMemberIds);
    states.set(state.quest.id, state);
  });
  const baseNow = safeDate(options.now, new Date(PROTOTYPE_NOW));
  const feeRateBasisPoints =
    options.platformFeeBasisPoints ?? DEFAULT_PLATFORM_FEE_BASIS_POINTS;
  const memberDirectory =
    options.memberDirectory?.map((member) => ({
      ...member,
      id: member.id || member.workerId,
      workerId: member.workerId || member.id,
    })) ?? DEFAULT_MEMBER_DIRECTORY;
  const conversations = new Map<string, FixtureChatConversation>(
    FIXTURE_CHAT_SEEDS.map((seed) => [seed.id, hydrateChatSeed(seed)])
  );

  const createChatFromState = (
    state: QuestDetailState
  ): FixtureChatConversation => {
    const conversationId =
      state.conversation.conversationId ?? questConversationId(state.quest.id);
    const isGroup = state.quest.participation === QuestParticipation.GROUP;
    return hydrateChatSeed({
      id: conversationId,
      questId: state.quest.id,
      memberIds: state.conversationMemberIds ?? [],
      questTitle: { en: state.quest.title, th: state.quest.title },
      participantName: isGroup
        ? "Quest team"
        : (questFixtures.find((fixture) => fixture.id === state.quest.id)
            ?.creator.name ?? state.quest.hirerId),
      participantRole: isGroup ? "member" : "owner",
      initials: isGroup ? "QT" : "QO",
      avatarColor: "#EAF6ED",
      messages: [
        {
          id: `${conversationId}-welcome`,
          senderId: state.quest.hirerId,
          text: QUEST_OWNER_GREETING,
          time: "Now",
        },
      ],
    });
  };
  const syncChatForState = (state: QuestDetailState): void => {
    const conversationId = state.conversation.conversationId;
    if (!conversationId) return;
    const conversation =
      conversations.get(conversationId) ?? createChatFromState(state);
    conversation.questId = state.quest.id;
    conversation.memberIds = unique([
      ...(conversation.memberIds ?? []),
      ...(state.conversationMemberIds ?? []),
    ]);
    conversations.set(conversationId, conversation);
  };
  states.forEach(syncChatForState);
  const initialStates = new Map(
    [...states.entries()].map(([id, state]) => [id, clone(state)])
  );
  const initialConversations = new Map(
    [...conversations.entries()].map(([id, conversation]) => [
      id,
      clone(conversation),
    ])
  );
  let createdQuestCounter = 0;
  const nextCreatedQuestId = (): string => {
    let questId = "";
    do {
      createdQuestCounter += 1;
      questId = `created-quest-${createdQuestCounter}`;
    } while (states.has(questId));
    return questId;
  };
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const getInternal = (questId: string): QuestDetailState | null =>
    states.get(questId) ?? null;
  const viewer = (viewerId: string | undefined): string =>
    viewerId?.trim() || DEFAULT_PROTOTYPE_VIEWER_ID;
  const at = (now: Date | undefined): Date => safeDate(now, baseNow);
  const commit = (state: QuestDetailState): void => {
    const normalized = normalizeStateShape(state);
    states.set(normalized.quest.id, normalized);
    syncChatForState(normalized);
    notify();
  };
  const notFound = (): QuestFixtureResult => ({
    ok: false,
    state: createDraftState(),
    error: { code: "NOT_FOUND", message: "Quest not found." },
  });
  type ChatContext = {
    conversation: FixtureChatConversation;
    state?: QuestDetailState;
    capability: WorkConversationCapability;
  };
  const deniedChatCapability = (
    conversationId: string
  ): WorkConversationCapability => ({
    conversationId,
    canRead: false,
    canWrite: false,
    readOnly: true,
    readOnlyReason: "NOT_A_MEMBER",
  });
  const getChatContext = (
    conversationId: string,
    viewerId: string,
    now: Date
  ): ChatContext | undefined => {
    const conversation = conversations.get(conversationId);
    if (!conversation || !conversation.memberIds.includes(viewerId))
      return undefined;
    if (!conversation.questId) {
      return {
        conversation,
        capability: {
          conversationId,
          canRead: true,
          canWrite: true,
          readOnly: false,
        },
      };
    }
    const state = getInternal(conversation.questId);
    if (!state || state.conversation.conversationId !== conversationId)
      return undefined;
    const projected = projectedState(state, now);
    const capability = conversationFor(projected, viewerId);
    if (!capability.canRead) return undefined;
    return { conversation, state, capability };
  };
  const fixtureChatContext = (
    conversation: FixtureChatConversation,
    viewerId: string,
    now: Date
  ): ChatContext => {
    if (!conversation.questId) {
      return {
        conversation,
        capability: {
          conversationId: conversation.id,
          canRead: true,
          canWrite: true,
          readOnly: false,
        },
      };
    }
    const state = getInternal(conversation.questId);
    if (state && state.conversation.conversationId === conversation.id) {
      return {
        conversation,
        state,
        capability: conversationFor(projectedState(state, now), viewerId),
      };
    }
    return {
      conversation,
      capability: conversation.memberIds.includes(viewerId)
        ? {
            conversationId: conversation.id,
            canRead: true,
            canWrite: true,
            readOnly: false,
          }
        : deniedChatCapability(conversation.id),
    };
  };
  const sortedChatConversations = (
    items: ChatConversation[]
  ): ChatConversation[] =>
    items.sort((left, right) => {
      const leftRecord = conversations.get(left.id);
      const rightRecord = conversations.get(right.id);
      const leftTime = leftRecord
        ? new Date(latestChatMessage(leftRecord)?.sentAt ?? "").getTime()
        : Number.NEGATIVE_INFINITY;
      const rightTime = rightRecord
        ? new Date(latestChatMessage(rightRecord)?.sentAt ?? "").getTime()
        : Number.NEGATIVE_INFINITY;
      return rightTime - leftTime || left.id.localeCompare(right.id);
    });

  const adapter: QuestFixtureAdapter = {
    now: new Date(baseNow.getTime()),
    getState: (
      questId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const state = getInternal(questId);
      return state ? stateForViewer(state, viewer(viewerId), at(now)) : null;
    },
    getQuestDetail: (
      questId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.getState(questId, viewerId, now),
    listStates: (viewerId = DEFAULT_PROTOTYPE_VIEWER_ID, now = baseNow) =>
      [...states.values()].map((state) =>
        stateForViewer(state, viewer(viewerId), at(now))
      ),
    listBoardQuests: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const currentTime = at(now);
      return [...states.values()]
        .map((state) => stateForViewer(state, currentViewer, currentTime))
        .filter(
          (state) =>
            state.quest.status === QuestStatus.QUEST_OPEN &&
            state.quest.hirerId !== currentViewer
        )
        .filter((state) => !state.quest.id.endsWith("-demo"))
        .filter(
          (state) =>
            !state.applications.some(
              (item) =>
                item.applicantId === currentViewer &&
                item.status === QuestApplicationStatus.APPLICATION_APPLIED
            )
        )
        .map(toBoardQuest);
    },
    getPublishCheck: (questId) => {
      const state = getInternal(questId);
      return state
        ? calculatePublishCheck(state.quest, feeRateBasisPoints)
        : null;
    },
    getEscrowSummary: (rewardSatang, headcount) =>
      calculateEscrow(rewardSatang, headcount, feeRateBasisPoints),
    getSettlement: (questId, now = baseNow) => {
      const state = getInternal(questId);
      return state
        ? (stateForViewer(state, DEFAULT_PROTOTYPE_VIEWER_ID, at(now))
            .settlement ?? null)
        : null;
    },
    getConversationCapability: (
      questId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const state = getInternal(questId);
      return state
        ? conversationFor(projectedState(state, at(now)), viewer(viewerId))
        : {
            conversationId: null,
            canRead: false,
            canWrite: false,
            readOnly: true,
            readOnlyReason: "NOT_A_MEMBER",
          };
    },
    listConversations: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const currentTime = at(now);
      return sortedChatConversations(
        [...conversations.values()].flatMap((conversation) => {
          const context = getChatContext(
            conversation.id,
            currentViewer,
            currentTime
          );
          return context?.capability.canRead
            ? [
                projectChatConversation(
                  conversation,
                  currentViewer,
                  context.capability,
                  context.state
                ),
              ]
            : [];
        })
      );
    },
    getConversation: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const context = getChatContext(conversationId, currentViewer, at(now));
      return context?.capability.canRead
        ? projectChatConversation(
            context.conversation,
            currentViewer,
            context.capability,
            context.state
          )
        : null;
    },
    getConversationMessages: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const conversation = adapter.getConversation(
        conversationId,
        viewerId,
        now
      );
      return conversation?.messages ?? [];
    },
    getMessages: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.getConversationMessages(conversationId, viewerId, now),
    sendMessage: (conversationId, senderId, body, now = baseNow) => {
      const currentTime = at(now);
      const currentViewer = viewer(senderId);
      const stored = conversations.get(conversationId);
      if (!stored)
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "Conversation not found." },
        };
      const context = getChatContext(
        conversationId,
        currentViewer,
        currentTime
      );
      const contextState = context?.state
        ? stateForViewer(context.state, currentViewer, currentTime)
        : undefined;
      if (!context)
        return {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Only conversation members can send messages.",
          },
          state: contextState,
        };
      if (!context.capability.canWrite || context.capability.readOnly) {
        return {
          ok: false,
          error: {
            code: "INVALID_STATUS",
            message: "This conversation is read-only.",
          },
          state: contextState,
        };
      }
      const text = body.trim();
      if (!text)
        return {
          ok: false,
          error: {
            code: "INVALID_MESSAGE",
            message: "A message cannot be empty.",
          },
          state: contextState,
        };
      const requestedSentAt = currentTime.getTime();
      const latestSentAt = new Date(
        latestChatMessage(stored)?.sentAt ?? ""
      ).getTime();
      const latestReadAt = Math.max(
        ...Object.values(stored.readAt)
          .map((value) => new Date(value).getTime())
          .filter((value) => Number.isFinite(value)),
        Number.NEGATIVE_INFINITY
      );
      const sentAt = Math.max(
        requestedSentAt,
        Number.isFinite(latestSentAt) ? latestSentAt + 1 : requestedSentAt,
        Number.isFinite(latestReadAt) ? latestReadAt + 1 : requestedSentAt
      );
      const message: FixtureChatMessage = {
        id: `${conversationId}-message-${stored.messages.length + 1}`,
        senderId: currentViewer,
        text: { en: text, th: text },
        time: "Now",
        sentAt: new Date(sentAt).toISOString(),
      };
      stored.messages.push(message);
      notify();
      return {
        ok: true,
        value: projectChatMessage(message, currentViewer),
        state: contextState,
      };
    },
    sendChatMessage: (conversationId, senderId, body, now = baseNow) =>
      adapter.sendMessage(conversationId, senderId, body, now),
    markConversationRead: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentTime = at(now);
      const currentViewer = viewer(viewerId);
      const stored = conversations.get(conversationId);
      if (!stored)
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "Conversation not found." },
        };
      const context = getChatContext(
        conversationId,
        currentViewer,
        currentTime
      );
      if (!context || !context.capability.canRead)
        return {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: "Only conversation members can mark messages read.",
          },
        };
      stored.readAt[currentViewer] = currentTime.toISOString();
      notify();
      return {
        ok: true,
        value: projectChatConversation(
          stored,
          currentViewer,
          context.capability,
          context.state
        ),
        state: context.state
          ? stateForViewer(context.state, currentViewer, currentTime)
          : undefined,
      };
    },
    markRead: (
      conversationId,
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.markConversationRead(conversationId, viewerId, now),
    listFixtureConversations: (
      viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const currentViewer = viewer(viewerId);
      const currentTime = at(now);
      return FIXTURE_CHAT_SEEDS.flatMap((seed) => {
        const conversation = conversations.get(seed.id);
        if (!conversation || !conversation.memberIds.includes(currentViewer))
          return [];
        const context = fixtureChatContext(
          conversation,
          currentViewer,
          currentTime
        );
        return [
          projectChatConversation(
            conversation,
            currentViewer,
            context.capability,
            context.state
          ),
        ];
      });
    },
    searchKuMembers: (
      questId,
      query,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const state = getInternal(questId);
      if (!state) return [];
      const current = projectedState(state, at(now));
      const leaderTeam = current.teams.find(
        (teamItem) =>
          teamItem.leaderId === leaderId &&
          teamItem.status === QuestTeamStatus.TEAM_FORMING
      );
      if (!leaderTeam) return [];
      const normalizedQuery = query.trim().toLocaleLowerCase();
      const occupied = new Set(
        current.teams.flatMap((teamItem) =>
          teamItem.members.map((member) => member.workerId)
        )
      );
      const pending = new Set(
        current.invitations
          .filter(
            (item) => item.status === QuestInvitationStatus.INVITATION_PENDING
          )
          .map((item) => item.invitedWorkerId)
      );
      return memberDirectory
        .filter(
          (member) =>
            member.workerId !== current.quest.hirerId &&
            member.workerId !== leaderId
        )
        .filter(
          (member) =>
            !occupied.has(member.workerId) && !pending.has(member.workerId)
        )
        .filter(
          (member) =>
            !normalizedQuery ||
            `${member.displayName} ${member.workerId}`
              .toLocaleLowerCase()
              .includes(normalizedQuery)
        )
        .map((member) => ({ ...member }));
    },
    searchMembers: (
      questId,
      query,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.searchKuMembers(questId, query, leaderId, now),
    createQuest: (payload, hirerId = "demo-hirer", now = baseNow) =>
      adapter.createAndPublishQuest(payload, hirerId, now),
    createAndPublishQuest: (payload, hirerId = "demo-hirer", now = baseNow) => {
      const currentTime = at(now);
      const ownerId = viewer(hirerId);
      const blockers = createPayloadBlockers(payload);
      if (blockers.length > 0) {
        return failure(
          createDraftState(),
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${blockers.join(", ")}.`,
          ownerId,
          currentTime
        );
      }
      const created = buildCreatedQuestState(
        payload,
        nextCreatedQuestId(),
        ownerId,
        currentTime
      );
      if ("blockers" in created) {
        return failure(
          createDraftState(),
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${created.blockers.join(", ")}.`,
          ownerId,
          currentTime
        );
      }
      const check = calculatePublishCheck(
        created.state.quest,
        feeRateBasisPoints
      );
      if (!check.canPublish) {
        return failure(
          created.state,
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${check.blockers.join(", ")}.`,
          ownerId,
          currentTime
        );
      }
      created.state.quest.status = QuestStatus.QUEST_OPEN;
      created.state.quest.postedAt = currentTime.toISOString();
      created.state.publishCheck = check;
      commit(created.state);
      return success(created.state, ownerId, currentTime);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      createdQuestCounter = 0;
      states.clear();
      initialStates.forEach((state, id) => states.set(id, clone(state)));
      conversations.clear();
      initialConversations.forEach((conversation, id) =>
        conversations.set(id, clone(conversation))
      );
      notify();
    },
    joinDirect: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not open for direct joins.",
          workerId,
          currentTime
        );
      if (projected.quest.candidateMode !== QuestCandidateMode.NO_CANDIDATE)
        return failure(
          projected,
          "INVALID_MODE",
          "This Quest accepts Candidates instead of direct joins.",
          workerId,
          currentTime
        );
      if (projected.quest.hirerId === workerId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer cannot join their own Quest.",
          workerId,
          currentTime
        );
      if (hasAssignment(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already have a relationship with this Quest.",
          workerId,
          currentTime
        );
      if (countAdmitted(projected) >= projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "This Quest has no remaining capacity.",
          workerId,
          currentTime
        );
      if (
        projected.quest.participation === QuestParticipation.SINGLE &&
        projected.quest.headcount !== 1
      )
        return failure(
          projected,
          "INVALID_MODE",
          "A SINGLE Quest must request exactly one Worker place.",
          workerId,
          currentTime
        );
      if (
        projected.quest.participation === QuestParticipation.GROUP &&
        (isTeamMember(projected, workerId) ||
          isPendingInvitation(projected, workerId))
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already have a relationship with this Quest.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      next.assignments.push(
        assignment(
          next.quest,
          workerId,
          "DIRECT_JOIN",
          QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
          `${workerId}-${next.assignments.length + 1}`
        )
      );
      setActualHeadcount(next);
      if (
        next.quest.participation === QuestParticipation.SINGLE ||
        countAdmitted(next) >= next.quest.headcount
      ) {
        next.quest.status = QuestStatus.QUEST_ASSIGNED;
        next.settlement = settlementFor(next, countAdmitted(next));
      }
      ensureConversation(next, [next.quest.hirerId, workerId]);
      commit(next);
      return success(next, workerId, currentTime);
    },
    directJoin: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.joinDirect(questId, workerId, now),
    applyCandidate: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting applications.",
          workerId,
          currentTime
        );
      if (
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.SINGLE
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only SINGLE Candidate Quests accept individual applications.",
          workerId,
          currentTime
        );
      if (projected.quest.hirerId === workerId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer cannot apply to their own Quest.",
          workerId,
          currentTime
        );
      if (
        projected.applications.some(
          (item) =>
            item.applicantId === workerId &&
            item.status === QuestApplicationStatus.APPLICATION_APPLIED
        )
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already applied to this Quest.",
          workerId,
          currentTime
        );
      if (
        projected.applications.some(
          (item) =>
            item.applicantId === workerId &&
            item.status === QuestApplicationStatus.APPLICATION_REJECTED
        )
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "A rejected Candidate Proposal cannot be resubmitted.",
          workerId,
          currentTime
        );
      if (hasAssignment(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already have a relationship with this Quest.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      next.applications.push(
        makeApplicationForApplicant(next, workerId, currentTime)
      );
      commit(next);
      return success(next, workerId, currentTime);
    },
    submitApplication: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.applyCandidate(questId, workerId, now),
    withdrawApplication: (questId, applicationId, workerIdOrNow, now) => {
      const parsed = resolveDateAndString(workerIdOrNow, baseNow);
      const currentTime = at(now ?? parsed.now);
      const actorId = parsed.value ?? DEFAULT_PROTOTYPE_VIEWER_ID;
      const current = getInternal(questId);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "An application can only be withdrawn before Candidate Selection.",
          actorId,
          currentTime
        );
      const target = projected.applications.find(
        (item) =>
          (applicationId
            ? item.id === applicationId
            : item.applicantId === actorId) &&
          item.applicantId === actorId &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED
      );
      if (!target)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Pending application not found for this Applicant.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      const nextTarget = next.applications.find(
        (item) => item.id === target.id
      );
      if (!nextTarget)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Application not found.",
          actorId,
          currentTime
        );
      nextTarget.status = QuestApplicationStatus.APPLICATION_WITHDRAWN;
      nextTarget.decidedAt = currentTime.toISOString();
      commit(next);
      return success(next, actorId, currentTime);
    },
    withdrawCandidate: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => adapter.withdrawApplication(questId, undefined, workerId, now),
    createTeam: (
      questId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      nameOrNow,
      now
    ) => {
      const parsed = resolveDateAndString(nameOrNow, baseNow);
      const currentTime = at(now ?? parsed.now);
      const current = getInternal(questId);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        projected.quest.status !== QuestStatus.QUEST_OPEN ||
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Teams are only available for open GROUP Candidate Quests.",
          leaderId,
          currentTime
        );
      if (projected.quest.hirerId === leaderId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer cannot form a team for their own Quest.",
          leaderId,
          currentTime
        );
      if (
        isTeamParticipant(projected, leaderId) ||
        hasAssignment(projected, leaderId)
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You already belong to a team for this Quest.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      next.teams.push(
        makeTeam(next.quest, leaderId, [{ workerId: leaderId, role: "LEADER" }])
      );
      commit(next);
      return success(next, leaderId, currentTime);
    },
    inviteWorker: (
      questId,
      workerId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const leaderTeam = projected.teams.find(
        (teamItem) => teamItem.leaderId === leaderId
      );
      if (!leaderTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Create a Quest Team before inviting Workers.",
          leaderId,
          currentTime
        );
      if (
        projected.quest.status !== QuestStatus.QUEST_OPEN ||
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Invitations are only available for an open GROUP Candidate Quest.",
          leaderId,
          currentTime
        );
      if (leaderTeam.status !== QuestTeamStatus.TEAM_FORMING)
        return failure(
          projected,
          "IMMUTABLE_TEAM",
          "This submitted Team cannot be changed.",
          leaderId,
          currentTime
        );
      if (projected.quest.hirerId === workerId || workerId === leaderId)
        return failure(
          projected,
          "FORBIDDEN",
          "The Hirer and Team Leader cannot be invited.",
          leaderId,
          currentTime
        );
      if (isTeamMember(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "That Worker already belongs to a Quest Team.",
          leaderId,
          currentTime
        );
      if (isPendingInvitation(projected, workerId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "That Worker already has a pending invitation.",
          leaderId,
          currentTime
        );
      if (leaderTeam.members.length >= projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "The Team has reached the requested headcount.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      const nextLeaderTeam = next.teams.find(
        (teamItem) => teamItem.id === leaderTeam.id
      );
      if (!nextLeaderTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Team not found.",
          leaderId,
          currentTime
        );
      const createdAt = currentTime.toISOString();
      next.invitations.push({
        id: `fixture-invitation-${next.quest.id}-${nextLeaderTeam.id}-${workerId}`,
        questId: next.quest.id,
        teamId: nextLeaderTeam.id,
        invitedWorkerId: workerId,
        status: QuestInvitationStatus.INVITATION_PENDING,
        createdAt,
        expiresAt: addMilliseconds(createdAt, INVITATION_WINDOW_MS),
      });
      commit(next);
      return success(next, leaderId, currentTime);
    },
    revokeInvitation: (
      questId,
      invitationId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const invitation = projected.invitations.find(
        (item) => item.id === invitationId
      );
      const leaderTeam = invitation
        ? teamForId(projected, invitation.teamId)
        : undefined;
      if (!invitation || !leaderTeam)
        return failure(
          projected,
          "INVITATION_NOT_FOUND",
          "Invitation not found.",
          leaderId,
          currentTime
        );
      if (leaderTeam.leaderId !== leaderId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Team Leader can revoke invitations.",
          leaderId,
          currentTime
        );
      if (invitation.status !== QuestInvitationStatus.INVITATION_PENDING)
        return failure(
          projected,
          "INVALID_STATUS",
          "This invitation is no longer pending.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      const nextInvitation = next.invitations.find(
        (item) => item.id === invitationId
      );
      if (nextInvitation)
        nextInvitation.status = QuestInvitationStatus.INVITATION_REVOKED;
      commit(next);
      return success(next, leaderId, currentTime);
    },
    respondToInvitation: (
      questId,
      invitationId,
      workerId,
      accept,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const invitation = projected.invitations.find(
        (item) => item.id === invitationId
      );
      if (!invitation || invitation.invitedWorkerId !== workerId)
        return failure(
          projected,
          "INVITATION_NOT_FOUND",
          "Invitation not found for this Worker.",
          workerId,
          currentTime
        );
      if (invitation.status === QuestInvitationStatus.INVITATION_EXPIRED)
        return failure(
          projected,
          "INVITATION_EXPIRED",
          "This invitation has expired. Refresh to see the server status.",
          workerId,
          currentTime
        );
      if (invitation.status !== QuestInvitationStatus.INVITATION_PENDING)
        return failure(
          projected,
          "INVALID_STATUS",
          "This invitation is no longer pending.",
          workerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is no longer forming teams.",
          workerId,
          currentTime
        );
      const invitationTeam = teamForId(projected, invitation.teamId);
      if (
        !invitationTeam ||
        invitationTeam.status !== QuestTeamStatus.TEAM_FORMING
      )
        return failure(
          projected,
          "IMMUTABLE_TEAM",
          "This Team can no longer change.",
          workerId,
          currentTime
        );
      if (
        accept &&
        (isTeamMember(projected, workerId) ||
          projected.teams.some(
            (teamItem) =>
              teamItem.id !== invitation.teamId &&
              teamItem.members.some((member) => member.workerId === workerId)
          ))
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "That Worker already belongs to a Quest Team.",
          workerId,
          currentTime
        );
      if (accept && invitationTeam.members.length >= projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "The Team has reached the requested headcount.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      const nextInvitation = next.invitations.find(
        (item) => item.id === invitationId
      );
      const nextTeam = next.teams.find(
        (teamItem) => teamItem.id === invitation.teamId
      );
      if (!nextInvitation || !nextTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Team not found.",
          workerId,
          currentTime
        );
      nextInvitation.status = accept
        ? QuestInvitationStatus.INVITATION_ACCEPTED
        : QuestInvitationStatus.INVITATION_DECLINED;
      if (accept) nextTeam.members.push({ workerId, role: "MEMBER" });
      commit(next);
      return success(next, workerId, currentTime);
    },
    acceptInvitation: (
      questId,
      invitationId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      adapter.respondToInvitation(questId, invitationId, workerId, true, now),
    declineInvitation: (
      questId,
      invitationId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) =>
      adapter.respondToInvitation(questId, invitationId, workerId, false, now),
    submitTeam: (
      questId,
      leaderId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const leaderTeam = projected.teams.find(
        (teamItem) => teamItem.leaderId === leaderId
      );
      if (!leaderTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Create a Quest Team before submitting.",
          leaderId,
          currentTime
        );
      if (
        projected.quest.status !== QuestStatus.QUEST_OPEN ||
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only an open GROUP Candidate Quest accepts Team Proposals.",
          leaderId,
          currentTime
        );
      if (leaderTeam.status !== QuestTeamStatus.TEAM_FORMING)
        return failure(
          projected,
          "IMMUTABLE_TEAM",
          "This Team is already submitted and cannot be changed.",
          leaderId,
          currentTime
        );
      if (leaderTeam.members.length === 0)
        return failure(
          projected,
          "TEAM_NOT_READY",
          "A Team Proposal must contain at least one accepted member.",
          leaderId,
          currentTime
        );
      if (leaderTeam.members.length > projected.quest.headcount)
        return failure(
          projected,
          "CAPACITY_REACHED",
          "The Team exceeds the requested headcount.",
          leaderId,
          currentTime
        );
      const next = clone(projected);
      const nextTeam = next.teams.find(
        (teamItem) => teamItem.id === leaderTeam.id
      );
      if (!nextTeam)
        return failure(
          projected,
          "TEAM_NOT_FOUND",
          "Team not found.",
          leaderId,
          currentTime
        );
      nextTeam.status = QuestTeamStatus.TEAM_SUBMITTED;
      if (!next.applications.some((item) => item.teamId === nextTeam.id))
        next.applications.push(
          makeTeamApplication(next, nextTeam.id, currentTime)
        );
      commit(next);
      return success(next, leaderId, currentTime);
    },
    rejectCandidate: (
      questId,
      applicationId,
      hirerId = "demo-hirer",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can reject a Candidate.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting Candidate rejection.",
          hirerId,
          currentTime
        );
      if (
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.SINGLE
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only SINGLE Candidate Quests accept individual applications.",
          hirerId,
          currentTime
        );
      const target = projected.applications.find(
        (item) =>
          (item.id === applicationId || item.proposalId === applicationId) &&
          Boolean(item.applicantId) &&
          !item.teamId &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED
      );
      if (!target)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Pending Candidate Proposal not found.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const nextTarget = next.applications.find(
        (item) => item.id === target.id
      );
      if (!nextTarget)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Candidate Proposal not found.",
          hirerId,
          currentTime
        );
      nextTarget.status = QuestApplicationStatus.APPLICATION_REJECTED;
      nextTarget.decidedAt = currentTime.toISOString();
      commit(next);
      return success(next, hirerId, currentTime);
    },
    rejectTeam: (questId, teamId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can reject a Team Proposal.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting Team Proposal rejection.",
          hirerId,
          currentTime
        );
      if (
        projected.quest.candidateMode !== QuestCandidateMode.CANDIDATE ||
        projected.quest.participation !== QuestParticipation.GROUP
      )
        return failure(
          projected,
          "INVALID_MODE",
          "Only GROUP Candidate Quests accept Team Proposals.",
          hirerId,
          currentTime
        );
      const target = projected.applications.find(
        (item) =>
          item.status === QuestApplicationStatus.APPLICATION_APPLIED &&
          Boolean(item.teamId) &&
          (item.teamId === teamId ||
            item.id === teamId ||
            item.proposalId === teamId)
      );
      if (!target || !target.teamId)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Submitted Team Proposal not found.",
          hirerId,
          currentTime
        );
      const team = teamForId(projected, target.teamId);
      if (!team || team.status !== QuestTeamStatus.TEAM_SUBMITTED)
        return failure(
          projected,
          "TEAM_NOT_READY",
          "Only a submitted Team Proposal can be rejected.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const nextTarget = next.applications.find(
        (item) => item.id === target.id
      );
      const nextTeam = teamForId(next, team.id);
      if (!nextTarget || !nextTeam)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Team Proposal not found.",
          hirerId,
          currentTime
        );
      nextTarget.status = QuestApplicationStatus.APPLICATION_REJECTED;
      nextTarget.decidedAt = currentTime.toISOString();
      nextTeam.status = QuestTeamStatus.TEAM_REJECTED;
      commit(next);
      return success(next, hirerId, currentTime);
    },
    selectCandidate: (
      questId,
      applicationId,
      hirerId = "demo-hirer",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can select a Candidate.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_OPEN)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not accepting Candidate selection.",
          hirerId,
          currentTime
        );
      const selected = applicationForSelection(projected, applicationId);
      if (
        !selected ||
        !eligibleCandidateApplications(projected).some(
          (item) => item.id === selected.id
        )
      )
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Candidate Proposal not found or not selectable.",
          hirerId,
          currentTime
        );

      let selectedMembers: QuestTeamMember[] = [];
      let selectedTeam: QuestTeam | undefined;
      if (projected.quest.participation === QuestParticipation.SINGLE) {
        if (
          !selected.applicantId ||
          selected.teamId ||
          projected.quest.headcount !== 1
        )
          return failure(
            projected,
            "INVALID_MODE",
            "Only one individual Applicant can be selected for a SINGLE Quest.",
            hirerId,
            currentTime
          );
        selectedMembers = [{ workerId: selected.applicantId, role: "MEMBER" }];
      } else {
        selectedTeam = teamForId(projected, selected.teamId);
        if (
          !selectedTeam ||
          selectedTeam.status !== QuestTeamStatus.TEAM_SUBMITTED
        )
          return failure(
            projected,
            "TEAM_NOT_READY",
            "Only a submitted Quest Team can be selected.",
            hirerId,
            currentTime
          );
        if (
          selectedTeam.members.length === 0 ||
          selectedTeam.members.length > projected.quest.headcount
        )
          return failure(
            projected,
            "TEAM_NOT_READY",
            "The selected Team must be non-empty and fit the requested headcount.",
            hirerId,
            currentTime
          );
        selectedMembers = selectedTeam.members;
      }

      const next = clone(projected);
      const selectedNext = next.applications.find(
        (item) => item.id === selected.id
      );
      if (!selectedNext)
        return failure(
          projected,
          "APPLICATION_NOT_FOUND",
          "Candidate Proposal not found.",
          hirerId,
          currentTime
        );
      selectedNext.status = QuestApplicationStatus.APPLICATION_SELECTED;
      selectedNext.decidedAt = currentTime.toISOString();
      const competing = next.applications.filter(
        (item) =>
          item.id !== selected.id &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED &&
          (projected.quest.participation === QuestParticipation.SINGLE
            ? !item.teamId
            : Boolean(
                item.teamId &&
                teamForId(projected, item.teamId)?.status ===
                  QuestTeamStatus.TEAM_SUBMITTED
              ))
      );
      competing.forEach((item) => {
        item.status = QuestApplicationStatus.APPLICATION_REJECTED;
        item.decidedAt = currentTime.toISOString();
        const rejectedTeam = teamForId(next, item.teamId);
        if (rejectedTeam?.status === QuestTeamStatus.TEAM_SUBMITTED)
          rejectedTeam.status = QuestTeamStatus.TEAM_REJECTED;
      });
      if (selectedTeam) {
        const selectedTeamNext = teamForId(next, selectedTeam.id);
        if (selectedTeamNext)
          selectedTeamNext.status = QuestTeamStatus.TEAM_SELECTED;
      }
      next.assignments.push(
        ...selectedMembers.map((member, index) =>
          assignment(
            next.quest,
            member.workerId,
            selectedTeam ? "TEAM" : "APPLICATION",
            QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
            `${member.workerId}-${index + 1}`,
            selected.id,
            selectedTeam?.id
          )
        )
      );
      setActualHeadcount(next, selectedMembers.length);
      next.settlement = settlementFor(next, selectedMembers.length);
      next.quest.status = QuestStatus.QUEST_ASSIGNED;
      ensureConversation(next, [
        next.quest.hirerId,
        ...selectedMembers.map((member) => member.workerId),
      ]);
      commit(next);
      return success(next, hirerId, currentTime);
    },
    selectTeam: (questId, teamId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      if (!current) return notFound();
      const proposal = current.applications.find(
        (item) =>
          item.teamId === teamId &&
          item.status === QuestApplicationStatus.APPLICATION_APPLIED
      );
      return adapter.selectCandidate(
        questId,
        proposal?.id ?? teamId,
        hirerId,
        now
      );
    },
    requestEdit: (questId, changes, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can request an edit.",
          hirerId,
          currentTime
        );
      if (
        !(
          [
            QuestStatus.QUEST_ASSIGNED,
            QuestStatus.QUEST_IN_PROGRESS,
          ] as QuestStatusValue[]
        ).includes(projected.quest.status)
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "Edits require an active Assignment.",
          hirerId,
          currentTime
        );
      if (
        projected.editConsent?.status ===
        QuestEditRequestStatus.EDIT_REQUEST_PENDING
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "An edit request is already waiting for responses.",
          hirerId,
          currentTime
        );
      if (
        projected.partialStartConsent?.status ===
        QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "Partial-start consent must finish before an edit can be requested.",
          hirerId,
          currentTime
        );
      const allowedChanges = new Set([
        "description",
        "completionCriteria",
        "startAt",
        "endAt",
        "deadlineAt",
        "location",
        "imageUris",
      ]);
      if (Object.keys(changes).some((key) => !allowedChanges.has(key)))
        return failure(
          projected,
          "EDIT_NOT_ALLOWED",
          "Core Quest commitments cannot be changed after Assignment.",
          hirerId,
          currentTime
        );
      const workers = activeAssignments(projected);
      if (workers.length === 0)
        return failure(
          projected,
          "INVALID_STATUS",
          "There are no active Workers to consent.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const previousStatus = next.quest.status;
      next.quest.status = QuestStatus.QUEST_AWAITING_EDIT_CONSENT;
      next.editConsent = {
        id: `fixture-edit-consent-${next.quest.id}`,
        questId: next.quest.id,
        previousStatus,
        status: QuestEditRequestStatus.EDIT_REQUEST_PENDING,
        requestedChanges: clone(changes),
        requestedAt: currentTime.toISOString(),
        responseDeadlineAt: addMilliseconds(
          currentTime.toISOString(),
          EDIT_CONSENT_WINDOW_MS
        ),
        requiredWorkerCount: workers.length,
        approvedWorkerCount: 0,
        responses: [],
      };
      commit(next);
      return success(next, hirerId, currentTime);
    },
    voteEditConsent: (questId, workerId, approve, now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        projected.quest.status !== QuestStatus.QUEST_AWAITING_EDIT_CONSENT ||
        !projected.editConsent ||
        projected.editConsent.status !==
          QuestEditRequestStatus.EDIT_REQUEST_PENDING
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending edit consent request.",
          workerId,
          currentTime
        );
      if (!hasActiveAssignment(projected, workerId))
        return failure(
          projected,
          "FORBIDDEN",
          "Only active Workers can vote on this edit.",
          workerId,
          currentTime
        );
      if (
        currentTime.getTime() >=
        new Date(projected.editConsent.responseDeadlineAt).getTime()
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This edit consent request has timed out. Refresh for the server state.",
          workerId,
          currentTime
        );
      if (
        projected.editConsent.responses.some(
          (item) => item.workerId === workerId
        )
      )
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You have already responded to this edit request.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      const response: QuestEditConsentResponse = {
        workerId,
        status: approve
          ? QuestEditResponseStatus.EDIT_RESPONSE_APPROVED
          : QuestEditResponseStatus.EDIT_RESPONSE_REJECTED,
        respondedAt: currentTime.toISOString(),
      };
      next.editConsent?.responses.push(response);
      if (!next.editConsent)
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending edit consent request.",
          workerId,
          currentTime
        );
      next.editConsent.approvedWorkerCount = next.editConsent.responses.filter(
        (item) => item.status === QuestEditResponseStatus.EDIT_RESPONSE_APPROVED
      ).length;
      if (!approve) {
        next.editConsent.status = QuestEditRequestStatus.EDIT_REQUEST_REJECTED;
        next.quest.status = next.editConsent.previousStatus;
      } else if (
        next.editConsent.approvedWorkerCount >=
        next.editConsent.requiredWorkerCount
      ) {
        next.editConsent.status = QuestEditRequestStatus.EDIT_REQUEST_APPROVED;
        applyEditChanges(next, next.editConsent.requestedChanges);
        next.quest.status = next.editConsent.previousStatus;
      }
      commit(next);
      return success(next, workerId, currentTime);
    },
    respondToEditConsent: (questId, workerId, approve, now = baseNow) =>
      adapter.voteEditConsent(questId, workerId, approve, now),
    votePartialGroupStartConsent: (
      questId,
      voterId,
      approve,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      const consent = projected.partialStartConsent;
      if (
        projected.quest.status !==
          QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT ||
        !consent ||
        consent.status !== QuestPartialStartConsentStatus.PARTIAL_START_PENDING
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending partial Group start consent.",
          voterId,
          currentTime
        );
      if (!consent.requiredVoterIds.includes(voterId))
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer and frozen Workers can vote on this start.",
          voterId,
          currentTime
        );
      if (
        currentTime.getTime() >= new Date(consent.responseDeadlineAt).getTime()
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This partial-start consent request has timed out. Refresh for the server state.",
          voterId,
          currentTime
        );
      if (consent.responses.some((item) => item.voterId === voterId))
        return failure(
          projected,
          "DUPLICATE_ACTION",
          "You have already responded to this start request.",
          voterId,
          currentTime
        );
      const next = clone(projected);
      const response: QuestPartialStartConsentResponse = {
        voterId,
        role: voterId === next.quest.hirerId ? "HIRER" : "WORKER",
        status: approve
          ? QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
          : QuestPartialStartVoteStatus.PARTIAL_START_VOTE_REJECTED,
        respondedAt: currentTime.toISOString(),
      };
      next.partialStartConsent?.responses.push(response);
      if (!next.partialStartConsent)
        return failure(
          projected,
          "INVALID_STATUS",
          "There is no pending partial Group start consent.",
          voterId,
          currentTime
        );
      next.partialStartConsent.approvedVoterCount =
        next.partialStartConsent.responses.filter(
          (item) =>
            item.status ===
            QuestPartialStartVoteStatus.PARTIAL_START_VOTE_APPROVED
        ).length;
      if (!approve) {
        cancelPartialStart(
          next,
          QuestPartialStartConsentStatus.PARTIAL_START_REJECTED
        );
      } else if (
        next.partialStartConsent.approvedVoterCount >=
        next.partialStartConsent.requiredVoterIds.length
      ) {
        next.partialStartConsent.status =
          QuestPartialStartConsentStatus.PARTIAL_START_APPROVED;
        transitionToInProgress(next);
      }
      commit(next);
      return success(next, voterId, currentTime);
    },
    votePartialStartConsent: (questId, voterId, approve, now = baseNow) =>
      adapter.votePartialGroupStartConsent(questId, voterId, approve, now),
    respondToPartialStartConsent: (questId, voterId, approve, now = baseNow) =>
      adapter.votePartialGroupStartConsent(questId, voterId, approve, now),
    submitProof: (
      questId,
      ownerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      imageUris = [],
      note = "",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_IN_PROGRESS)
        return failure(
          projected,
          "INVALID_STATUS",
          "Proof can only be submitted while the Quest is in progress.",
          ownerId,
          currentTime
        );
      if (projected.quest.proofRequired === "none")
        return failure(
          projected,
          "INVALID_MODE",
          "This Quest does not require proof.",
          ownerId,
          currentTime
        );
      if (imageUris.length > 3)
        return failure(
          projected,
          "PROOF_NOT_READY",
          "A proof can contain at most three images.",
          ownerId,
          currentTime
        );
      const selectedTeam = projected.teams.find(
        (teamItem) =>
          teamItem.status === QuestTeamStatus.TEAM_SELECTED &&
          teamItem.members.some((member) => member.workerId === ownerId)
      );
      if (!selectedTeam && !hasActiveAssignment(projected, ownerId))
        return failure(
          projected,
          "FORBIDDEN",
          "Only an active Worker can submit proof.",
          ownerId,
          currentTime
        );
      const proofOwnerId = selectedTeam?.id ?? ownerId;
      const next = clone(projected);
      const existing = next.proofs.find(
        (item) => item.ownerId === proofOwnerId
      );
      const nextProof: QuestProof =
        existing ??
        proof(
          next.quest,
          proofOwnerId,
          QuestProofStatus.PROOF_PENDING,
          0,
          undefined,
          selectedTeam?.id
        );
      nextProof.teamId = selectedTeam?.id;
      nextProof.status = QuestProofStatus.PROOF_PENDING;
      nextProof.imageUris = [...imageUris].slice(0, 3);
      nextProof.note = note;
      nextProof.submittedAt = currentTime.toISOString();
      nextProof.reviewedAt = undefined;
      nextProof.reviewReason = undefined;
      if (!existing) next.proofs.push(nextProof);
      const active = activeAssignments(next);
      const requiredProofOwners = next.teams.some(
        (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
      )
        ? [
            next.teams.find(
              (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
            )?.id,
          ].filter((id): id is string => Boolean(id))
        : active.map((item) => item.workerId);
      const submittedOwners = new Set(
        next.proofs
          .filter((item) =>
            (
              [
                QuestProofStatus.PROOF_PENDING,
                QuestProofStatus.PROOF_APPROVED,
                QuestProofStatus.PROOF_AUTO_APPROVED,
              ] as QuestProof["status"][]
            ).includes(item.status)
          )
          .map((item) => item.ownerId)
      );
      if (
        requiredProofOwners.length > 0 &&
        requiredProofOwners.every((requiredOwner) =>
          submittedOwners.has(requiredOwner)
        )
      )
        next.quest.status = QuestStatus.QUEST_SUBMITTED;
      commit(next);
      return success(next, ownerId, currentTime);
    },
    reviewProof: (
      questId,
      proofId,
      approve,
      reason = "",
      hirerId = "demo-hirer",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can review proof.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_SUBMITTED)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not waiting for proof review.",
          hirerId,
          currentTime
        );
      const target = projected.proofs.find(
        (item) =>
          item.id === proofId && item.status === QuestProofStatus.PROOF_PENDING
      );
      if (!target)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "Pending proof not found.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      const nextProof = next.proofs.find((item) => item.id === proofId);
      if (!nextProof)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "Proof not found.",
          hirerId,
          currentTime
        );
      nextProof.reviewedAt = currentTime.toISOString();
      nextProof.reviewReason = reason || undefined;
      if (approve) {
        nextProof.status = QuestProofStatus.PROOF_APPROVED;
        const allApproved = next.proofs.every(
          (item) =>
            item.status === QuestProofStatus.PROOF_APPROVED ||
            item.status === QuestProofStatus.PROOF_AUTO_APPROVED
        );
        if (allApproved) next.quest.status = QuestStatus.QUEST_APPROVED;
      } else if (nextProof.reworkCount < nextProof.reworkLimit) {
        nextProof.status = QuestProofStatus.PROOF_REJECTED;
        next.quest.status = QuestStatus.QUEST_REWORK;
      } else {
        nextProof.status = QuestProofStatus.PROOF_REJECTED;
        next.quest.status = QuestStatus.QUEST_DISPUTED;
      }
      commit(next);
      return success(next, hirerId, currentTime);
    },
    approveProof: (questId, proofId, hirerId = "demo-hirer", now = baseNow) =>
      adapter.reviewProof(questId, proofId, true, "", hirerId, now),
    rejectProof: (
      questId,
      proofId,
      reason = "",
      hirerId = "demo-hirer",
      now = baseNow
    ) => adapter.reviewProof(questId, proofId, false, reason, hirerId, now),
    submitRework: (
      questId,
      proofId,
      ownerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      imageUris = [],
      note = "",
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.status !== QuestStatus.QUEST_REWORK)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not waiting for rework.",
          ownerId,
          currentTime
        );
      const target = projected.proofs.find(
        (item) =>
          item.id === proofId && item.status === QuestProofStatus.PROOF_REJECTED
      );
      if (!target)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "A rejected proof for this Worker was not found.",
          ownerId,
          currentTime
        );
      const targetTeam = target.teamId
        ? teamForId(projected, target.teamId)
        : undefined;
      const canRework = targetTeam
        ? targetTeam.members.some((member) => member.workerId === ownerId) &&
          hasActiveAssignment(projected, ownerId)
        : target.ownerId === ownerId && hasActiveAssignment(projected, ownerId);
      if (!canRework)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the rejected proof owner can submit rework.",
          ownerId,
          currentTime
        );
      if (target.reworkCount >= target.reworkLimit)
        return failure(
          projected,
          "PROOF_NOT_READY",
          "The rework quota is exhausted; this Quest requires dispute resolution.",
          ownerId,
          currentTime
        );
      const next = clone(projected);
      const nextProof = next.proofs.find((item) => item.id === proofId);
      if (!nextProof)
        return failure(
          projected,
          "PROOF_NOT_FOUND",
          "Proof not found.",
          ownerId,
          currentTime
        );
      nextProof.reworkCount += 1;
      nextProof.status = QuestProofStatus.PROOF_PENDING;
      nextProof.imageUris = [...imageUris].slice(0, 3);
      nextProof.note = note;
      nextProof.submittedAt = currentTime.toISOString();
      nextProof.reviewedAt = undefined;
      nextProof.reviewReason = undefined;
      const requiredOwners = next.teams.some(
        (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
      )
        ? [
            next.teams.find(
              (teamItem) => teamItem.status === QuestTeamStatus.TEAM_SELECTED
            )?.id,
          ].filter((id): id is string => Boolean(id))
        : activeAssignments(next).map((item) => item.workerId);
      const submittedOwners = new Set(
        next.proofs
          .filter((item) =>
            (
              [
                QuestProofStatus.PROOF_PENDING,
                QuestProofStatus.PROOF_APPROVED,
                QuestProofStatus.PROOF_AUTO_APPROVED,
              ] as QuestProof["status"][]
            ).includes(item.status)
          )
          .map((item) => item.ownerId)
      );
      if (
        requiredOwners.length > 0 &&
        requiredOwners.every((requiredOwner) =>
          submittedOwners.has(requiredOwner)
        )
      )
        next.quest.status = QuestStatus.QUEST_SUBMITTED;
      else next.quest.status = QuestStatus.QUEST_IN_PROGRESS;
      commit(next);
      return success(next, ownerId, currentTime);
    },
    confirmCompletion: (
      questId,
      workerId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        projected.quest.status !== QuestStatus.QUEST_IN_PROGRESS ||
        projected.quest.proofRequired !== "none"
      )
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not ready for proof-free completion.",
          workerId,
          currentTime
        );
      const next = clone(projected);
      const item = next.assignments.find(
        (assignmentItem) =>
          assignmentItem.workerId === workerId &&
          assignmentItem.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE
      );
      if (!item)
        return failure(
          projected,
          "FORBIDDEN",
          "Only an active Worker can confirm completion.",
          workerId,
          currentTime
        );
      item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
      item.completedAt = currentTime.toISOString();
      if (
        next.assignments
          .filter(
            (assignmentItem) =>
              assignmentItem.status !==
              QuestAssignmentStatus.ASSIGNMENT_CANCELLED
          )
          .every(
            (assignmentItem) =>
              assignmentItem.status ===
              QuestAssignmentStatus.ASSIGNMENT_COMPLETED
          )
      )
        next.quest.status = QuestStatus.QUEST_APPROVED;
      commit(next);
      return success(next, workerId, currentTime);
    },
    completeQuest: (questId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can complete this Quest.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_APPROVED)
        return failure(
          projected,
          "INVALID_STATUS",
          "The Quest is not approved for completion.",
          hirerId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_COMPLETED;
      next.assignments.forEach((item) => {
        if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
          item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
      });
      commit(next);
      return success(next, hirerId, currentTime);
    },
    openDispute: (
      questId,
      actorId = DEFAULT_PROTOTYPE_VIEWER_ID,
      now = baseNow
    ) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (
        (actorId !== projected.quest.hirerId &&
          !hasAssignment(projected, actorId)) ||
        (actorId === projected.quest.hirerId &&
          !activeAssignments(projected).length)
      )
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer or an assigned Worker can open a dispute.",
          actorId,
          currentTime
        );
      if (isTerminal(projected.quest.status))
        return failure(
          projected,
          "INVALID_STATUS",
          "A terminal Quest cannot be disputed.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_DISPUTED;
      ensureConversation(next, [
        next.quest.hirerId,
        ...next.assignments.map((item) => item.workerId),
      ]);
      commit(next);
      return success(next, actorId, currentTime);
    },
    resolveDispute: (questId, actorId = "admin-demo", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (actorId !== "admin-demo" && actorId !== projected.quest.hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only an authorized resolver can resolve a dispute.",
          actorId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_DISPUTED)
        return failure(
          projected,
          "INVALID_STATUS",
          "This Quest is not disputed.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_COMPLETED;
      next.assignments.forEach((item) => {
        if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
          item.status = QuestAssignmentStatus.ASSIGNMENT_COMPLETED;
      });
      commit(next);
      return success(next, actorId, currentTime);
    },
    cancelQuest: (questId, actorId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (actorId !== projected.quest.hirerId && actorId !== "admin-demo")
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer or Admin can cancel this Quest.",
          actorId,
          currentTime
        );
      if (isTerminal(projected.quest.status))
        return failure(
          projected,
          "INVALID_STATUS",
          "A terminal Quest cannot be reopened or cancelled.",
          actorId,
          currentTime
        );
      const next = clone(projected);
      const preStart = (
        [
          QuestStatus.QUEST_OPEN,
          QuestStatus.QUEST_ASSIGNED,
          QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT,
          QuestStatus.QUEST_AWAITING_EDIT_CONSENT,
        ] as QuestStatusValue[]
      ).includes(next.quest.status);
      if (
        next.quest.status ===
        QuestStatus.QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT
      )
        cancelPartialStart(
          next,
          QuestPartialStartConsentStatus.PARTIAL_START_REJECTED
        );
      else {
        next.quest.status = QuestStatus.QUEST_CANCELLED;
        if (preStart) next.assignments = [];
        else
          next.assignments.forEach((item) => {
            if (item.status === QuestAssignmentStatus.ASSIGNMENT_ACTIVE)
              item.status = QuestAssignmentStatus.ASSIGNMENT_CANCELLED;
          });
        setActualHeadcount(next, 0);
        if (preStart) next.settlement = settlementFor(next, 0, true);
        makeReadOnly(next);
      }
      commit(next);
      return success(next, actorId, currentTime);
    },
    publishQuest: (questId, hirerId = "demo-hirer", now = baseNow) => {
      const current = getInternal(questId);
      const currentTime = at(now);
      if (!current) return notFound();
      const projected = currentWithProjection(current, currentTime);
      if (projected.quest.hirerId !== hirerId)
        return failure(
          projected,
          "FORBIDDEN",
          "Only the Hirer can publish this Quest.",
          hirerId,
          currentTime
        );
      if (projected.quest.status !== QuestStatus.QUEST_DRAFT)
        return failure(
          projected,
          "INVALID_STATUS",
          "Only Draft Quests can be published.",
          hirerId,
          currentTime
        );
      const check = calculatePublishCheck(projected.quest, feeRateBasisPoints);
      if (!check.canPublish)
        return failure(
          projected,
          "PUBLISH_BLOCKED",
          `Publish is blocked: ${check.blockers.join(", ")}.`,
          hirerId,
          currentTime
        );
      const next = clone(projected);
      next.quest.status = QuestStatus.QUEST_OPEN;
      next.quest.postedAt = currentTime.toISOString();
      next.publishCheck = check;
      commit(next);
      return success(next, hirerId, currentTime);
    },
    dispatch: ((action: QuestWorkflowAction, now = baseNow) => {
      switch (action.type) {
        case "CREATE_AND_PUBLISH":
          return adapter.createAndPublishQuest(
            action.payload,
            action.hirerId,
            now
          );
        case "DIRECT_JOIN":
          return adapter.joinDirect(action.questId, action.workerId, now);
        case "APPLY":
          return adapter.applyCandidate(action.questId, action.workerId, now);
        case "WITHDRAW_APPLICATION":
          return adapter.withdrawApplication(
            action.questId,
            action.applicationId,
            action.workerId ?? action.applicantId,
            now
          );
        case "CREATE_TEAM":
          return adapter.createTeam(
            action.questId,
            action.leaderId,
            action.name,
            now
          );
        case "INVITE_WORKER":
          return adapter.inviteWorker(
            action.questId,
            action.workerId,
            action.leaderId,
            now
          );
        case "REVOKE_INVITATION":
          return adapter.revokeInvitation(
            action.questId,
            action.invitationId,
            action.leaderId,
            now
          );
        case "RESPOND_INVITATION":
          return adapter.respondToInvitation(
            action.questId,
            action.invitationId,
            action.workerId,
            action.accept,
            now
          );
        case "SUBMIT_TEAM":
          return adapter.submitTeam(action.questId, action.leaderId, now);
        case "SELECT_CANDIDATE":
          return adapter.selectCandidate(
            action.questId,
            action.applicationId,
            action.hirerId,
            now
          );
        case "REJECT_CANDIDATE":
          return adapter.rejectCandidate(
            action.questId,
            action.applicationId,
            action.hirerId,
            now
          );
        case "REJECT_TEAM":
          return adapter.rejectTeam(
            action.questId,
            action.teamId,
            action.hirerId,
            now
          );
        case "SELECT_TEAM":
          return adapter.selectTeam(
            action.questId,
            action.teamId,
            action.hirerId,
            now
          );
        case "REQUEST_EDIT":
          return adapter.requestEdit(
            action.questId,
            action.changes,
            action.hirerId,
            now
          );
        case "VOTE_EDIT_CONSENT":
          return adapter.voteEditConsent(
            action.questId,
            action.workerId,
            action.approve,
            now
          );
        case "VOTE_PARTIAL_GROUP_START_CONSENT":
          return adapter.votePartialGroupStartConsent(
            action.questId,
            action.voterId,
            action.approve,
            now
          );
        case "VOTE_PARTIAL_START_CONSENT":
          return adapter.votePartialStartConsent(
            action.questId,
            action.voterId,
            action.approve,
            now
          );
        case "SUBMIT_PROOF":
          return adapter.submitProof(
            action.questId,
            action.ownerId,
            action.imageUris,
            action.note,
            now
          );
        case "REVIEW_PROOF":
          return adapter.reviewProof(
            action.questId,
            action.proofId,
            action.approve,
            action.reason,
            action.hirerId,
            now
          );
        case "REWORK_PROOF":
          return adapter.submitRework(
            action.questId,
            action.proofId,
            action.ownerId,
            action.imageUris,
            action.note,
            now
          );
        case "CONFIRM_COMPLETION":
          return adapter.confirmCompletion(
            action.questId,
            action.workerId,
            now
          );
        case "COMPLETE":
          return adapter.completeQuest(action.questId, action.hirerId, now);
        case "OPEN_DISPUTE":
          return adapter.openDispute(action.questId, action.actorId, now);
        case "RESOLVE_DISPUTE":
          return adapter.resolveDispute(action.questId, action.actorId, now);
        case "CANCEL":
          return adapter.cancelQuest(action.questId, action.actorId, now);
        case "PUBLISH":
          return adapter.publishQuest(action.questId, action.hirerId, now);
        case "SEND_MESSAGE":
          return adapter.sendMessage(
            action.conversationId,
            action.senderId,
            action.body,
            now
          );
        case "MARK_CONVERSATION_READ":
          return adapter.markConversationRead(
            action.conversationId,
            action.viewerId,
            now
          );
        default:
          return {
            ok: false,
            state: createDraftState(),
            error: {
              code: "INVALID_STATUS",
              message: "Unsupported fixture action.",
            },
          };
      }
    }) as QuestFixtureAdapter["dispatch"],
  };

  return adapter;
}

export const questFixtureAdapter = createQuestFixtureAdapter();
/** Named aliases keep the fixture seam discoverable while the API adapter is pending. */
export const questFixtureStore = questFixtureAdapter;

export function getQuestFixtureState(
  questId: string,
  viewerId = DEFAULT_PROTOTYPE_VIEWER_ID,
  now = new Date(PROTOTYPE_NOW)
): QuestDetailState | null {
  return questFixtureAdapter.getState(questId, viewerId, now);
}

export function formatRewardSatang(
  value: number,
  locale: "en" | "th" = "en"
): string {
  return formatSatang(value, locale);
}
