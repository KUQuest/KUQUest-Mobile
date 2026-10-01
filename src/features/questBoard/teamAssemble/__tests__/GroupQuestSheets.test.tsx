import React, { type ReactNode } from "react";
import { act, fireEvent } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import { ApiError } from "@/api/ApiClient";
import {
  renderWithQueryClient,
  renderWithAppTheme,
} from "@/testing/queryTestUtils";

import { CandidateReviewSheet } from "../components/CandidateReviewSheet";
import { PartialGroupStartConsentContent } from "../components/PartialGroupStartConsentContent";
import { TeamAssembleView } from "../components/TeamAssembleView";
import { TeamAssembleSubmissionPanel } from "../components/TeamAssembleSubmissionPanel";
import TeamAssembleScreen from "../TeamAssembleScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { profileKeys } from "@/features/profile/api/profileQueries";
import type {
  QuestV2Application,
  QuestV2Underfilled,
} from "@/api/questV2Contracts";
import {
  QuestApplicationStatus,
  QuestPartialStartConsentStatus,
  QuestTeamStatus,
  QuestUnderfilledConsentDecision,
  type QuestApplication,
  type QuestInvitation,
  type QuestPartialStartConsent,
  type QuestTeam,
} from "../../domain/types";
const mockTeamPush = jest.fn();

const mockJoinMutateAsync = jest.fn();
const mockTeamDetailView = {
  state: "ready",
  team: {
    team: null as QuestTeam | null,
    onJoinTeam: jest.fn(),
    viewerId: "worker-1",
    submitting: false,
  },
  messages: { back: "Back" },
  handleBack: jest.fn(),
  onRetry: jest.fn(),
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockTeamPush }),
}));
jest.mock("@/features/questBoard/api/questBoardQueries", () => ({
  useJoinCandidateTeamMutation: () => ({
    mutateAsync: mockJoinMutateAsync,
    isPending: false,
  }),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("../../detail/useQuestDetailFeature", () => ({
  useQuestDetailFeature: () => mockTeamDetailView,
}));
jest.mock("@/components/layout/ScreenLayout", () => ({
  ScreenLayout: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/ui/TopBar", () => ({
  TopBar: () => null,
}));

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) => (visible ? <>{children}</> : null),
}));
function queryClientWithRatings(memberIds: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  for (const memberId of memberIds) {
    queryClient.setQueryData(profileKeys.public(memberId), {
      version: 1,
      firstName: memberId,
      lastName: "",
      reputation: { totalQuests: 1, rating: { average: 4.7 } },
      experience: [],
      portfolio: [],
      certificates: [],
    });
  }
  return queryClient;
}

const team: QuestTeam = {
  id: "team-1",
  questId: "quest-1",
  leaderId: "leader-1",
  status: QuestTeamStatus.TEAM_FORMING,
  members: [
    { workerId: "leader-1", role: "LEADER", displayName: "Team Leader" },
  ],
  requiredHeadcount: 3,
  createdAt: "2026-08-12T09:00:00.000Z",
};

const invitation: QuestInvitation = {
  id: "invite-1",
  questId: "quest-1",
  teamId: team.id,
  invitedWorkerId: "worker-1",
  status: "INVITATION_PENDING",
  createdAt: "2026-08-12T09:00:00.000Z",
  expiresAt: "2026-08-13T09:00:00.000Z",
};

function makeConsent(
  status: QuestPartialStartConsentStatus = QuestPartialStartConsentStatus.PARTIAL_START_PENDING
): QuestPartialStartConsent {
  return {
    id: "consent-1",
    questId: "quest-1",
    status,
    requestedAt: "2026-08-12T09:00:00.000Z",
    responseDeadlineAt: "2026-08-12T09:05:00.000Z",
    requiredVoterIds: ["hirer-1", "worker-1"],
    frozenWorkerIds: ["worker-1"],
    approvedVoterCount: 0,
    responses: [],
  };
}

describe("group Quest sheets", () => {
  it("blocks empty Candidate Team submission before the API call", async () => {
    const onSubmit = jest.fn();
    const view = await renderWithQueryClient(
      <TeamAssembleSubmissionPanel
        acceptedCount={3}
        canonical
        files={[]}
        isReviewing
        messages={{
          teamSubmissionUnavailable: "Team submission unavailable",
          submissionContentRequired:
            "Add a proposal note and at least one supporting file to submit.",
          reviewTitle: "Review team",
          reviewDescription: "Check proposal",
          roster: "Roster",
          rosterCount: (actual, required) => `${actual}/${required}`,
          partialRosterHint: "Full team",
          attachedFiles: "Files",
          proposal: "Proposal",
          submittingTeam: "Submitting",
          confirmSubmit: "Confirm submission",
          cancel: "Cancel",
          reviewRoster: "Review roster",
        }}
        onReviewChange={jest.fn()}
        onSubmit={onSubmit}
        requiredHeadcount={3}
        submissionReady
        submitting={false}
        text=""
      />
    );

    expect(
      view.getByTestId("team-assemble-confirm-submit").props.accessibilityState
    ).toEqual({ disabled: true });
    await fireEvent.press(view.getByTestId("team-assemble-confirm-submit"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires a proposal note even when supporting files are attached", async () => {
    const view = await renderWithQueryClient(
      <TeamAssembleSubmissionPanel
        acceptedCount={3}
        canonical
        files={[{ id: "file-1", name: "proof.pdf" }]}
        isReviewing
        messages={{
          teamSubmissionUnavailable: "Team submission unavailable",
          submissionContentRequired:
            "Add a proposal note and at least one supporting file to submit.",
          reviewTitle: "Review team",
          reviewDescription: "Check proposal",
          roster: "Roster",
          rosterCount: (actual, required) => `${actual}/${required}`,
          partialRosterHint: "Full team",
          attachedFiles: "Files",
          proposal: "Proposal",
          submittingTeam: "Submitting",
          confirmSubmit: "Confirm submission",
          cancel: "Cancel",
          reviewRoster: "Review roster",
        }}
        onReviewChange={jest.fn()}
        onSubmit={jest.fn()}
        requiredHeadcount={3}
        submissionReady
        submitting={false}
        text=" "
      />
    );

    expect(
      view.getByTestId("team-assemble-confirm-submit").props.accessibilityState
        .disabled
    ).toBe(true);
  });

  it("supports a partial roster, directory search, multi-invite, and review before submit", async () => {
    const onInviteMembers = jest.fn();
    const onSubmit = jest.fn();
    const view = await renderWithQueryClient(
      <TeamAssembleView
        eligibleMembers={[
          { id: "worker-1", displayName: "Mali Worker", email: "mali@ku.th" },
          { id: "worker-2", displayName: "Niran Worker", email: "niran@ku.th" },
          { id: "worker-3", displayName: "Pim Worker", email: "pim@ku.th" },
        ]}
        locale="en"
        onInviteMembers={onInviteMembers}
        onSubmit={onSubmit}
        team={team}
      />
    );

    expect(view.getByTestId("team-assemble-scroll")).toBeTruthy();
    expect(view.getByTestId("team-assemble-roster-count")).toBeTruthy();
    expect(
      view.getByRole("search", { name: "Search by name or @ku.th email" })
    ).toBeTruthy();
    expect(view.queryByTestId("team-assemble-name-input")).toBeNull();

    await fireEvent.changeText(
      view.getByTestId("team-assemble-member-search"),
      "@ku.th"
    );
    await fireEvent.press(
      view.getByTestId("team-assemble-select-member-worker-2")
    );
    await fireEvent.press(
      view.getByTestId("team-assemble-select-member-worker-3")
    );
    await fireEvent.press(view.getByTestId("team-assemble-invite-selected"));
    expect(onInviteMembers).toHaveBeenCalledWith(["worker-2", "worker-3"]);

    await fireEvent.press(view.getByTestId("team-assemble-review-roster"));
    expect(view.getByTestId("team-assemble-review")).toBeTruthy();
    await fireEvent.press(view.getByTestId("team-assemble-confirm-submit"));
    expect(onSubmit).toHaveBeenCalledWith(team.id);
  });

  it("shows pending invitations with accept and decline actions for the invited Worker", async () => {
    const onRespondInvitation = jest.fn();
    const view = await renderWithQueryClient(
      <TeamAssembleView
        invitations={[invitation]}
        locale="en"
        onRespondInvitation={onRespondInvitation}
        team={team}
        viewerId="worker-1"
      />
    );

    expect(view.getAllByText("Invitation pending")).toHaveLength(2);
    await fireEvent.press(
      view.getByTestId("team-assemble-accept-invitation-invite-1")
    );
    expect(onRespondInvitation).toHaveBeenCalledWith("invite-1", true);
    await fireEvent.press(
      view.getByTestId("team-assemble-decline-invitation-invite-1")
    );
    expect(onRespondInvitation).toHaveBeenCalledWith("invite-1", false);
  });

  it("shows only submitted team proposals and exposes selection/status decisions", async () => {
    const forming: QuestTeam = {
      ...team,
      id: "forming",
      leaderId: "forming-leader",
      members: [
        {
          workerId: "forming-leader",
          role: "LEADER",
          displayName: "Forming Team",
        },
      ],
    };
    const submitted: QuestTeam = {
      ...team,
      id: "submitted",
      leaderId: "submitted-leader",
      status: QuestTeamStatus.TEAM_SUBMITTED,
      members: [
        {
          workerId: "submitted-leader",
          role: "LEADER",
          displayName: "Submitted Leader",
        },
        {
          workerId: "member-1",
          role: "MEMBER",
          displayName: "Submitted Member",
        },
      ],
    };
    const selected: QuestTeam = {
      ...team,
      id: "selected",
      leaderId: "selected-leader",
      status: QuestTeamStatus.TEAM_SELECTED,
      members: [
        {
          workerId: "selected-leader",
          role: "LEADER",
          displayName: "Selected Leader",
        },
      ],
    };
    const rejected: QuestTeam = {
      ...team,
      id: "rejected",
      leaderId: "rejected-leader",
      status: QuestTeamStatus.TEAM_REJECTED,
      members: [
        {
          workerId: "rejected-leader",
          role: "LEADER",
          displayName: "Rejected Leader",
        },
      ],
    };
    const applications: QuestApplication[] = [
      {
        id: "proposal-submitted",
        questId: "quest-1",
        teamId: submitted.id,
        status: QuestApplicationStatus.APPLICATION_APPLIED,
        submittedAt: team.createdAt,
      },
      {
        id: "proposal-selected",
        questId: "quest-1",
        teamId: selected.id,
        status: QuestApplicationStatus.APPLICATION_SELECTED,
        submittedAt: team.createdAt,
      },
      {
        id: "proposal-rejected",
        questId: "quest-1",
        teamId: rejected.id,
        status: QuestApplicationStatus.APPLICATION_REJECTED,
        submittedAt: team.createdAt,
      },
    ];
    const onSelectProposal = jest.fn();
    const onAccept = jest.fn();
    const onReject = jest.fn();
    const queryClient = queryClientWithRatings([
      "submitted-leader",
      "selected-leader",
      "rejected-leader",
    ]);
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <CandidateReviewSheet
          applications={applications}
          locale="en"
          mode="team"
          onAccept={onAccept}
          onClose={() => undefined}
          onReject={onReject}
          onSelectProposal={onSelectProposal}
          requestedHeadcount={3}
          rewardSatangPerWorker={10000}
          teams={[forming, submitted, selected, rejected]}
          visible
        />
      </QueryClientProvider>
    );

    expect(view.queryByText("Forming Team")).toBeNull();
    expect(view.getByText("Submitted Leader")).toBeTruthy();
    expect(view.getAllByText("Selected")).toHaveLength(1);
    expect(view.getAllByText("Rejected")).toHaveLength(1);
    expect(view.getByText("Requested headcount")).toBeTruthy();
    expect(view.getByText("Actual headcount")).toBeTruthy();
    expect(view.getByTestId("candidate-review-settlement")).toBeTruthy();

    await fireEvent.press(
      view.getAllByTestId("candidate-review-select-proposal-submitted")[0]
    );
    expect(onSelectProposal).toHaveBeenCalledWith("proposal-submitted");
    await fireEvent.press(
      view.getAllByTestId("candidate-review-accept-proposal-submitted")[0]
    );
    await fireEvent.press(
      view.getAllByTestId("candidate-review-reject-proposal-submitted")[0]
    );
    expect(onAccept).toHaveBeenCalledWith("proposal-submitted");
    expect(onReject).toHaveBeenCalledWith("proposal-submitted");
  });
  it("shows a candidate's average reputation rating beside their name", async () => {
    const application: QuestV2Application = {
      id: "application-1",
      questId: "quest-1",
      memberId: "worker-1",
      state: QuestApplicationStatus.APPLICATION_APPLIED,
      appliedAt: "2026-09-25T09:00:00.000Z",
    };
    const queryClient = queryClientWithRatings(["worker-1"]);
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <CandidateReviewSheet
          applicantDirectory={[{ id: "worker-1", displayName: "Chat Worker" }]}
          applications={[application]}
          locale="en"
          mode="individual"
          onClose={() => undefined}
          visible
        />
      </QueryClientProvider>
    );

    expect(view.getByText("Chat Worker")).toBeTruthy();
    expect(view.getByText("★ 4.7")).toBeTruthy();
    expect(
      view.getByTestId("candidate-review-rating-application-1")
    ).toBeTruthy();
  });

  it("formats Thai due date and lets a Worker vote from ownResponse", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-12T09:00:00.000Z"));
    const onWorkerConsent = jest.fn();
    const underfilled: QuestV2Underfilled = {
      id: "underfilled-1",
      questId: "quest-1",
      questState: "QUEST_OPEN",
      state: "UNDERFILLED_CONSENT_PENDING",
      activeWorkerCount: 1,
      headcount: 3,
      workerRewardPool: 300,
      questReward: 300,
      dueAt: "2026-10-01T23:25:00.000+07:00",
      decision: {
        status: "UNDERFILLED_DECISION_PENDING",
        value: null,
        expiresAt: "2026-08-12T09:10:00.000Z",
      },
      consent: {
        status: "UNDERFILLED_CONSENT_PENDING",
        expiresAt: "2026-08-12T09:10:00.000Z",
        totalCount: 1,
        acceptedCount: 0,
        declinedCount: 0,
        pendingCount: 1,
      },
      ownResponse: {
        decision: null,
        questReward: 100,
        respondedAt: null,
      },
    };
    const view = await renderWithAppTheme(
      <PartialGroupStartConsentContent
        canConsent
        locale="th"
        onWorkerConsent={onWorkerConsent}
        underfilled={underfilled}
        viewerId="worker-1"
      />
    );
    expect(view.queryByText("2026-10-01T23:25:00.000+07:00")).toBeNull();
    expect(view.getByText("1 ต.ค. 2026 23:25")).toBeTruthy();

    expect(view.getByTestId("partial-group-start-approve")).toBeTruthy();
    expect(view.getByTestId("partial-group-start-reject")).toBeTruthy();
    await fireEvent.press(view.getByTestId("partial-group-start-approve"));
    expect(onWorkerConsent).toHaveBeenCalledWith(
      QuestUnderfilledConsentDecision.ACCEPT
    );

    await view.rerender(
      <PartialGroupStartConsentContent
        canConsent
        locale="th"
        onWorkerConsent={onWorkerConsent}
        underfilled={{
          ...underfilled,
          ownResponse: {
            decision: "ACCEPT",
            questReward: 100,
            respondedAt: "2026-08-12T09:01:00.000Z",
          },
        }}
        viewerId="worker-1"
      />
    );
    expect(view.queryByTestId("partial-group-start-approve")).toBeNull();
    expect(view.getAllByText("อนุมัติแล้ว")).toHaveLength(2);
    jest.useRealTimers();
  });

  it("counts down the five-minute partial-start consent window and exposes voter actions", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-12T09:00:00.000Z"));
    const onVote = jest.fn();
    const view = await renderWithAppTheme(
      <PartialGroupStartConsentContent
        actualHeadcount={1}
        consent={makeConsent()}
        hirerId="hirer-1"
        locale="en"
        onVote={onVote}
        requestedHeadcount={3}
        voters={[
          { id: "hirer-1", displayName: "Quest Hirer", role: "HIRER" },
          { id: "worker-1", displayName: "Joined Worker", role: "WORKER" },
        ]}
        viewerId="hirer-1"
      />
    );

    expect(view.getByTestId("partial-group-start-countdown")).toBeTruthy();
    expect(view.getByText("05:00")).toBeTruthy();
    expect(view.getByText("Quest Hirer")).toBeTruthy();
    expect(view.getAllByText("Joined Worker")).toHaveLength(2);
    expect(
      view.getByText(
        "The existing Quest chat stays writable while this vote is pending."
      )
    ).toBeTruthy();

    await fireEvent.press(view.getByTestId("partial-group-start-approve"));
    expect(onVote).toHaveBeenCalledWith(true);
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(view.getByText("04:00")).toBeTruthy();
    jest.useRealTimers();
  });
  it("shows approved and cancelled terminal consent states without vote actions", async () => {
    const approved = await renderWithAppTheme(
      <PartialGroupStartConsentContent
        consent={makeConsent(
          QuestPartialStartConsentStatus.PARTIAL_START_APPROVED
        )}
        locale="en"
      />
    );
    expect(approved.getByTestId("partial-group-start-approved")).toBeTruthy();
    expect(approved.queryByTestId("partial-group-start-approve")).toBeNull();

    const cancelled = await renderWithAppTheme(
      <PartialGroupStartConsentContent
        consent={makeConsent(
          QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        )}
        locale="en"
      />
    );
    expect(cancelled.getByTestId("partial-group-start-cancelled")).toBeTruthy();
    expect(
      cancelled.getByText(
        "The five-minute consent window ended before everyone approved. Reserved rewards are fully refunded."
      )
    ).toBeTruthy();
  });
  it("joins a team with a trimmed Join Code and shows its localized error", async () => {
    const onJoinTeam = jest.fn();
    const view = await renderWithAppTheme(
      <TeamAssembleView
        joinError="This Join Code is invalid or expired."
        locale="en"
        onJoinTeam={onJoinTeam}
        team={null}
      />
    );
    const input = view.getByTestId("team-assemble-join-code-input");

    expect(
      view.getByTestId("team-assemble-join").props.accessibilityState.disabled
    ).toBe(true);
    expect(input.props.accessibilityLabel).toBe("Join Code");
    expect(
      view.getByText("This Join Code is invalid or expired.")
    ).toBeTruthy();
    await fireEvent.changeText(input, "  abcd2345  ");
    await fireEvent.press(view.getByTestId("team-assemble-join"));
    expect(onJoinTeam).toHaveBeenCalledWith("", "abcd2345");
  });

  it("sends trimmed Join Code and maps invalid and full-team errors", async () => {
    mockJoinMutateAsync
      .mockReset()
      .mockRejectedValueOnce(new ApiError(422, "JOIN_CODE_EXPIRED", "expired"))
      .mockRejectedValueOnce(new ApiError(422, "TEAM_FULL", "conflict"));
    const view = await renderWithAppTheme(
      <TeamAssembleScreen questId="quest-1" />
    );
    const input = view.getByTestId("team-assemble-join-code-input");

    await fireEvent.changeText(input, "  abcd2345  ");
    await fireEvent.press(view.getByTestId("team-assemble-join"));
    expect(mockJoinMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        questId: "quest-1",
        viewerId: "worker-1",
        joinCode: "abcd2345",
      })
    );
    expect(
      await view.findByText("This Join Code is invalid or expired.")
    ).toBeTruthy();

    await fireEvent.press(view.getByTestId("team-assemble-join"));
    expect(
      await view.findByText("This team is full or no longer accepting members.")
    ).toBeTruthy();
  });

  it("joins a team named by an invite link opened from another app", async () => {
    const onJoinTeam = jest.fn();
    const view = await renderWithAppTheme(
      <TeamAssembleView
        initialInvite='Join my KUQuest team "Gardeners": kuquestmobile://quest/q-1/team?teamId=0b8f1c2e-4d5a-4e6f-8a9b-1c2d3e4f5a6b&code=abcd2345'
        locale="en"
        onJoinTeam={onJoinTeam}
        team={null}
      />
    );

    await fireEvent.press(view.getByTestId("team-assemble-join"));
    expect(onJoinTeam).toHaveBeenCalledWith(
      "0b8f1c2e-4d5a-4e6f-8a9b-1c2d3e4f5a6b",
      "ABCD2345"
    );
  });

  it("creates a Team only with a non-blank trimmed name", async () => {
    const onCreateTeam = jest.fn();
    const view = await renderWithAppTheme(
      <TeamAssembleView locale="en" onCreateTeam={onCreateTeam} team={null} />
    );

    await fireEvent.changeText(
      view.getByTestId("team-assemble-name-input"),
      "   "
    );
    await fireEvent.press(view.getByTestId("team-assemble-create"));
    expect(onCreateTeam).not.toHaveBeenCalled();

    await fireEvent.changeText(
      view.getByTestId("team-assemble-name-input"),
      "  Campus Gardeners "
    );
    await fireEvent.press(view.getByTestId("team-assemble-create"));
    expect(onCreateTeam).toHaveBeenCalledWith("Campus Gardeners");
  });

  it("names Candidate Team members, shows open spots, and hides the invite once the Team is full", async () => {
    const formingTeam = {
      id: "team-9",
      questId: "quest-9",
      leaderId: "leader-9",
      name: "Campus Gardeners",
      headcount: 3,
      state: "TEAM_FORMING" as const,
      joinCode: "ABCD2345",
      joinCodeExpiresAt: "2026-09-26T05:02:00.000Z",
      members: [{ memberId: "leader-9", joinedAt: "2026-09-01T00:00:00Z" }],
      submission: null,
      createdAt: "2026-09-01T00:00:00Z",
    };
    const queryClient = queryClientWithRatings(["leader-9", "worker-9"]);
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <TeamAssembleView
          locale="en"
          onRegenerateJoinCode={jest.fn()}
          team={formingTeam}
          viewerId="leader-9"
        />
      </QueryClientProvider>
    );

    expect(view.getByText("leader-9")).toBeTruthy();
    expect(view.getAllByTestId("team-assemble-roster-open-slot")).toHaveLength(
      2
    );
    expect(view.getByTestId("team-assemble-join-code-value")).toHaveTextContent(
      "ABCD2345"
    );
    expect(view.getByTestId("team-assemble-share-invite")).toBeTruthy();

    await view.rerender(
      <QueryClientProvider client={queryClient}>
        <TeamAssembleView
          locale="en"
          team={{
            ...formingTeam,
            headcount: 2,
            members: [
              ...formingTeam.members,
              { memberId: "worker-9", joinedAt: "2026-09-02T00:00:00Z" },
            ],
          }}
          viewerId="leader-9"
        />
      </QueryClientProvider>
    );

    expect(view.getByText("worker-9")).toBeTruthy();
    expect(view.queryByTestId("team-assemble-roster-open-slot")).toBeNull();
    expect(view.queryByTestId("team-assemble-join-code")).toBeNull();
  });
  it("clears proposal draft when live team changes", async () => {
    const getDocumentAsync = jest.mocked(DocumentPicker.getDocumentAsync);
    getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file://old-team.jpg",
          name: "old-team.jpg",
          mimeType: "image/jpeg",
          size: 100,
        },
      ],
    } as never);
    const onUploadProposalFile = jest.fn().mockResolvedValue({
      id: "file-old",
      name: "old-team.jpg",
      sizeBytes: 100,
    });
    const firstTeam = {
      id: "team-1",
      questId: "quest-1",
      leaderId: "leader-1",
      name: "First Team",
      headcount: 2,
      state: "TEAM_FORMING" as const,
      joinCode: "ABCD2345",
      joinCodeExpiresAt: null,
      members: [{ memberId: "leader-1", joinedAt: "2026-09-01T00:00:00Z" }],
      submission: null,
      createdAt: "2026-09-01T00:00:00Z",
    };
    const queryClient = queryClientWithRatings(["leader-1"]);
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <TeamAssembleView
          locale="en"
          onUploadProposalFile={onUploadProposalFile}
          team={firstTeam}
          viewerId="leader-1"
        />
      </QueryClientProvider>
    );

    await fireEvent.changeText(
      view.getByTestId("team-proposal-text-input"),
      "Old team proposal"
    );
    await act(async () => {
      await fireEvent.press(view.getByTestId("team-pick-file-button"));
    });
    expect(view.getByTestId("team-proposal-file-file-old")).toBeTruthy();

    await view.rerender(
      <QueryClientProvider client={queryClient}>
        <TeamAssembleView
          locale="en"
          onUploadProposalFile={onUploadProposalFile}
          team={{ ...firstTeam, id: "team-2", name: "Second Team" }}
          viewerId="leader-1"
        />
      </QueryClientProvider>
    );

    expect(view.getByTestId("team-proposal-text-input").props.value).toBe("");
    expect(view.queryByTestId("team-proposal-file-file-old")).toBeNull();
  });

  it("supports document picking and blocks oversized team files", async () => {
    const getDocumentAsync = jest.mocked(DocumentPicker.getDocumentAsync);
    getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file://large-team.mp4",
          name: "large-team.mp4",
          mimeType: "video/mp4",
          size: 10 * 1024 * 1024 + 1,
        },
      ],
    } as never);
    const onUploadProposalFile = jest.fn();
    const queryClient = queryClientWithRatings(["leader-1"]);
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <TeamAssembleView
          locale="en"
          onUploadProposalFile={onUploadProposalFile}
          team={{
            id: "team-1",
            questId: "quest-1",
            leaderId: "leader-1",
            name: "Team",
            headcount: 2,
            state: "TEAM_FORMING" as const,
            joinCode: "ABCD2345",
            joinCodeExpiresAt: null,
            members: [
              { memberId: "leader-1", joinedAt: "2026-09-01T00:00:00Z" },
            ],
            submission: null,
            createdAt: "2026-09-01T00:00:00Z",
          }}
          viewerId="leader-1"
        />
      </QueryClientProvider>
    );

    await act(async () => {
      await fireEvent.press(view.getByTestId("team-pick-file-button"));
    });

    expect(getDocumentAsync).toHaveBeenCalledWith({
      type: ["image/*", "video/*", "application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });
    expect(onUploadProposalFile).not.toHaveBeenCalled();
    expect(
      view.getByText("Each supporting file must be 10 MB or smaller")
    ).toBeTruthy();
  });

  it("keeps uploaded files when a later supporting file fails", async () => {
    const getDocumentAsync = jest.mocked(DocumentPicker.getDocumentAsync);
    getDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file://first.jpg",
          name: "first.jpg",
          mimeType: "image/jpeg",
          size: 100,
        },
        {
          uri: "file://second.jpg",
          name: "second.jpg",
          mimeType: "image/jpeg",
          size: 100,
        },
      ],
    } as never);
    const onUploadProposalFile = jest
      .fn()
      .mockResolvedValueOnce({
        id: "file-first",
        name: "first.jpg",
        sizeBytes: 100,
      })
      .mockRejectedValueOnce(new Error("upload failed"));
    const queryClient = queryClientWithRatings(["leader-1"]);
    const view = await renderWithAppTheme(
      <QueryClientProvider client={queryClient}>
        <TeamAssembleView
          locale="en"
          onUploadProposalFile={onUploadProposalFile}
          team={{
            id: "team-1",
            questId: "quest-1",
            leaderId: "leader-1",
            name: "Team",
            headcount: 2,
            state: "TEAM_FORMING" as const,
            joinCode: "ABCD2345",
            joinCodeExpiresAt: null,
            members: [
              { memberId: "leader-1", joinedAt: "2026-09-01T00:00:00Z" },
            ],
            submission: null,
            createdAt: "2026-09-01T00:00:00Z",
          }}
          viewerId="leader-1"
        />
      </QueryClientProvider>
    );

    await act(async () => {
      await fireEvent.press(view.getByTestId("team-pick-file-button"));
    });

    expect(view.getByTestId("team-proposal-file-file-first")).toBeTruthy();
    expect(view.getByText("Failed to pick file")).toBeTruthy();
  });
  it("shows Open Work Hub only to selected-team members", async () => {
    const selectedTeam: QuestTeam = {
      ...team,
      status: QuestTeamStatus.TEAM_SELECTED,
      members: [
        ...team.members,
        { workerId: "worker-1", role: "MEMBER", displayName: "Worker One" },
      ],
    };
    const onOpenWorkHub = jest.fn();
    const memberView = await renderWithQueryClient(
      <TeamAssembleView
        locale="en"
        onOpenWorkHub={onOpenWorkHub}
        openWorkHubLabel="Open Work Hub"
        team={selectedTeam}
        viewerId="worker-1"
      />
    );
    const button = memberView.getByRole("button", { name: "Open Work Hub" });
    await fireEvent.press(button);
    expect(onOpenWorkHub).toHaveBeenCalledTimes(1);

    const rejectedView = await renderWithQueryClient(
      <TeamAssembleView
        locale="en"
        onOpenWorkHub={onOpenWorkHub}
        openWorkHubLabel="Open Work Hub"
        team={{ ...selectedTeam, status: QuestTeamStatus.TEAM_REJECTED }}
        viewerId="worker-1"
      />
    );
    expect(
      rejectedView.queryByTestId("team-assemble-open-work-hub")
    ).toBeNull();

    const nonMemberView = await renderWithQueryClient(
      <TeamAssembleView
        locale="en"
        onOpenWorkHub={onOpenWorkHub}
        openWorkHubLabel="Open Work Hub"
        team={selectedTeam}
        viewerId="other-worker"
      />
    );
    expect(
      nonMemberView.queryByTestId("team-assemble-open-work-hub")
    ).toBeNull();
  });
  it("routes selected-team member to Work Hub with Quest and viewer ids", async () => {
    const selectedTeam: QuestTeam = {
      ...team,
      status: QuestTeamStatus.TEAM_SELECTED,
      members: [
        ...team.members,
        { workerId: "worker-1", role: "MEMBER", displayName: "Worker One" },
      ],
    };
    const previousTeamProps = mockTeamDetailView.team;
    mockTeamDetailView.team = { ...previousTeamProps, team: selectedTeam };
    mockTeamPush.mockClear();

    const view = await renderWithQueryClient(
      <TeamAssembleScreen questId="quest-1" />
    );
    await fireEvent.press(view.getByTestId("team-assemble-open-work-hub"));

    expect(mockTeamPush).toHaveBeenCalledWith({
      pathname: "/quest/[id]/work",
      params: { id: "quest-1", viewerId: "worker-1" },
    });
    mockTeamDetailView.team = previousTeamProps;
  });
});
