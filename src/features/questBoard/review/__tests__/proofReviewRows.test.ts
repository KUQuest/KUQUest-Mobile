import type { QuestV2ProofSubmission } from "@/api/questV2Contracts";

import { projectProofReviewRows } from "../proofReviewRows";

type Source = Parameters<typeof projectProofReviewRows>[0];

function proof(
  id: string,
  overrides: Partial<QuestV2ProofSubmission> = {}
): QuestV2ProofSubmission {
  return {
    id,
    questId: "quest-1",
    workerId: null,
    teamId: null,
    submittedByUserId: "worker-1",
    description: null,
    status: "PROOF_PENDING",
    submittedAt: "2026-09-23T10:00:00Z",
    createdAt: "2026-09-23T09:00:00Z",
    updatedAt: "2026-09-23T10:00:00Z",
    visibility: "FULL",
    fileIds: [],
    files: [],
    ...overrides,
  };
}

function source(overrides: Partial<Source>): Source {
  return {
    mode: "FIRST_COME_FIRST_SERVED",
    participation: "SINGLE",
    assignments: [],
    participants: [],
    teams: [],
    proofs: [],
    ...overrides,
  };
}

const assignment = (workerId: string, state = "ASSIGNMENT_ACTIVE") =>
  ({ workerId, state }) as Source["assignments"][number];

describe("projectProofReviewRows", () => {
  it.each(["FIRST_COME_FIRST_SERVED", "CANDIDATE"] as const)(
    "SINGLE + %s yields the one Worker's submission",
    (mode) => {
      const rows = projectProofReviewRows(
        source({
          mode,
          assignments: [assignment("worker-1")],
          proofs: [proof("proof-1", { workerId: "worker-1" })],
        })
      );

      expect(rows).toEqual([
        expect.objectContaining({
          kind: "worker",
          key: "worker-1",
          name: undefined,
          proof: expect.objectContaining({ id: "proof-1" }),
        }),
      ]);
    }
  );

  it("GROUP + FCFS lists every Active Worker with pending, missing, then decided submissions", () => {
    const rows = projectProofReviewRows(
      source({
        participation: "GROUP",
        assignments: [
          assignment("worker-1"),
          assignment("worker-2"),
          assignment("worker-3"),
          assignment("worker-4", "ASSIGNMENT_CANCELLED"),
        ],
        participants: [{ id: "worker-2", displayName: "Kai Worker" }],
        proofs: [
          proof("proof-1", { workerId: "worker-1", status: "PROOF_APPROVED" }),
          proof("proof-2", { workerId: "worker-2" }),
          proof("draft-3", { workerId: "worker-3", status: null }),
        ],
      })
    );

    expect(
      rows.map((row) => [row.key, row.proof?.id ?? null, row.name])
    ).toEqual([
      ["worker-2", "proof-2", "Kai Worker"],
      ["worker-3", null, undefined],
      ["worker-1", "proof-1", undefined],
    ]);
  });

  it("GROUP + CANDIDATE yields one Team submission sent by the Team Leader", () => {
    const team = {
      id: "team-1",
      questId: "quest-1",
      leaderId: "leader-1",
      name: "Poster Crew",
      headcount: 3,
      state: "TEAM_SELECTED",
      joinCode: null,
      joinCodeExpiresAt: null,
      members: [],
      submission: null,
      createdAt: "2026-09-20T09:00:00Z",
    } as const;
    const base = source({
      mode: "CANDIDATE",
      participation: "GROUP",
      assignments: [assignment("leader-1"), assignment("member-2")],
      participants: [{ id: "leader-1", displayName: "Lead Student" }],
      teams: [{ ...team, members: [] }],
    });

    expect(projectProofReviewRows(base)).toEqual([
      expect.objectContaining({
        kind: "team",
        name: "Poster Crew",
        leaderName: "Lead Student",
        proof: null,
      }),
    ]);
    expect(
      projectProofReviewRows({
        ...base,
        proofs: [
          proof("proof-team", {
            teamId: "team-1",
            submittedByUserId: "leader-1",
          }),
        ],
      })
    ).toEqual([
      expect.objectContaining({
        kind: "team",
        key: "proof-team",
        name: "Poster Crew",
        leaderName: "Lead Student",
      }),
    ]);
  });
});
