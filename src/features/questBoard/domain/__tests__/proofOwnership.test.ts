import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";
import {
  isOwnProofSubmission,
  type ProofOwnershipScope,
} from "../proofOwnership";

const VIEWER = "viewer-1";
const PEER = "peer-2";
const TEAM = { id: "team-1" };
const OTHER_TEAM = { id: "team-9" };

function proof(
  overrides: Partial<QuestV2ProofSubmission> = {}
): QuestV2ProofSubmission {
  return {
    id: "proof-1",
    questId: "quest-1",
    workerId: PEER,
    teamId: null,
    submittedByUserId: PEER,
    description: null,
    status: null,
    submittedAt: null,
    createdAt: "2026-10-01T09:00:00Z",
    updatedAt: "2026-10-01T09:00:00Z",
    visibility: "FULL",
    fileIds: [],
    files: [],
    ...overrides,
  };
}

function scope(
  overrides: Partial<ProofOwnershipScope> = {}
): ProofOwnershipScope {
  return {
    viewerId: VIEWER,
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    team: null,
    ...overrides,
  };
}

describe("isOwnProofSubmission", () => {
  it("owns a SINGLE proof the viewer submitted as the selected Worker", () => {
    expect(
      isOwnProofSubmission(
        proof({ workerId: VIEWER, submittedByUserId: VIEWER }),
        scope({ participation: "SINGLE" })
      )
    ).toBe(true);
  });

  it("does not own another Worker's SINGLE proof", () => {
    expect(
      isOwnProofSubmission(proof(), scope({ participation: "SINGLE" }))
    ).toBe(false);
  });

  it("owns only the viewer's own proof in GROUP + FIRST_COME_FIRST_SERVED", () => {
    const group = scope({ participation: "GROUP" });

    expect(
      isOwnProofSubmission(
        proof({ workerId: VIEWER, submittedByUserId: VIEWER }),
        group
      )
    ).toBe(true);
    expect(isOwnProofSubmission(proof(), group)).toBe(false);
  });

  it("matches a GROUP + CANDIDATE Team proof for every Team member by Team id", () => {
    const teamScope = scope({
      mode: "CANDIDATE",
      participation: "GROUP",
      team: TEAM,
    });
    const leaderProof = proof({
      workerId: null,
      teamId: TEAM.id,
      submittedByUserId: PEER,
    });

    expect(isOwnProofSubmission(leaderProof, teamScope)).toBe(true);
  });

  it("does not match a GROUP + CANDIDATE proof from a different Team", () => {
    const teamScope = scope({
      mode: "CANDIDATE",
      participation: "GROUP",
      team: TEAM,
    });

    expect(
      isOwnProofSubmission(
        proof({
          workerId: null,
          teamId: OTHER_TEAM.id,
          submittedByUserId: PEER,
        }),
        teamScope
      )
    ).toBe(false);
  });

  it("ignores Team ids outside GROUP + CANDIDATE, where no Team exists", () => {
    const fcfsWithTeam = scope({
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "GROUP",
      team: TEAM,
    });

    expect(
      isOwnProofSubmission(
        proof({ workerId: PEER, teamId: TEAM.id, submittedByUserId: PEER }),
        fcfsWithTeam
      )
    ).toBe(false);
  });
});
