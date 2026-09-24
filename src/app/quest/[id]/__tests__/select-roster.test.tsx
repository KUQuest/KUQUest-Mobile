import React from "react";
import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import { studentApi } from "@/api/StudentApi";
import { authService } from "@/features/auth/AuthService";
import { liveQuestService } from "@/features/questBoard/live/liveQuestService";
import type { LiveQuestSnapshot } from "@/features/questBoard/live/liveQuestService";
import SelectRosterRoute from "../select-roster";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ id: "quest-1" }),
}));

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn().mockResolvedValue({ user: { id: "hirer-1" } }),
    getStudentApi: jest.fn(),
  },
}));

jest.mock("@/api/StudentApi", () => ({
  studentApi: {
    getPublicProfile: jest.fn(),
  },
}));

jest.mock("@/features/questBoard/live/liveQuestService", () => {
  const actual = jest.requireActual(
    "@/features/questBoard/live/liveQuestService"
  );
  return {
    ...actual,
    liveQuestService: {
      getLiveSnapshot: jest.fn(),
      selectApplication: jest.fn(),
      rejectApplication: jest.fn(),
      selectCandidateTeam: jest.fn(),
      rejectCandidateTeam: jest.fn(),
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
      condition: { items: [{ position: 0, text: "Finish the mural" }] },
      tag: null,
      mode: "CANDIDATE",
      participation: "SINGLE",
      state: "QUEST_OPEN",
      questReward: 500,
      headcount: 1,
      activeWorkerCount: 0,
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
    state: "QUEST_OPEN",
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
    nextAction: "SELECT_CANDIDATE",
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
      canRequestEdit: false,
      canRespondToEdit: false,
      canReadWorkChat: false,
      canWriteWorkChat: false,
      canSubmitProof: false,
      canStartWork: false,
      canConfirmCompletion: false,
      canCancel: false,
      canReviewProof: false,
      canCreateReview: false,
      canUpdateReview: false,
    },
    ...overrides,
  };
}
describe("SelectRosterRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getStudentApi as jest.Mock).mockResolvedValue(studentApi);
    (studentApi.getPublicProfile as jest.Mock).mockResolvedValue({
      firstName: "Nina",
      lastName: "Candidate",
      avatar: null,
      department: { faculty: { name: "Design" } },
    });
  });

  it("selects a pending individual candidate after confirmation and returns to the previous screen", async () => {
    const snapshot = createSnapshot({
      applications: [
        {
          id: "app-1",
          questId: "quest-1",
          memberId: "candidate-1",
          state: "APPLICATION_APPLIED",
          appliedAt: "2026-09-18T10:00:00.000Z",
        },
      ],
      capabilities: {
        ...createSnapshot().capabilities,
        canSelectCandidate: true,
        canRejectCandidate: true,
      },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    const alertSpy = jest.spyOn(Alert, "alert");

    const { getByTestId, getByText } = await renderWithQueryClient(
      <SelectRosterRoute />
    );

    await waitFor(() => {
      expect(getByText("Nina Candidate")).toBeTruthy();
    });

    fireEvent.press(getByTestId("select-roster-candidate-app-1-select"));

    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    const confirm = buttons?.find((button) => button.style !== "cancel");
    confirm?.onPress?.();

    await waitFor(() => {
      expect(liveQuestService.selectApplication).toHaveBeenCalledWith(
        "quest-1",
        "app-1",
        expect.any(String)
      );
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("rejects a pending team proposal after confirmation and refreshes the list", async () => {
    const base = createSnapshot();
    const snapshot = createSnapshot({
      participation: "GROUP",
      teams: [
        {
          id: "team-1",
          questId: "quest-1",
          leaderId: "leader-1",
          name: "Muralists",
          headcount: 3,
          state: "TEAM_SUBMITTED",
          joinCode: null,
          joinCodeExpiresAt: null,
          members: [{ memberId: "leader-1", joinedAt: "2026-09-01T00:00:00Z" }],
          submission: null,
          createdAt: "2026-09-01T00:00:00Z",
        },
      ],
      capabilities: { ...base.capabilities, canRejectTeam: true },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    (liveQuestService.rejectCandidateTeam as jest.Mock).mockResolvedValue({});
    const alertSpy = jest.spyOn(Alert, "alert");

    const { getByTestId, getByText } = await renderWithQueryClient(
      <SelectRosterRoute />
    );

    await waitFor(() => {
      expect(getByText("Nina Candidate")).toBeTruthy();
    });

    fireEvent.press(getByTestId("select-roster-team-team-1-reject"));

    const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    const confirm = buttons?.find((button) => button.style === "destructive");
    confirm?.onPress?.();

    await waitFor(() => {
      expect(liveQuestService.rejectCandidateTeam).toHaveBeenCalledWith(
        "quest-1",
        "team-1",
        expect.any(String)
      );
    });
    await waitFor(() => {
      expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(2);
    });
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("shows the rejection error and refetches when team rejection fails", async () => {
    const base = createSnapshot();
    const snapshot = createSnapshot({
      participation: "GROUP",
      teams: [
        {
          id: "team-1",
          questId: "quest-1",
          leaderId: "leader-1",
          name: "Muralists",
          headcount: 3,
          state: "TEAM_SUBMITTED",
          joinCode: null,
          joinCodeExpiresAt: null,
          members: [{ memberId: "leader-1", joinedAt: "2026-09-01T00:00:00Z" }],
          submission: null,
          createdAt: "2026-09-01T00:00:00Z",
        },
      ],
      capabilities: { ...base.capabilities, canRejectTeam: true },
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);
    const failureMessage = "The team could not be rejected";
    (liveQuestService.rejectCandidateTeam as jest.Mock).mockRejectedValue(
      new Error(failureMessage)
    );
    const alertSpy = jest.spyOn(Alert, "alert");

    const { getByTestId, getByText } = await renderWithQueryClient(
      <SelectRosterRoute />
    );

    await waitFor(() => {
      expect(getByText("Nina Candidate")).toBeTruthy();
    });

    fireEvent.press(getByTestId("select-roster-team-team-1-reject"));
    const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    const confirm = buttons?.find((button) => button.style === "destructive");
    confirm?.onPress?.();

    await waitFor(() => {
      expect(liveQuestService.rejectCandidateTeam).toHaveBeenCalledWith(
        "quest-1",
        "team-1",
        expect.any(String)
      );
      expect(liveQuestService.getLiveSnapshot).toHaveBeenCalledTimes(2);
      expect(alertSpy).toHaveBeenCalledTimes(2);
    });
    expect(alertSpy.mock.calls[1]?.[1]).toBe(failureMessage);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("shows a no-selection-needed state for a First-Come-First-Served quest", async () => {
    const snapshot = createSnapshot({
      mode: "FIRST_COME_FIRST_SERVED",
    });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);

    const { getByText } = await renderWithQueryClient(<SelectRosterRoute />);

    await waitFor(() => {
      expect(
        getByText("เควสต์นี้รับผู้ทำงานอัตโนมัติ ไม่ต้องคัดเลือก")
      ).toBeTruthy();
    });
  });

  it("shows the empty state when no candidates have applied yet", async () => {
    const snapshot = createSnapshot({ applications: [] });
    (liveQuestService.getLiveSnapshot as jest.Mock).mockResolvedValue(snapshot);

    const { getByText } = await renderWithQueryClient(<SelectRosterRoute />);

    await waitFor(() => {
      expect(getByText("ยังไม่มีข้อเสนอผู้สมัครที่ส่งแล้ว")).toBeTruthy();
    });
  });
});
