import React from "react";
import { act, fireEvent } from "@testing-library/react-native";

import { renderWithQueryClient as render } from "@/testing/queryTestUtils";

import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import type { QuestV2EditRequest } from "@/api/questV2Contracts";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";
import HirerQuestManageRoute from "../manage";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn().mockResolvedValue({ user: { id: "hirer-1" } }),
  },
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: React.ReactNode;
  }) => (visible ? <>{children}</> : null),
}));

jest.mock("@/features/questBoard/live/liveQuestService", () => {
  const actual = jest.requireActual(
    "@/features/questBoard/live/liveQuestService"
  );
  return {
    ...actual,
    liveQuestService: {
      getLiveSnapshot: jest.fn(),
      createEditRequest: jest.fn(),
    },
  };
});

function createSnapshot(
  overrides: Partial<LiveQuestSnapshot> = {}
): LiveQuestSnapshot {
  return {
    viewerId: "hirer-1",
    actor: "HIRER",
    quest: {
      id: "quest-1",
      title: "Campus Mural Project",
      description: "Paint a mural",
      condition: {
        items: [
          { position: 0, text: "Finish the mural" },
          { position: 1, text: "Clean the wall" },
        ],
      },
      tag: null,
      mode: "CANDIDATE",
      participation: "SINGLE",
      state: "QUEST_ASSIGNED",
      questReward: 500,
      headcount: 1,
      activeWorkerCount: 1,
      startTime: "2026-10-01T09:00:00.000+07:00",
      dueAt: "2026-10-02T12:00:00.000+07:00",
      proofRequired: false,
      hirerName: "Prof Oak",
      locations: [{ label: "Main Campus" }],
      images: [],
      hasJoined: false,
      assignmentId: null,
      assignmentStatus: null,
    },
    state: "QUEST_ASSIGNED",
    mode: "CANDIDATE",
    participation: "SINGLE",
    assignment: null,
    assignments: [],
    application: null,
    applications: [],
    team: null,
    teams: [],
    underfilled: null,
    editRequest: null,
    proofs: [],
    workConversation: null,
    proofRequired: false,
    dueAt: "2026-10-02T12:00:00.000+07:00",
    nextAction: "NONE",
    capabilities: {
      canJoin: false,
      canApply: false,
      canWithdrawApplication: false,
      canCreateTeam: false,
      canJoinTeam: false,
      canUpdateTeam: false,
      canLeaveTeam: false,
      canRemoveTeamMember: false,
      canRegenerateTeamCode: false,
      canSubmitTeam: false,
      canSelectCandidate: false,
      canSelectTeam: false,
      canRejectCandidate: false,
      canRejectTeam: false,
      canDecideUnderfilled: false,
      canConsentUnderfilled: false,
      canRequestEdit: true,
      canRespondToEdit: false,
      canReadWorkChat: false,
      canWriteWorkChat: false,
      canSubmitProof: false,
      canStartWork: false,
      canConfirmCompletion: false,
      canCancel: true,
      canReviewProof: false,
      canCreateReview: false,
      canUpdateReview: false,
    },
    ...overrides,
  };
}

function makeEditRequest(
  overrides: Partial<QuestV2EditRequest> = {}
): QuestV2EditRequest {
  return {
    requestId: "edit-1",
    questId: "quest-1",
    status: "EDIT_REQUEST_PENDING",
    failureCode: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    appliedAt: null,
    failedAt: null,
    previousCondition: { items: [{ position: 0, text: "Finish the mural" }] },
    proposedCondition: {
      items: [{ position: 0, text: "Finish the mural in blue" }],
    },
    responseSummary: {
      totalCount: 1,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: 1,
    },
    ...overrides,
  };
}

describe("HirerQuestManageRoute condition edit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the propose-changes action on an assigned Quest with no pending edit", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot()
    );
    const view = await render(<HirerQuestManageRoute />);
    await view.findByTestId("hirer-manage-condition-edit");

    expect(view.getByTestId("hirer-manage-condition-edit")).toBeTruthy();
    expect(view.queryByTestId("hirer-condition-edit-pending-title")).toBeNull();
  });

  it("does not offer condition edits while a published Quest is open", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: "QUEST_OPEN",
        quest: {
          ...createSnapshot().quest,
          state: "QUEST_OPEN",
        },
      })
    );
    const view = await render(<HirerQuestManageRoute />);
    await view.findByTestId("hirer-manage-cancel");

    expect(view.queryByTestId("hirer-manage-condition-edit")).toBeNull();
  });

  it("opens the composer, submits a proposal, and refreshes with the new pending edit", async () => {
    const pendingSnapshot = createSnapshot({
      editRequest: makeEditRequest(),
    });
    (liveQuestService.getLiveSnapshot as jest.Mock)
      .mockResolvedValueOnce(createSnapshot())
      .mockResolvedValue(pendingSnapshot);
    (liveQuestService.createEditRequest as jest.Mock).mockResolvedValue(
      pendingSnapshot.editRequest
    );

    const view = await render(<HirerQuestManageRoute />);
    await view.findByTestId("hirer-manage-condition-edit");

    await fireEvent.press(view.getByTestId("hirer-manage-condition-edit"));
    await fireEvent.changeText(
      view.getByTestId("quest-condition-item-0"),
      "Finish the mural in blue"
    );
    await fireEvent.press(view.getByTestId("quest-condition-submit"));

    expect(liveQuestService.createEditRequest).toHaveBeenCalledWith(
      "quest-1",
      { condition: { items: ["Finish the mural in blue", "Clean the wall"] } },
      expect.any(String)
    );
    await view.findByTestId("hirer-condition-edit-pending-title");
    expect(view.queryByTestId("hirer-manage-condition-edit")).toBeNull();
  });

  it("hides the propose-changes action while an edit request is already pending", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        editRequest: makeEditRequest({
          responseSummary: {
            totalCount: 1,
            acceptedCount: 1,
            declinedCount: 0,
            pendingCount: 0,
          },
        }),
      })
    );
    const view = await render(<HirerQuestManageRoute />);
    await view.findByTestId("hirer-condition-edit-progress");

    expect(view.queryByTestId("hirer-manage-condition-edit")).toBeNull();
    expect(
      view.getByTestId("hirer-condition-edit-progress").props.children
    ).toBe("1 of 1 Workers responded");
  });

  it("does not offer the propose-changes action once the Quest leaves QUEST_ASSIGNED", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: "QUEST_IN_PROGRESS",
        quest: {
          ...createSnapshot().quest,
          state: "QUEST_IN_PROGRESS",
        },
      })
    );
    const view = await render(<HirerQuestManageRoute />);
    await act(async () => undefined);
    await act(async () => undefined);

    expect(view.queryByTestId("hirer-manage-condition-edit")).toBeNull();
  });

  it("renders a file dispute action when the Quest state is QUEST_FAILED and navigates to dispute", async () => {
    mockPush.mockClear();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: "QUEST_FAILED",
        quest: {
          ...createSnapshot().quest,
          state: "QUEST_FAILED",
        },
      })
    );
    const view = await render(<HirerQuestManageRoute />);
    const disputeButton = await view.findByTestId("hirer-manage-dispute");
    expect(disputeButton).toBeTruthy();
    fireEvent.press(disputeButton);
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/dispute",
      params: { id: "quest-1" },
    });
  });

  it("does not render the dispute action for non-failed Quests", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: "QUEST_ASSIGNED",
      })
    );
    const view = await render(<HirerQuestManageRoute />);
    await act(async () => undefined);
    expect(view.queryByTestId("hirer-manage-dispute")).toBeNull();
  });
});
