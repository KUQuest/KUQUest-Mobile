import { act, renderHook, waitFor } from "@testing-library/react-native";
import { CircleAlert } from "lucide-react-native";

import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { QuestCandidateMode, QuestStatus } from "../../domain/types";
import type {
  QuestDetailLiveActions,
  QuestDetailPreviewActions,
} from "../questDetailActions";
import { useQuestDetailCandidateActions } from "../useQuestDetailCandidateActions";
import type { QuestDetailPresentationFacts } from "../questDetailPresentation";
import type { QuestDetailNavigation } from "../useQuestDetailNavigation";
import type { QuestDetailSurfaceTransitions } from "../useQuestDetailSurfaceState";

const mockShowConfirm = jest.fn();

jest.mock("@/components/ui/SweetAlert", () => ({
  showConfirmModal: (options: unknown) => mockShowConfirm(options),
}));

const failedFixtureResult = {
  ok: false as const,
  error: { code: "NOT_FOUND" as const, message: "not used" },
};

function makeFacts(): QuestDetailPresentationFacts {
  return {
    quest: {
      id: "quest-1",
      title: "Campus Quest",
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
      status: QuestStatus.QUEST_OPEN,
    },
    source: { kind: "live-snapshot", snapshot: null },
    projection: null,
    activePrototypeState: null,
    liveSnapshot: null,
    locale: "en",
    messages: questBoardMessages.en,
    groupMessages: groupQuestMessages.en,
    viewerId: "hirer-1",
    routeIntentKey: "post",
    isJoinView: false,
    isPostView: true,
    isHirerView: true,
    firstCome: false,
    candidateGroup: false,
    imageUris: [],
    participants: [],
    participantCount: 0,
    previewApplicationStatus: "none",
    availability: "available",
    joinedStatus: undefined,
    canApply: false,
    canShowWithdraw: false,
    confirmationOpen: false,
    canMessageOwner: false,
    statusTitle: "Open",
    statusDescription: "Open Quest",
    statusIsUnavailable: false,
    statusIcon: CircleAlert,
    statusIconColor: "",
    teamSheetTeam: undefined,
    teamDirectory: [],
    liveTeamSheetTeam: null,
    liveTeamSurface: false,
    refreshing: false,
  };
}

describe("live Candidate selection from Quest Detail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("waits for confirmation, then closes review and opens Manage after selection", async () => {
    const selectProposal = jest.fn().mockResolvedValue({ id: "assignment-1" });
    const closeCandidateReview = jest.fn();
    const openManage = jest.fn();
    const liveActions: QuestDetailLiveActions = {
      join: async () => undefined,
      apply: async () => undefined,
      withdraw: async () => undefined,
      createCandidateInquiry: async () => ({ id: "conversation-1" }),
      selectProposal,
      rejectProposal: async () => undefined,
      decideUnderfilled: async () => undefined,
      respondUnderfilled: async () => undefined,
      createTeam: async () => undefined,
      joinTeam: async () => undefined,
      leaveTeam: async () => undefined,
      removeTeamMember: async () => undefined,
      regenerateTeamCode: async () => undefined,
      updateTeamName: async () => undefined,
      submitTeam: async () => undefined,
      uploadTeamFile: async () => ({ id: "file-1", name: "file.pdf" }),
    };
    const navigation: QuestDetailNavigation = {
      handleBack: jest.fn(),
      openParticipantProfile: jest.fn(),
      openWorkHub: jest.fn(),
      openManage,
      openProofReview: jest.fn(),
      openTeam: jest.fn(),
      openPartialStart: jest.fn(),
      openEditPost: jest.fn(),
      openMessageOwner: jest.fn(),
    };
    const transitions: QuestDetailSurfaceTransitions = {
      beginLiveAction: () => true,
      endLiveAction: jest.fn(),
      markJoined: jest.fn(),
      markLeft: jest.fn(),
      openConfirmation: jest.fn(),
      closeConfirmation: jest.fn(),
      dismissIntent: jest.fn(),
      openCandidateReview: jest.fn(),
      closeCandidateReview,
      setTeamSearchQuery: jest.fn(),
      setTeamSelectedMemberIds: jest.fn(),
      setTeamReviewing: jest.fn(),
      selectProposal: jest.fn(),
      markFixtureChanged: jest.fn(),
    };
    const previewActions: QuestDetailPreviewActions = {
      directJoin: () => failedFixtureResult,
      apply: () => failedFixtureResult,
      withdraw: () => failedFixtureResult,
      createTeam: () => failedFixtureResult,
      inviteMembers: () => failedFixtureResult,
      submitTeam: () => failedFixtureResult,
      respondInvitation: () => failedFixtureResult,
      votePartialStart: () => failedFixtureResult,
      selectProposal: () => failedFixtureResult,
      rejectProposal: () => failedFixtureResult,
      searchMembers: () => [],
    };
    const { result } = await renderHook(() =>
      useQuestDetailCandidateActions({
        facts: makeFacts(),
        liveActions,
        previewActions,
        navigation,
        transitions,
      })
    );

    await act(async () => {
      result.current.selectCandidate("application-1");
    });

    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: questBoardMessages.en.confirmSelectCandidateTitle,
        message: questBoardMessages.en.confirmSelectCandidateMessage,
        confirmLabel: groupQuestMessages.en.selectProposal,
        cancelLabel: groupQuestMessages.en.cancel,
      })
    );
    expect(selectProposal).not.toHaveBeenCalled();

    const confirmation = mockShowConfirm.mock.calls[0]?.[0] as {
      onConfirm: () => void | Promise<void>;
    };
    await act(async () => {
      await Promise.all([confirmation.onConfirm(), confirmation.onConfirm()]);
    });

    await waitFor(() => {
      expect(selectProposal).toHaveBeenCalledWith("application-1");
      expect(closeCandidateReview).toHaveBeenCalledTimes(1);
      expect(openManage).toHaveBeenCalledTimes(1);
    });
  });
});
