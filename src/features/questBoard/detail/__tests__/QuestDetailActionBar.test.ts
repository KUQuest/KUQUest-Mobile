import {
  QuestCandidateMode,
  QuestStatus,
  type QuestBoardQuest,
} from "../../domain/types";
import {
  buildQuestDetailActionBar,
  type QuestDetailPresentationContext,
  type QuestDetailPresentationFacts,
} from "../questDetailPresentation";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { groupQuestMessages } from "@/locales/groupQuestMessages";

function makeQuest(status: QuestStatus): QuestBoardQuest {
  return {
    id: "quest-1",
    title: "Test Quest",
    tags: [],
    description: "Description",
    completionCriteria: "Submit proof",
    proofRequired: "required",
    rewardPerPerson: 100,
    rewardSatang: 10000,
    headcount: 1,
    acceptedParticipants: 1,
    startDate: "2026-09-21T09:00:00.000Z",
    deadline: "2026-09-22T12:00:00.000Z",
    postedAt: "2026-09-20T09:00:00.000Z",
    location: "KU Library",
    locationMode: "on-campus",
    participationMode: "single",
    candidateMode: QuestCandidateMode.NO_CANDIDATE,
    creator: { name: "Hirer" },
    studentInterestMatch: false,
    ownerStudentId: "hirer-1",
    status,
  };
}

describe("buildQuestDetailActionBar", () => {
  const mockOpenEditPost = jest.fn();
  const mockOpenMessageOwner = jest.fn();
  const mockLeaveQuest = jest.fn();
  const mockOpenConfirmation = jest.fn();

  function makeContext(
    overrides: Partial<QuestDetailPresentationFacts> = {}
  ): QuestDetailPresentationContext {
    const facts = {
      quest: makeQuest(QuestStatus.QUEST_COMPLETED),
      source: { kind: "live-detail" },
      projection: null,
      activePrototypeState: null,
      liveSnapshot: {
        state: "QUEST_COMPLETED",
        capabilities: {
          canApply: false,
          canWithdraw: false,
          canReviewProof: false,
          canCreateReview: true,
          canDecideUnderfilled: false,
          canProposeConditionEdit: false,
        },
        assignments: [],
        applications: [],
        teams: [],
        proofs: [],
        workConversation: null,
        editRequest: null,
        nextAction: null,
      },
      locale: "en",
      messages: questBoardMessages.en,
      groupMessages: groupQuestMessages.en,
      viewerId: "hirer-1",
      routeIntentKey: "post",
      isJoinView: false,
      isPostView: true,
      isHirerView: true,
      firstCome: true,
      candidateGroup: false,
      imageUris: [],
      participants: [],
      participantCount: 1,
      previewApplicationStatus: "none",
      availability: "closed",
      joinedStatus: "history",
      canApply: false,
      canShowWithdraw: false,
      confirmationOpen: false,
      canMessageOwner: false,
      canReportQuest: false,
      ...overrides,
    } as unknown as QuestDetailPresentationFacts;

    return {
      facts,
      surface: {
        liveAction: null,
        leftQuest: false,
        manualConfirmationOpen: false,
        candidateReviewSheetOpen: false,
        partialStartSheetDismissed: false,
        teamSearchQuery: "",
        teamSelectedMemberIds: [],
        teamReviewing: false,
        selectedProposalId: null,
        fixtureRevision: 0,
      },
      transitions: {
        beginLiveAction: jest.fn(),
        endLiveAction: jest.fn(),
        markJoined: jest.fn(),
        markLeft: jest.fn(),
        openConfirmation: mockOpenConfirmation,
        closeConfirmation: jest.fn(),
        dismissIntent: jest.fn(),
        openCandidateReview: jest.fn(),
        closeCandidateReview: jest.fn(),
        dismissPartialConsent: jest.fn(),
        reopenPartialConsent: jest.fn(),
        setTeamSearchQuery: jest.fn(),
        setTeamSelectedMemberIds: jest.fn(),
        setTeamReviewing: jest.fn(),
        selectProposal: jest.fn(),
        markFixtureChanged: jest.fn(),
      },
      navigation: {
        handleBack: jest.fn(),
        openParticipantProfile: jest.fn(),
        openWorkHub: jest.fn(),
        openTeam: jest.fn(),
        openEditPost: mockOpenEditPost,
        openReportQuest: jest.fn(),
        openMessageOwner: mockOpenMessageOwner,
      },
      leaveQuest: mockLeaveQuest,
    } as unknown as QuestDetailPresentationContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("enables canReview for a terminal Hirer view with review capabilities", () => {
    const context = makeContext();
    const actionBar = buildQuestDetailActionBar(context);

    expect(actionBar.canReview).toBe(true);
    expect(actionBar.canEditPost).toBe(false);
  });

  it("enables canEditPost and disables canReview for draft Quests", () => {
    const context = makeContext({
      quest: makeQuest(QuestStatus.QUEST_DRAFT),
      liveSnapshot: null,
    });
    const actionBar = buildQuestDetailActionBar(context);

    expect(actionBar.canEditPost).toBe(true);
    expect(actionBar.canReview).toBe(false);
  });

  it("disables canReview when user is worker (isHirerView is false)", () => {
    const context = makeContext({
      isHirerView: false,
      isPostView: false,
    });
    const actionBar = buildQuestDetailActionBar(context);

    expect(actionBar.canReview).toBe(false);
  });

  it("disables canReview when Quest is in-progress (non-terminal)", () => {
    const context = makeContext({
      quest: makeQuest(QuestStatus.QUEST_IN_PROGRESS),
    });
    const actionBar = buildQuestDetailActionBar(context);

    expect(actionBar.canReview).toBe(false);
  });

  it("disables canReview when the live snapshot withholds the review capability", () => {
    const context = makeContext({
      liveSnapshot: {
        capabilities: { canCreateReview: false },
      } as unknown as QuestDetailPresentationFacts["liveSnapshot"],
    });
    const actionBar = buildQuestDetailActionBar(context);

    expect(actionBar.canReview).toBe(false);
  });
});
