import type { QuestV2Application, QuestV2Team } from "@/api/questV2Contracts";
import {
  getPendingApplications,
  getPendingTeams,
  getSelectRosterPermissions,
  getSelectRosterProposalCount,
} from "../selectRosterSelectors";

function application(
  id: string,
  state: QuestV2Application["state"]
): QuestV2Application {
  return {
    id,
    questId: "quest-1",
    memberId: `member-${id}`,
    state,
    appliedAt: "2026-09-01T00:00:00.000Z",
  };
}

function team(id: string, state: QuestV2Team["state"]): QuestV2Team {
  return {
    id,
    questId: "quest-1",
    leaderId: `leader-${id}`,
    name: `Team ${id}`,
    headcount: 2,
    state,
    joinCode: null,
    joinCodeExpiresAt: null,
    members: [{ memberId: `leader-${id}`, joinedAt: "2026-09-01T00:00:00Z" }],
    submission: null,
    createdAt: "2026-09-01T00:00:00Z",
  };
}

describe("SelectRoster selectors", () => {
  it("uses only the capabilities for the current participation mode", () => {
    expect(
      getSelectRosterPermissions({
        participation: "SINGLE",
        capabilities: {
          canSelectCandidate: true,
          canRejectCandidate: false,
          canSelectTeam: true,
          canRejectTeam: true,
        },
      })
    ).toEqual({
      canSelectCandidate: true,
      canRejectCandidate: false,
      canSelectTeam: false,
      canRejectTeam: false,
    });

    expect(
      getSelectRosterPermissions({
        participation: "GROUP",
        capabilities: {
          canSelectCandidate: true,
          canRejectCandidate: true,
          canSelectTeam: false,
          canRejectTeam: true,
        },
      })
    ).toEqual({
      canSelectCandidate: false,
      canRejectCandidate: false,
      canSelectTeam: false,
      canRejectTeam: true,
    });
  });

  it("filters only applied applications and submitted teams", () => {
    const applications = [
      application("applied", "APPLICATION_APPLIED"),
      application("selected", "APPLICATION_SELECTED"),
      application("rejected", "APPLICATION_REJECTED"),
      application("withdrawn", "APPLICATION_WITHDRAWN"),
    ];
    const teams = [
      team("submitted", "TEAM_SUBMITTED"),
      team("submitted-2", "TEAM_SUBMITTED"),
      team("forming", "TEAM_FORMING"),
      team("selected", "TEAM_SELECTED"),
      team("rejected", "TEAM_REJECTED"),
      team("disbanded", "TEAM_DISBANDED"),
    ];

    const pendingApplications = getPendingApplications(applications);
    const pendingTeams = getPendingTeams(teams);

    expect(pendingApplications.map(({ id }) => id)).toEqual(["applied"]);
    expect(pendingTeams.map(({ id }) => id)).toEqual([
      "submitted",
      "submitted-2",
    ]);
    expect(
      getSelectRosterProposalCount("SINGLE", pendingApplications, pendingTeams)
    ).toBe(1);
    expect(
      getSelectRosterProposalCount("GROUP", pendingApplications, pendingTeams)
    ).toBe(2);
  });
});
