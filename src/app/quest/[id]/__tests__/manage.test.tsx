import React from "react";
import {
  act,
  fireEvent,
  render as renderUI,
  waitFor,
  within,
} from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { renderWithQueryClient as render } from "@/testing/queryTestUtils";
import { ApiError } from "@/api/ApiClient";

import { AppThemeProvider } from "@/features/workspace/AppThemeProvider";
import { SweetAlertHost } from "@/components/ui/SweetAlert";
import { myQuestMessages } from "@/locales/myQuestMessages";
import { alertMessages } from "@/locales/alertMessages";
import type { QuestV2EditRequest } from "@/api/questV2Contracts";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";
import {
  QuestActor,
  QuestApplicationStatus,
  QuestAssignmentStatus,
  QuestMode,
  QuestNextAction,
  QuestParticipation,
  QuestStatus,
} from "@/features/questBoard/domain/types";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import HirerQuestManageRoute from "../manage";

interface GestureMockChain {
  onUpdate: () => GestureMockChain;
  onEnd: () => GestureMockChain;
  enabled: () => GestureMockChain;
}

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockConfirmFileDispute = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

jest.mock("react-native-gesture-handler", () => {
  const { View } = jest.requireActual("react-native");
  const chain: GestureMockChain = {
    onUpdate: () => chain,
    onEnd: () => chain,
    enabled: () => chain,
  };
  return {
    Gesture: { Pan: () => chain },
    GestureDetector: ({ children }: { children: React.ReactNode }) => children,
    GestureHandlerRootView: View,
  };
});

jest.mock("@/features/questBoard/dispute/useFileDispute", () => ({
  useFileDispute: () => ({ confirmFileDispute: mockConfirmFileDispute }),
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
      cancelQuest: jest.fn(),
      getCancelPreview: jest.fn(),
      selectApplication: jest.fn(),
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
    (liveQuestService.cancelQuest as jest.Mock).mockResolvedValue({
      paidSatang: 0,
      refundedSatang: 0,
    });
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

  it("opens Work Chat through the accessible Quest action row", async () => {
    const snapshot = createSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        workConversation: {
          id: "conversation-1",
          type: "CONVERSATION_WORK",
          quest: {
            id: "quest-1",
            title: "Campus Mural Project",
            status: QuestStatus.QUEST_ASSIGNED,
          },
          latestMessage: null,
          lastActivityAt: null,
          archived: false,
          readOnly: false,
          unreadCount: 0,
        },
        capabilities: {
          ...snapshot.capabilities,
          canReadWorkChat: true,
        },
      })
    );
    mockPush.mockClear();

    const view = await render(<HirerQuestManageRoute />);
    const chatAction = await view.findByRole("button", {
      name: "Open Work Chat",
    });
    await fireEvent.press(chatAction);

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/chat/[id]",
      params: {
        id: "conversation-1",
        conversationId: "conversation-1",
        questId: "quest-1",
        viewerId: "hirer-1",
        questTitle: "Campus Mural Project",
      },
    });
  });

  it("delegates failed-Quest dispute action to confirmation workflow", async () => {
    mockPush.mockClear();
    mockConfirmFileDispute.mockClear();
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
    await fireEvent.press(disputeButton);
    expect(mockConfirmFileDispute).toHaveBeenCalledWith("quest-1");
    expect(mockPush).not.toHaveBeenCalled();
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
  it("ASSIGNED cancel uses slide confirmation and IN_PROGRESS requires the keyword", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot()
    );
    const assigned = await render(<HirerQuestManageRoute />);
    await fireEvent.press(await assigned.findByTestId("hirer-manage-cancel"));
    expect(await assigned.findByTestId("cancel-quest-guardrail")).toBeTruthy();
    expect(
      within(assigned.getByTestId("cancel-quest-guardrail")).getByText(
        myQuestMessages.en.cancelAssignedDescription
      )
    ).toBeTruthy();
    await assigned.unmount();

    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_IN_PROGRESS,
        quest: {
          ...createSnapshot().quest,
          state: QuestStatus.QUEST_IN_PROGRESS,
        },
      })
    );
    const inProgress = await render(<HirerQuestManageRoute />);
    await fireEvent.press(await inProgress.findByTestId("hirer-manage-cancel"));
    const confirm = await inProgress.findByTestId("cancel-guardrail-confirm");
    expect(confirm.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(
      inProgress.getByLabelText(myQuestMessages.en.cancelGuardrailKeywordLabel),
      "CANCEL"
    );
    expect(
      inProgress.getByTestId("cancel-guardrail-confirm").props
        .accessibilityState.disabled
    ).toBe(false);
  });

  it("OPEN cancel still uses the confirmation dialog", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_OPEN,
        quest: { ...createSnapshot().quest, state: QuestStatus.QUEST_OPEN },
      })
    );
    const view = await render(
      <>
        <HirerQuestManageRoute />
        <SweetAlertHost />
      </>
    );
    const cancelAction = await view.findByRole("button", {
      name: myQuestMessages.en.cancelQuest,
    });
    expect(cancelAction.props.accessibilityHint).toBe(
      myQuestMessages.en.cancelOpenDescription
    );
    await fireEvent.press(cancelAction);
    expect(
      await view.findByText(myQuestMessages.en.cancelConfirmTitle)
    ).toBeTruthy();
    within(view.getByTestId("sweet-alert")).getByText(
      myQuestMessages.en.cancelOpenDescription
    );
    expect(view.queryByTestId("cancel-quest-guardrail")).toBeNull();
  });

  it("shows the previewed amounts, sends the preview version, and re-confirms when it is stale", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_OPEN,
        quest: { ...createSnapshot().quest, state: QuestStatus.QUEST_OPEN },
      })
    );
    const preview = {
      questStatus: "QUEST_OPEN",
      tier: "NO_PENALTY",
      paidSatang: 0,
      refundedSatang: 10_000,
      platformFeeSatang: 0,
      affectedWorkerCount: 0,
      computedAt: "2026-10-01T03:00:00.000Z",
    };
    (liveQuestService.getCancelPreview as jest.Mock)
      .mockResolvedValueOnce({ ...preview, previewVersion: "v1" })
      .mockResolvedValue({
        ...preview,
        refundedSatang: 9_000,
        previewVersion: "v2",
      });
    (liveQuestService.cancelQuest as jest.Mock)
      .mockRejectedValueOnce(new ApiError(409, "CANCEL_PREVIEW_STALE", "stale"))
      .mockResolvedValue({ paidSatang: 0, refundedSatang: 9_000 });
    const view = await render(
      <>
        <HirerQuestManageRoute />
        <SweetAlertHost />
      </>
    );
    await fireEvent.press(
      await view.findByRole("button", { name: myQuestMessages.en.cancelQuest })
    );
    const confirm = () =>
      within(view.getByTestId("sweet-alert")).getByRole("button", {
        name: myQuestMessages.en.cancelQuest,
      });
    await fireEvent.press(await waitFor(confirm));

    await waitFor(() => {
      expect(liveQuestService.cancelQuest).toHaveBeenCalledTimes(1);
    });
    expect((liveQuestService.cancelQuest as jest.Mock).mock.calls[0]?.[2]).toBe(
      "v1"
    );
    await view.findByText(new RegExp(myQuestMessages.en.cancelPreviewStale));
    await fireEvent.press(await waitFor(confirm));
    await waitFor(() => {
      expect(liveQuestService.cancelQuest).toHaveBeenCalledTimes(2);
    });
    expect((liveQuestService.cancelQuest as jest.Mock).mock.calls[1]?.[2]).toBe(
      "v2"
    );
  });

  it("shows dispute for Hirer or assigned Worker on FAILED, but not Candidate or unassigned Worker", async () => {
    const failedQuest = {
      ...createSnapshot().quest,
      state: QuestStatus.QUEST_FAILED,
    };
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_FAILED,
        quest: failedQuest,
        actor: QuestActor.CANDIDATE,
      })
    );
    const candidate = await render(<HirerQuestManageRoute />);
    await act(async () => undefined);
    expect(candidate.queryByTestId("hirer-manage-dispute")).toBeNull();
    await candidate.unmount();

    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_FAILED,
        quest: failedQuest,
        actor: QuestActor.WORKER,
      })
    );
    const unassignedWorker = await render(<HirerQuestManageRoute />);
    await act(async () => undefined);
    expect(unassignedWorker.queryByTestId("hirer-manage-dispute")).toBeNull();
    await unassignedWorker.unmount();

    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_FAILED,
        quest: failedQuest,
        actor: QuestActor.WORKER,
        assignment: {
          id: "assignment-1",
          questId: "quest-1",
          workerId: "hirer-1",
          state: QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
          questState: QuestStatus.QUEST_FAILED,
          startedAt: null,
        },
      })
    );
    const assignedWorker = await render(<HirerQuestManageRoute />);
    expect(
      await assignedWorker.findByTestId("hirer-manage-dispute")
    ).toBeTruthy();
  });
  it("promotes server next step and separates Worker and candidate counts", async () => {
    const base = createSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: QuestStatus.QUEST_OPEN,
        quest: { ...base.quest, state: QuestStatus.QUEST_OPEN },
        nextAction: QuestNextAction.SELECT_CANDIDATE,
        applications: [
          {
            id: "app-1",
            questId: "quest-1",
            memberId: "worker-1",
            state: QuestApplicationStatus.APPLICATION_APPLIED,
            appliedAt: "2026-09-18T10:00:00.000Z",
          },
        ],
        capabilities: { ...base.capabilities, canSelectCandidate: true },
      })
    );

    const view = await render(<HirerQuestManageRoute />);

    expect(await view.findByRole("header", { name: "Next step" })).toBeTruthy();
    expect(view.getByLabelText("0 of 1 Worker")).toBeTruthy();
    expect(view.getByText("1 application")).toBeTruthy();
    expect(view.getByText("Review candidates · 1 application")).toBeTruthy();
  });

  it("shows how many Workers started, except where only a Team Leader starts", async () => {
    const base = createSnapshot();
    const assignment = {
      id: "assignment-1",
      questId: "quest-1",
      workerId: "worker-1",
      state: "ASSIGNMENT_ACTIVE" as const,
      questState: QuestStatus.QUEST_ASSIGNED,
      startedAt: "2026-10-01T09:05:00.000+07:00",
      createdAt: "2026-09-30T09:00:00.000Z",
    };
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({ assignments: [assignment] })
    );
    const single = await render(<HirerQuestManageRoute />);
    expect(await single.findByText("1 of 1 started work")).toBeTruthy();
    await single.unmount();

    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        participation: "GROUP",
        quest: { ...base.quest, participation: "GROUP", headcount: 1 },
        assignments: [assignment],
      })
    );
    const team = await render(<HirerQuestManageRoute />);
    await team.findByTestId("hirer-manage-roster");
    expect(team.queryByText("1 of 1 started work")).toBeNull();
  });

  it("labels submitted Candidate Teams separately from assigned Workers", async () => {
    const base = createSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        quest: {
          ...base.quest,
          participation: QuestParticipation.GROUP,
          headcount: 2,
          activeWorkerCount: 0,
          state: QuestStatus.QUEST_OPEN,
        },
        state: QuestStatus.QUEST_OPEN,
        participation: QuestParticipation.GROUP,
        nextAction: QuestNextAction.SELECT_TEAM,
        teams: [
          {
            id: "team-1",
            questId: "quest-1",
            leaderId: "worker-1",
            name: "Mural Crew",
            headcount: 2,
            state: "TEAM_SUBMITTED",
            joinCode: null,
            joinCodeExpiresAt: null,
            members: [
              { memberId: "worker-1", joinedAt: "2026-09-18T09:00:00.000Z" },
              { memberId: "worker-2", joinedAt: "2026-09-18T09:01:00.000Z" },
            ],
            submission: {
              text: "Paint campus mural",
              fileIds: ["proposal-file-1"],
              submittedAt: "2026-09-18T10:00:00.000Z",
            },
            createdAt: "2026-09-18T09:00:00.000Z",
          },
        ],
        capabilities: { ...base.capabilities, canSelectTeam: true },
      })
    );

    const view = await render(<HirerQuestManageRoute />);

    expect(await view.findByRole("header", { name: "Next step" })).toBeTruthy();
    expect(view.getByLabelText("0 of 2 Workers")).toBeTruthy();
    expect(view.getByText("1 submitted team")).toBeTruthy();
    expect(view.getByText("Review candidates · 1 submitted team")).toBeTruthy();
  });

  it("promotes pending proof review when server marks it as next action", async () => {
    const base = createSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        quest: {
          ...base.quest,
          state: QuestStatus.QUEST_IN_PROGRESS,
          proofRequired: true,
        },
        state: QuestStatus.QUEST_IN_PROGRESS,
        nextAction: QuestNextAction.REVIEW_PROOF,
        proofRequired: true,
        proofs: [
          {
            id: "proof-1",
            questId: "quest-1",
            workerId: "worker-1",
            teamId: null,
            submittedByUserId: "worker-1",
            description: "Evidence",
            status: "PROOF_PENDING",
            submittedAt: "2026-09-18T10:00:00.000Z",
            createdAt: "2026-09-18T09:00:00.000Z",
            updatedAt: "2026-09-18T10:00:00.000Z",
            visibility: "FULL",
            fileIds: [],
            files: [],
          },
        ],
        capabilities: { ...base.capabilities, canReviewProof: true },
      })
    );

    const view = await render(<HirerQuestManageRoute />);

    expect(await view.findByRole("header", { name: "Next step" })).toBeTruthy();
    expect(view.getByTestId("hirer-manage-proof-review")).toBeTruthy();
    expect(view.getByText("Review submitted work")).toBeTruthy();
  });

  it("shows underfilled roster and Hirer decisions in the consent sheet", async () => {
    const base = createSnapshot();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        quest: {
          ...base.quest,
          mode: QuestMode.FIRST_COME_FIRST_SERVED,
          participation: QuestParticipation.GROUP,
          state: QuestStatus.QUEST_OPEN,
          headcount: 2,
          activeWorkerCount: 1,
        },
        state: QuestStatus.QUEST_OPEN,
        mode: QuestMode.FIRST_COME_FIRST_SERVED,
        participation: QuestParticipation.GROUP,
        nextAction: QuestNextAction.DECIDE_UNDERFILLED,
        assignments: [
          {
            id: "assignment-1",
            questId: "quest-1",
            workerId: "worker-1",
            state: QuestAssignmentStatus.ASSIGNMENT_ACTIVE,
            questState: QuestStatus.QUEST_OPEN,
            startedAt: null,
          },
        ],
        underfilled: {
          id: "underfilled-1",
          questId: "quest-1",
          questState: QuestStatus.QUEST_OPEN,
          state: "UNDERFILLED_DECISION_PENDING",
          activeWorkerCount: 1,
          headcount: 2,
          workerRewardPool: 500,
          questReward: 500,
          dueAt: base.dueAt,
          decision: {
            status: "UNDERFILLED_DECISION_PENDING",
            value: null,
            expiresAt,
          },
          consent: {
            status: "UNDERFILLED_CONSENT_NOT_STARTED",
            expiresAt: null,
            totalCount: 1,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 1,
          },
          responses: [
            {
              workerId: "worker-1",
              assignmentId: "assignment-1",
              decision: null,
              questReward: 500,
              respondedAt: null,
            },
          ],
          ownResponse: null,
        },
        capabilities: {
          ...base.capabilities,
          canDecideUnderfilled: true,
        },
      })
    );

    const view = await render(<HirerQuestManageRoute />);
    expect(await view.findByRole("header", { name: "Next step" })).toBeTruthy();
    expect(view.getByLabelText("1 of 2 Workers")).toBeTruthy();
    await fireEvent.press(await view.findByTestId("hirer-manage-underfilled"));

    expect(await view.findByTestId("partial-group-start-summary")).toBeTruthy();
    expect(view.getByTestId("partial-group-start-hirer-decision")).toBeTruthy();
    expect(view.getByTestId("partial-group-start-proceed")).toBeTruthy();
    expect(view.getByTestId("partial-group-start-cancel")).toBeTruthy();
  });

  it("selects only after confirmation, closes candidate sheet, and ignores a duplicate in-flight press", async () => {
    const base = createSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        applications: [
          {
            id: "app-1",
            questId: "quest-1",
            memberId: "worker-1",
            state: QuestApplicationStatus.APPLICATION_APPLIED,
            appliedAt: "2026-09-18T10:00:00.000Z",
          },
        ],
        capabilities: { ...base.capabilities, canSelectCandidate: true },
      })
    );
    let finishSelection: () => void = () => {};
    const pendingSelection = new Promise<void>((resolve) => {
      finishSelection = resolve;
    });
    (liveQuestService.selectApplication as jest.Mock).mockReturnValue(
      pendingSelection
    );
    const view = await render(
      <>
        <HirerQuestManageRoute />
        <SweetAlertHost />
      </>
    );
    await fireEvent.press(
      await view.findByTestId("hirer-manage-candidate-review")
    );
    await fireEvent.press(
      await view.findByTestId("candidate-review-accept-app-1")
    );
    expect(
      await view.findByText(groupQuestMessages.en.selectProposal)
    ).toBeTruthy();
    expect(liveQuestService.selectApplication).not.toHaveBeenCalled();
    await fireEvent.press(
      view.getByRole("button", { name: groupQuestMessages.en.selectProposal })
    );
    await fireEvent.press(
      await view.findByTestId("candidate-review-accept-app-1")
    );
    expect(
      view.queryByRole("button", { name: groupQuestMessages.en.selectProposal })
    ).toBeNull();
    expect(liveQuestService.selectApplication).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishSelection();
    });
    await waitFor(() => {
      expect(view.queryByTestId("candidate-review-sheet")).toBeNull();
    });
  });

  it("reuses cancellation idempotency key after a network failure", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot()
    );
    (liveQuestService.cancelQuest as jest.Mock)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ paidSatang: 0, refundedSatang: 0 });
    const view = await render(
      <>
        <HirerQuestManageRoute />
        <SweetAlertHost />
      </>
    );
    await fireEvent.press(await view.findByTestId("hirer-manage-cancel"));
    await fireEvent.press(await view.findByTestId("cancel-guardrail-confirm"));
    await fireEvent.press(
      await view.findByRole("button", { name: alertMessages.en.dismiss })
    );
    await fireEvent.press(await view.findByTestId("hirer-manage-cancel"));
    await fireEvent.press(await view.findByTestId("cancel-guardrail-confirm"));
    await waitFor(() => {
      expect(liveQuestService.cancelQuest).toHaveBeenCalledTimes(2);
    });
    const calls = (liveQuestService.cancelQuest as jest.Mock).mock.calls;
    expect(calls[0]?.[1]).toEqual(expect.any(String));
    expect(calls[0]?.[1]).toBe(calls[1]?.[1]);
  });
  it("recovers pending edit request after Manage remounts", async () => {
    const pendingSnapshot = createSnapshot({ editRequest: makeEditRequest() });
    (liveQuestService.getLiveSnapshot as jest.Mock)
      .mockResolvedValueOnce(createSnapshot())
      .mockResolvedValue(pendingSnapshot);
    (liveQuestService.createEditRequest as jest.Mock).mockResolvedValue(
      pendingSnapshot.editRequest
    );
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const tree = (mounted: boolean) => (
      <AppThemeProvider>
        <QueryClientProvider client={queryClient}>
          {mounted ? <HirerQuestManageRoute /> : null}
        </QueryClientProvider>
      </AppThemeProvider>
    );
    const view = await renderUI(tree(true));
    await fireEvent.press(
      await view.findByTestId("hirer-manage-condition-edit")
    );
    await fireEvent.changeText(
      view.getByTestId("quest-condition-item-0"),
      "Finish the mural in blue"
    );
    await fireEvent.press(view.getByTestId("quest-condition-submit"));
    await view.findByTestId("hirer-condition-edit-pending-title");
    await view.rerender(tree(false));
    await view.rerender(tree(true));
    await waitFor(() =>
      expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledWith(
        "quest-1",
        "hirer-1",
        expect.objectContaining({ editRequestId: "edit-1" })
      )
    );
    expect(
      await view.findByTestId("hirer-condition-edit-pending-title")
    ).toBeTruthy();
    expect(liveQuestService.createEditRequest).toHaveBeenCalledTimes(1);
  });

  it("shows Back, not Retry, when the Quest is not found", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockRejectedValue(
      new ApiError(404, "NOT_FOUND", "missing")
    );
    const view = await render(<HirerQuestManageRoute />);

    await view.findByTestId("hirer-manage-back");
    expect(view.queryByTestId("hirer-manage-retry")).toBeNull();
  });

  it("keeps Retry for other load errors", async () => {
    (liveQuestService.getLiveSnapshot as jest.Mock).mockRejectedValue(
      new ApiError(500, "SERVER", "boom")
    );
    const view = await render(<HirerQuestManageRoute />);

    await view.findByTestId("hirer-manage-retry");
    expect(view.queryByTestId("hirer-manage-back")).toBeNull();
  });

  it("counts down to the start time on an open Quest", async () => {
    const base = createSnapshot();
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(
      createSnapshot({
        state: "QUEST_OPEN",
        quest: {
          ...base.quest,
          state: "QUEST_OPEN",
          startTime: new Date(
            Date.now() + 3 * 3_600_000 + 30_000
          ).toISOString(),
        },
      })
    );
    const view = await render(<HirerQuestManageRoute />);

    expect(
      (await view.findByTestId("hirer-manage-starts-in")).props.children
    ).toMatch(/3h/);
  });
});
