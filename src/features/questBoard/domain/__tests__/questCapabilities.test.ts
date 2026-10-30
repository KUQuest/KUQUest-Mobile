import type {
  QuestV2Application,
  QuestV2EditRequest,
  QuestV2ProofSubmission,
  QuestV2Team,
  QuestV2Underfilled,
} from "@/api/questV2Contracts";
import type { ServerChatConversation } from "@/api/ChatApi";
import {
  deriveQuestCapabilities,
  deriveQuestNextAction,
  type QuestCapabilityAssignment,
  type QuestCapabilityInput,
} from "../questCapabilities";
import {
  QuestActor,
  QuestNextAction,
  type QuestPermissionFlags,
} from "../types";

const VIEWER = "viewer-1";
const OTHER = "student-2";
const QUEST_ID = "quest-1";
const START_ISO = "2026-10-01T09:00:00+07:00";
const DUE_ISO = "2026-10-02T12:00:00+07:00";
const START = Date.parse(START_ISO);
const DUE = Date.parse(DUE_ISO);
const BEFORE_START = START - 1;
const AT_START = START;
const DURING = START + 60 * 60 * 1000;
const AT_DUE = DUE;
const AFTER_DUE = DUE + 1;

type Scenario = Partial<QuestCapabilityInput> & {
  applications?: QuestV2Application[];
  teams?: QuestV2Team[];
};

interface MatrixRow {
  name: string;
  scenario: Scenario;
  granted: string[];
  next: QuestNextAction;
}

const granted = (...names: (keyof QuestPermissionFlags)[]): string[] =>
  [...names].sort();

function enabledFlags(flags: QuestPermissionFlags): string[] {
  return (Object.keys(flags) as (keyof QuestPermissionFlags)[])
    .filter((name) => flags[name])
    .sort();
}

function input(overrides: Partial<QuestCapabilityInput>): QuestCapabilityInput {
  return {
    viewerId: VIEWER,
    actor: QuestActor.HIRER,
    state: "QUEST_OPEN",
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    startTime: START_ISO,
    dueAt: DUE_ISO,
    proofRequired: true,
    headcount: 1,
    assignments: [],
    assignment: null,
    application: null,
    team: null,
    teamRole: null,
    underfilled: null,
    editRequest: null,
    proofs: [],
    workConversation: null,
    now: DURING,
    ...overrides,
  };
}

/** Runs both derivations the way LiveQuestService does, with `now` supplied. */
function resolve({ applications, teams, ...overrides }: Scenario) {
  const quest = input(overrides);
  const capabilities = deriveQuestCapabilities(quest);
  const nextAction = deriveQuestNextAction({
    state: quest.state,
    actor: quest.actor,
    mode: quest.mode,
    participation: quest.participation,
    capabilities,
    application: quest.application,
    applications:
      applications ?? (quest.application ? [quest.application] : []),
    team: quest.team,
    teams: teams ?? (quest.team ? [quest.team] : []),
    underfilled: quest.underfilled,
    editRequest: quest.editRequest,
  });
  return { granted: enabledFlags(capabilities), nextAction };
}

function assignment(
  overrides: Partial<QuestCapabilityAssignment> = {}
): QuestCapabilityAssignment {
  return { state: "ASSIGNMENT_ACTIVE", startedAt: null, ...overrides };
}

const ACTIVE = assignment();
const STARTED = assignment({ startedAt: START_ISO });
const COMPLETED = assignment({ state: "ASSIGNMENT_COMPLETED" });
const CANCELLED = assignment({ state: "ASSIGNMENT_CANCELLED" });

function member(memberId: string) {
  return { memberId, joinedAt: START_ISO };
}

/** Defaults to a FORMING Team led by the viewer, full at its headcount of 2. */
function team(overrides: Partial<QuestV2Team> = {}): QuestV2Team {
  return {
    id: "team-1",
    questId: QUEST_ID,
    leaderId: VIEWER,
    name: "Team A",
    headcount: 2,
    state: "TEAM_FORMING",
    joinCode: null,
    joinCodeExpiresAt: null,
    members: [member(VIEWER), member(OTHER)],
    submission: null,
    createdAt: START_ISO,
    ...overrides,
  };
}

function application(
  state: QuestV2Application["state"],
  memberId = VIEWER
): QuestV2Application {
  return {
    id: "application-1",
    questId: QUEST_ID,
    memberId,
    state,
    appliedAt: START_ISO,
  };
}

function underfilled(state: QuestV2Underfilled["state"]): QuestV2Underfilled {
  return {
    id: "underfilled-1",
    questId: QUEST_ID,
    questState: "QUEST_ASSIGNED",
    state,
    activeWorkerCount: 1,
    headcount: 2,
    workerRewardPool: null,
    questReward: null,
    dueAt: null,
    decision: {
      status: "UNDERFILLED_DECISION_PENDING",
      value: null,
      expiresAt: null,
    },
    consent: {
      status: "UNDERFILLED_CONSENT_PENDING",
      expiresAt: null,
      totalCount: 1,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: 1,
    },
  };
}

function proof(
  overrides: Partial<QuestV2ProofSubmission> = {}
): QuestV2ProofSubmission {
  return {
    id: "proof-1",
    questId: QUEST_ID,
    workerId: OTHER,
    teamId: null,
    submittedByUserId: OTHER,
    description: null,
    status: null,
    submittedAt: null,
    createdAt: START_ISO,
    updatedAt: START_ISO,
    visibility: "FULL",
    fileIds: [],
    files: [],
    ...overrides,
  };
}

function editRequest(
  status: QuestV2EditRequest["status"],
  ownResponse?: QuestV2EditRequest["ownResponse"]
): QuestV2EditRequest {
  return {
    requestId: "edit-1",
    questId: QUEST_ID,
    status,
    failureCode: null,
    createdAt: START_ISO,
    expiresAt: DUE_ISO,
    appliedAt: null,
    failedAt: null,
    previousCondition: { items: [] },
    proposedCondition: { items: [] },
    responseSummary: {
      totalCount: 1,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: 1,
    },
    ownResponse,
  };
}

const CONVERSATION = { id: "conversation-1" } as ServerChatConversation;
const UNDECIDED = {
  workerId: VIEWER,
  decision: null,
  reason: null,
  respondedAt: null,
};
const ACCEPTED = {
  workerId: VIEWER,
  decision: "EDIT_RESPONSE_ACCEPTED" as const,
  reason: null,
  respondedAt: START_ISO,
};

const ACTIVE_WORKER: Scenario = {
  actor: QuestActor.WORKER,
  state: "QUEST_ASSIGNED",
  assignment: ACTIVE,
  assignments: [ACTIVE],
};

const hirerRows: MatrixRow[] = [
  {
    name: "cancels an open FCFS Quest with no applicant",
    scenario: { actor: QuestActor.HIRER },
    granted: granted("canCancel"),
    next: QuestNextAction.CANCEL,
  },
  {
    name: "selects a Candidate on an open SINGLE CANDIDATE Quest",
    scenario: {
      actor: QuestActor.HIRER,
      mode: "CANDIDATE",
      applications: [application("APPLICATION_APPLIED", OTHER)],
    },
    granted: granted("canCancel", "canRejectCandidate", "canSelectCandidate"),
    next: QuestNextAction.SELECT_CANDIDATE,
  },
  {
    name: "selects a submitted Team on an open GROUP CANDIDATE Quest",
    scenario: {
      actor: QuestActor.HIRER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      teams: [team({ leaderId: OTHER, state: "TEAM_SUBMITTED" })],
    },
    granted: granted("canCancel", "canRejectTeam", "canSelectTeam"),
    next: QuestNextAction.SELECT_TEAM,
  },
  {
    name: "requests an edit on an assigned Quest",
    scenario: {
      actor: QuestActor.HIRER,
      state: "QUEST_ASSIGNED",
      assignments: [ACTIVE],
    },
    granted: granted("canCancel", "canRequestEdit"),
    next: QuestNextAction.CANCEL,
  },
  {
    name: "reviews a pending proof on an in-progress Quest",
    scenario: {
      actor: QuestActor.HIRER,
      state: "QUEST_IN_PROGRESS",
      proofs: [proof({ status: "PROOF_PENDING", submittedAt: START_ISO })],
    },
    granted: granted("canCancel", "canReviewProof"),
    next: QuestNextAction.REVIEW_PROOF,
  },
  {
    name: "reviews a pending proof on a failed Quest and can create a review",
    scenario: {
      actor: QuestActor.HIRER,
      state: "QUEST_FAILED",
      proofs: [proof({ status: "PROOF_PENDING", submittedAt: START_ISO })],
    },
    granted: granted("canCreateReview", "canReviewProof"),
    next: QuestNextAction.REVIEW_PROOF,
  },
  {
    name: "has no proof review once the proof is already approved",
    scenario: {
      actor: QuestActor.HIRER,
      state: "QUEST_IN_PROGRESS",
      proofs: [proof({ status: "PROOF_APPROVED", submittedAt: START_ISO })],
    },
    granted: granted("canCancel"),
    next: QuestNextAction.CANCEL,
  },
  {
    name: "creates a review once the Quest completes",
    scenario: { actor: QuestActor.HIRER, state: "QUEST_COMPLETED" },
    granted: granted("canCreateReview"),
    next: QuestNextAction.CREATE_REVIEW,
  },
  {
    name: "creates a review once the Quest is cancelled",
    scenario: { actor: QuestActor.HIRER, state: "QUEST_CANCELLED" },
    granted: granted("canCreateReview"),
    next: QuestNextAction.CREATE_REVIEW,
  },
  {
    name: "decides an underfilled Quest before any other action",
    scenario: {
      actor: QuestActor.HIRER,
      underfilled: underfilled("UNDERFILLED_DECISION_PENDING"),
    },
    granted: granted("canCancel", "canDecideUnderfilled"),
    next: QuestNextAction.DECIDE_UNDERFILLED,
  },
  {
    name: "reads and writes the Work Conversation on an assigned Quest",
    scenario: {
      actor: QuestActor.HIRER,
      state: "QUEST_ASSIGNED",
      assignments: [ACTIVE],
      workConversation: CONVERSATION,
    },
    granted: granted(
      "canCancel",
      "canReadWorkChat",
      "canRequestEdit",
      "canWriteWorkChat"
    ),
    next: QuestNextAction.CANCEL,
  },
  {
    name: "does not offer the Worker's edit answer to the Hirer",
    scenario: {
      actor: QuestActor.HIRER,
      state: "QUEST_ASSIGNED",
      assignments: [ACTIVE],
      editRequest: editRequest("EDIT_REQUEST_PENDING", UNDECIDED),
    },
    granted: granted("canCancel", "canRequestEdit"),
    next: QuestNextAction.CANCEL,
  },
];

const prospectiveWorkerRows: MatrixRow[] = [
  {
    name: "joins an open FCFS Quest with a free seat",
    scenario: { actor: QuestActor.PROSPECTIVE_WORKER },
    granted: granted("canJoin"),
    next: QuestNextAction.JOIN,
  },
  {
    name: "cannot join an FCFS Quest whose only seat is taken",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      assignments: [ACTIVE],
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
  {
    name: "joins an FCFS Quest whose only seat was cancelled",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      assignments: [CANCELLED],
    },
    granted: granted("canJoin"),
    next: QuestNextAction.JOIN,
  },
  {
    name: "applies to an open SINGLE CANDIDATE Quest",
    scenario: { actor: QuestActor.PROSPECTIVE_WORKER, mode: "CANDIDATE" },
    granted: granted("canApply"),
    next: QuestNextAction.APPLY,
  },
  {
    name: "creates or joins a Team before a GROUP CANDIDATE Quest starts",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      now: BEFORE_START,
    },
    granted: granted("canCreateTeam", "canJoinTeam"),
    next: QuestNextAction.CREATE_TEAM,
  },
  {
    name: "cannot create or join a Team at the startTime boundary",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      now: AT_START,
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
  {
    name: "cannot create or join a Team once the Quest has started",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      now: DURING,
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
  {
    name: "Team Leader submits a full forming Team before start",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      teamRole: "LEADER",
      team: team(),
      now: BEFORE_START,
    },
    granted: granted(
      "canLeaveTeam",
      "canRegenerateTeamCode",
      "canRemoveTeamMember",
      "canSubmitTeam",
      "canUpdateTeam"
    ),
    next: QuestNextAction.SUBMIT_TEAM,
  },
  {
    name: "Team Leader below capacity manages the Team but cannot submit",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      teamRole: "LEADER",
      team: team({ members: [member(VIEWER)] }),
      now: BEFORE_START,
    },
    granted: granted(
      "canLeaveTeam",
      "canRegenerateTeamCode",
      "canRemoveTeamMember",
      "canUpdateTeam"
    ),
    next: QuestNextAction.NONE,
  },
  {
    name: "Team Member can only leave a forming Team",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      teamRole: "MEMBER",
      team: team({ leaderId: OTHER }),
      now: BEFORE_START,
    },
    granted: granted("canLeaveTeam"),
    next: QuestNextAction.NONE,
  },
  {
    name: "Team Leader can submit a full Team after startTime (submit is not time-gated)",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      teamRole: "LEADER",
      team: team(),
      now: DURING,
    },
    granted: granted(
      "canLeaveTeam",
      "canRegenerateTeamCode",
      "canRemoveTeamMember",
      "canSubmitTeam",
      "canUpdateTeam"
    ),
    next: QuestNextAction.SUBMIT_TEAM,
  },
  {
    name: "a submitted Team locks the Team Leader's actions",
    scenario: {
      actor: QuestActor.PROSPECTIVE_WORKER,
      mode: "CANDIDATE",
      participation: "GROUP",
      headcount: 2,
      teamRole: "LEADER",
      team: team({ state: "TEAM_SUBMITTED" }),
      now: BEFORE_START,
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
];

const candidateRows: MatrixRow[] = [
  {
    name: "withdraws an applied application on an open Quest",
    scenario: {
      actor: QuestActor.CANDIDATE,
      mode: "CANDIDATE",
      application: application("APPLICATION_APPLIED"),
    },
    granted: granted("canWithdrawApplication"),
    next: QuestNextAction.WITHDRAW_APPLICATION,
  },
  {
    name: "waits for Start Work after being selected",
    scenario: {
      actor: QuestActor.CANDIDATE,
      mode: "CANDIDATE",
      state: "QUEST_ASSIGNED",
      application: application("APPLICATION_SELECTED"),
    },
    granted: [],
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "has no action after the application is rejected",
    scenario: {
      actor: QuestActor.CANDIDATE,
      mode: "CANDIDATE",
      application: application("APPLICATION_REJECTED"),
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
];

const activeWorkerRows: MatrixRow[] = [
  {
    name: "starts work inside the startTime and dueAt window",
    scenario: { ...ACTIVE_WORKER },
    granted: granted("canStartWork"),
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "starts work exactly at startTime (inclusive)",
    scenario: { ...ACTIVE_WORKER, now: AT_START },
    granted: granted("canStartWork"),
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "cannot start work before startTime",
    scenario: { ...ACTIVE_WORKER, now: BEFORE_START },
    granted: [],
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "cannot start work exactly at dueAt (exclusive)",
    scenario: { ...ACTIVE_WORKER, now: AT_DUE },
    granted: [],
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "cannot start work after dueAt",
    scenario: { ...ACTIVE_WORKER, now: AFTER_DUE },
    granted: [],
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "cannot start work again once it is recorded",
    scenario: { ...ACTIVE_WORKER, assignment: STARTED, assignments: [STARTED] },
    granted: [],
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "answers a pending Quest Edit with no own response yet",
    scenario: {
      ...ACTIVE_WORKER,
      editRequest: editRequest("EDIT_REQUEST_PENDING", null),
    },
    granted: granted("canRespondToEdit", "canStartWork"),
    next: QuestNextAction.RESPOND_TO_EDIT,
  },
  {
    name: "offers Accept and Decline when the Worker's response decision is still null (#292)",
    scenario: {
      ...ACTIVE_WORKER,
      editRequest: editRequest("EDIT_REQUEST_PENDING", UNDECIDED),
    },
    granted: granted("canRespondToEdit", "canStartWork"),
    next: QuestNextAction.RESPOND_TO_EDIT,
  },
  {
    name: "treats an omitted own response as undecided (#292)",
    scenario: {
      ...ACTIVE_WORKER,
      editRequest: editRequest("EDIT_REQUEST_PENDING"),
    },
    granted: granted("canRespondToEdit", "canStartWork"),
    next: QuestNextAction.RESPOND_TO_EDIT,
  },
  {
    name: "does not offer Accept or Decline to a Worker whose Assignment is no longer active, even with decision null (nextAction still says RESPOND_TO_EDIT, as coded)",
    scenario: {
      actor: QuestActor.WORKER,
      state: "QUEST_ASSIGNED",
      assignment: CANCELLED,
      assignments: [CANCELLED],
      editRequest: editRequest("EDIT_REQUEST_PENDING", UNDECIDED),
    },
    granted: [],
    next: QuestNextAction.RESPOND_TO_EDIT,
  },
  {
    name: "stops offering the edit answer once the Worker decides, but nextAction stays RESPOND_TO_EDIT while the request is pending (as coded)",
    scenario: {
      ...ACTIVE_WORKER,
      editRequest: editRequest("EDIT_REQUEST_PENDING", ACCEPTED),
    },
    granted: granted("canStartWork"),
    next: QuestNextAction.RESPOND_TO_EDIT,
  },
  {
    name: "stops offering the edit answer once the request is applied",
    scenario: {
      ...ACTIVE_WORKER,
      editRequest: editRequest("EDIT_REQUEST_APPLIED", null),
    },
    granted: granted("canStartWork"),
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "confirms completion of an in-progress Quest without required proof",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      proofRequired: false,
    },
    granted: granted("canConfirmCompletion"),
    next: QuestNextAction.CONFIRM_COMPLETION,
  },
  {
    name: "submits required proof for an in-progress Quest",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      proofRequired: true,
    },
    granted: granted("canSubmitProof"),
    next: QuestNextAction.SUBMIT_PROOF,
  },
  {
    name: "keeps an unsubmitted proof draft editable",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      proofs: [proof({ submittedByUserId: VIEWER, workerId: VIEWER })],
    },
    granted: granted("canSubmitProof"),
    next: QuestNextAction.SUBMIT_PROOF,
  },
  {
    name: "locks proof once it is submitted",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      proofs: [
        proof({
          submittedByUserId: VIEWER,
          workerId: VIEWER,
          status: "PROOF_PENDING",
          submittedAt: START_ISO,
        }),
      ],
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
  {
    name: "a Team proof sent by the Team Leader locks the Team Leader's submission",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      mode: "CANDIDATE",
      participation: "GROUP",
      teamRole: "LEADER",
      team: team({ leaderId: VIEWER, state: "TEAM_SELECTED" }),
      proofs: [
        proof({
          submittedByUserId: OTHER,
          workerId: null,
          teamId: "team-1",
          status: "PROOF_PENDING",
          submittedAt: START_ISO,
        }),
      ],
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
  {
    name: "Team Member cannot submit proof for a GROUP CANDIDATE Team",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      mode: "CANDIDATE",
      participation: "GROUP",
      teamRole: "MEMBER",
      team: team({ leaderId: OTHER, state: "TEAM_SELECTED" }),
    },
    granted: [],
    next: QuestNextAction.NONE,
  },
  {
    name: "Team Leader submits proof for a GROUP CANDIDATE Team",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      mode: "CANDIDATE",
      participation: "GROUP",
      teamRole: "LEADER",
      team: team({ leaderId: VIEWER, state: "TEAM_SELECTED" }),
    },
    granted: granted("canSubmitProof"),
    next: QuestNextAction.SUBMIT_PROOF,
  },
  {
    name: "an unreadable Team keeps Leader-only actions open (UNKNOWN role)",
    scenario: {
      ...ACTIVE_WORKER,
      state: "QUEST_IN_PROGRESS",
      mode: "CANDIDATE",
      participation: "GROUP",
      teamRole: "UNKNOWN",
      team: null,
    },
    granted: granted("canSubmitProof"),
    next: QuestNextAction.SUBMIT_PROOF,
  },
  {
    name: "consents to an underfilled continuation while Active",
    scenario: {
      ...ACTIVE_WORKER,
      underfilled: underfilled("UNDERFILLED_CONSENT_PENDING"),
    },
    granted: granted("canConsentUnderfilled", "canStartWork"),
    next: QuestNextAction.CONSENT_UNDERFILLED,
  },
  {
    name: "reads and writes the Work Conversation while Active",
    scenario: { ...ACTIVE_WORKER, workConversation: CONVERSATION },
    granted: granted("canReadWorkChat", "canStartWork", "canWriteWorkChat"),
    next: QuestNextAction.WAIT_FOR_START,
  },
  {
    name: "reads but cannot write the Work Conversation after completion",
    scenario: {
      actor: QuestActor.WORKER,
      state: "QUEST_COMPLETED",
      assignment: COMPLETED,
      assignments: [COMPLETED],
      workConversation: CONVERSATION,
    },
    granted: granted("canCreateReview", "canReadWorkChat"),
    next: QuestNextAction.CREATE_REVIEW,
  },
];

describe("deriveQuestCapabilities and deriveQuestNextAction", () => {
  describe.each([
    ["Hirer", hirerRows],
    ["Prospective Worker and Team Leader", prospectiveWorkerRows],
    ["Candidate", candidateRows],
    ["Active Worker", activeWorkerRows],
  ])("%s", (_actor, rows) => {
    it.each(rows)("$name", ({ scenario, granted: expected, next }) => {
      expect(resolve(scenario)).toEqual({
        granted: expected,
        nextAction: next,
      });
    });
  });

  describe("purity (ADR 0012)", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("reads no device clock; the supplied now alone decides time gates", () => {
      jest.spyOn(Date, "now").mockImplementation(() => {
        throw new Error("clock read");
      });
      const before = resolve({ ...ACTIVE_WORKER, now: BEFORE_START });
      const atStart = resolve({ ...ACTIVE_WORKER, now: AT_START });

      expect(before.granted).toEqual([]);
      expect(atStart.granted).toEqual(granted("canStartWork"));
    });

    it("returns the same result for identical input", () => {
      const scenario: Scenario = { ...ACTIVE_WORKER, now: DURING };

      expect(resolve(scenario)).toEqual(resolve(scenario));
    });
  });
});
