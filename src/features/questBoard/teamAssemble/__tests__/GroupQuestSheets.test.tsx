import React, { type ReactNode } from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { renderWithQueryClient } from "@/testing/queryTestUtils";

import { CandidateReviewSheet } from "../components/CandidateReviewSheet";
import { PartialGroupStartConsentSheet } from "../components/PartialGroupStartConsentSheet";
import { TeamAssembleView } from "../components/TeamAssembleView";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { profileKeys } from "@/features/profile/api/profileQueries";
import type { QuestV2Application } from "@/api/questV2Contracts";
import {
  QuestApplicationStatus,
  QuestPartialStartConsentStatus,
  QuestTeamStatus,
  type QuestApplication,
  type QuestInvitation,
  type QuestPartialStartConsent,
  type QuestTeam,
} from "../../domain/types";

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
    const view = await render(
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
    const view = await render(
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

  it("counts down the five-minute partial-start consent window and exposes voter actions", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-12T09:00:00.000Z"));
    const onVote = jest.fn();
    const view = await render(
      <PartialGroupStartConsentSheet
        actualHeadcount={1}
        consent={makeConsent()}
        hirerId="hirer-1"
        locale="en"
        onClose={() => undefined}
        onVote={onVote}
        requestedHeadcount={3}
        voters={[
          { id: "hirer-1", displayName: "Quest Hirer", role: "HIRER" },
          { id: "worker-1", displayName: "Joined Worker", role: "WORKER" },
        ]}
        viewerId="hirer-1"
        visible
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
    const approved = await render(
      <PartialGroupStartConsentSheet
        consent={makeConsent(
          QuestPartialStartConsentStatus.PARTIAL_START_APPROVED
        )}
        locale="en"
        onClose={() => undefined}
        visible
      />
    );
    expect(approved.getByTestId("partial-group-start-approved")).toBeTruthy();
    expect(approved.queryByTestId("partial-group-start-approve")).toBeNull();

    const cancelled = await render(
      <PartialGroupStartConsentSheet
        consent={makeConsent(
          QuestPartialStartConsentStatus.PARTIAL_START_TIMED_OUT
        )}
        locale="en"
        onClose={() => undefined}
        visible
      />
    );
    expect(cancelled.getByTestId("partial-group-start-cancelled")).toBeTruthy();
    expect(
      cancelled.getByText(
        "The five-minute consent window ended before everyone approved. Reserved rewards are fully refunded."
      )
    ).toBeTruthy();
  });
  it("joins the Team named by a pasted invite link with an uppercased Join Code", async () => {
    const onJoinTeam = jest.fn();
    const view = await render(
      <TeamAssembleView locale="en" onJoinTeam={onJoinTeam} team={null} />
    );
    const input = view.getByTestId("team-assemble-join-code-input");

    await fireEvent.changeText(input, "Join my team: https://example.test");
    expect(
      view.getByText(
        "This invite link is incomplete. Ask your Team Leader to share it again."
      )
    ).toBeTruthy();
    await fireEvent.press(view.getByTestId("team-assemble-join"));
    expect(onJoinTeam).not.toHaveBeenCalled();

    await fireEvent.changeText(
      input,
      'Join my KUQuest team "Gardeners": kuquestmobile://quest/q-1/team?teamId=0b8f1c2e-4d5a-4e6f-8a9b-1c2d3e4f5a6b&code=abcd2345'
    );
    await fireEvent.press(view.getByTestId("team-assemble-join"));
    expect(onJoinTeam).toHaveBeenCalledWith(
      "0b8f1c2e-4d5a-4e6f-8a9b-1c2d3e4f5a6b",
      "ABCD2345"
    );
  });

  it("creates a Team only with a non-blank trimmed name", async () => {
    const onCreateTeam = jest.fn();
    const view = await render(
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
    const view = await render(
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
});
