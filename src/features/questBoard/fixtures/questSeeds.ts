import { questFixtures } from "./questFixtures";
import { DEFAULT_PROTOTYPE_VIEWER_ID, PROTOTYPE_NOW } from "./constants";
import {
  DEFAULT_REWORK_LIMIT,
  EDIT_CONSENT_WINDOW_MS,
} from "../domain/constants";
import {
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestCandidateMode,
  QuestEditRequestStatus,
  QuestProofStatus,
  QuestStatus,
  QuestTeamStatus,
  type QuestApplication,
  type QuestAssignment,
  type QuestBoardQuest,
  type QuestContract,
  type QuestDetailState,
  type QuestProof,
  type QuestStatus as QuestStatusValue,
  type QuestTeam,
  type QuestTeamMember,
} from "../domain/types";
import { addMilliseconds } from "../domain/questStateUtils";
import { createState } from "./questValidation";
import { ensureConversation } from "./chatProjection";
import {
  openPartialStartConsent,
  setActualHeadcount,
  settlementFor,
} from "../domain/questSelectors";

export interface FixtureSeed {
  state: QuestDetailState;
  conversationMemberIds: string[];
}
// Static quest scenarios and seed-state generators live here.
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
    "hirer-home-progress-demo": QuestStatus.QUEST_IN_PROGRESS,
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

  const hirerHomeProgress = get("hirer-home-progress-demo");
  hirerHomeProgress.state.assignments.push(
    assignment(hirerHomeProgress.state.quest, "demo-worker-1", "APPLICATION")
  );
  ensureConversation(hirerHomeProgress.state, [
    hirerHomeProgress.state.quest.hirerId,
    "demo-worker-1",
  ]);
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

  // Completion fixtures are adapter-only records. They cover every supported
  // combination of proof requirement, participation, and selection mode.
  const completionMockDefinitions = [
    {
      id: "proof-in-progress-demo",
      title: "Submit a project proof",
      proofRequired: "required",
      participationMode: "single",
      candidateMode: QuestCandidateMode.NO_CANDIDATE,
      headcount: 1,
    },
    {
      id: "proof-free-in-progress-demo",
      title: "Confirm a proof-free Quest",
      proofRequired: "none",
      participationMode: "single",
      candidateMode: QuestCandidateMode.NO_CANDIDATE,
      headcount: 1,
    },
    {
      id: "proof-candidate-in-progress-demo",
      title: "Submit proof for a selected Candidate Quest",
      proofRequired: "required",
      participationMode: "single",
      candidateMode: QuestCandidateMode.CANDIDATE,
      headcount: 1,
    },
    {
      id: "proof-free-candidate-in-progress-demo",
      title: "Confirm a selected Candidate Quest",
      proofRequired: "none",
      participationMode: "single",
      candidateMode: QuestCandidateMode.CANDIDATE,
      headcount: 1,
    },
    {
      id: "proof-group-in-progress-demo",
      title: "Submit proof for a direct group Quest",
      proofRequired: "required",
      participationMode: "team",
      candidateMode: QuestCandidateMode.NO_CANDIDATE,
      headcount: 2,
    },
    {
      id: "proof-free-group-in-progress-demo",
      title: "Confirm a direct group Quest",
      proofRequired: "none",
      participationMode: "team",
      candidateMode: QuestCandidateMode.NO_CANDIDATE,
      headcount: 2,
    },
    {
      id: "proof-team-in-progress-demo",
      title: "Submit proof for a selected Team Quest",
      proofRequired: "required",
      participationMode: "team",
      candidateMode: QuestCandidateMode.CANDIDATE,
      headcount: 2,
    },
    {
      id: "proof-free-team-in-progress-demo",
      title: "Confirm a selected Team Quest",
      proofRequired: "none",
      participationMode: "team",
      candidateMode: QuestCandidateMode.CANDIDATE,
      headcount: 2,
    },
  ] as const;

  completionMockDefinitions.forEach((definition) => {
    const fixture: QuestBoardQuest = {
      id: definition.id,
      title: definition.title,
      tags: ["completion"],
      description:
        definition.proofRequired === "required"
          ? "Submit completion evidence for this Quest."
          : "Confirm the completed work for this Quest.",
      completionCriteria: "The assigned work is complete.",
      proofRequired: definition.proofRequired,
      rewardPerPerson: definition.headcount === 1 ? 350 : 220,
      rewardSatang: definition.headcount === 1 ? 35000 : 22000,
      headcount: definition.headcount,
      acceptedParticipants: definition.headcount,
      startDate: "2026-08-11",
      deadline: "2026-08-15",
      timeRange: "09:00–12:00",
      postedAt: PROTOTYPE_NOW,
      location: "Online",
      locationMode: "online",
      participationMode: definition.participationMode,
      candidateMode: definition.candidateMode,
      creator: { name: "Demo Hirer" },
      imageUris: [],
      studentInterestMatch: false,
      ownerStudentId: "demo-hirer",
    };
    const state = createState(fixture, QuestStatus.QUEST_IN_PROGRESS);
    const isGroup = definition.participationMode === "team";
    const isCandidate =
      definition.candidateMode === QuestCandidateMode.CANDIDATE;
    const workerIds = isGroup
      ? [DEFAULT_PROTOTYPE_VIEWER_ID, "demo-worker-2"]
      : [DEFAULT_PROTOTYPE_VIEWER_ID];
    const teamMembers: QuestTeamMember[] = [
      {
        workerId: DEFAULT_PROTOTYPE_VIEWER_ID,
        role: "LEADER",
        displayName: "Demo Student",
      },
      ...(isGroup
        ? [
            {
              workerId: "demo-worker-2",
              role: "MEMBER" as const,
              displayName: "Demo Worker 2",
            },
          ]
        : []),
    ];
    const selectedTeam =
      isGroup && isCandidate
        ? makeTeam(
            state.quest,
            DEFAULT_PROTOTYPE_VIEWER_ID,
            teamMembers,
            QuestTeamStatus.TEAM_SELECTED,
            "completion"
          )
        : undefined;
    if (selectedTeam) state.teams.push(selectedTeam);
    const selectedApplication = isCandidate
      ? application(
          state.quest.id,
          selectedTeam ? undefined : DEFAULT_PROTOTYPE_VIEWER_ID,
          QuestApplicationStatus.APPLICATION_SELECTED,
          selectedTeam?.id,
          selectedTeam ? "completion-team" : "completion-single"
        )
      : undefined;
    if (selectedApplication) state.applications.push(selectedApplication);
    state.assignments.push(
      ...workerIds.map((workerId, index) =>
        assignment(
          state.quest,
          workerId,
          selectedTeam
            ? "TEAM"
            : selectedApplication
              ? "APPLICATION"
              : "DIRECT_JOIN",
          QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
          `${workerId}-${index + 1}`,
          selectedApplication?.id,
          selectedTeam?.id
        )
      )
    );
    setActualHeadcount(state);
    state.settlement = settlementFor(state, workerIds.length);
    ensureConversation(state, [state.quest.hirerId, ...workerIds]);
    seeds.push({
      state,
      conversationMemberIds: [...(state.conversationMemberIds ?? [])],
    });
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
    ...questFixtures.find((fixture) => fixture.id === "play-badminton")!,
    id: "worker-history-demo",
    title: "Review a completed project",
    ownerStudentId: "demo-hirer",
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
export {
  application,
  assignment,
  createDraftState,
  makeTeam,
  proof,
  seedStates,
};
