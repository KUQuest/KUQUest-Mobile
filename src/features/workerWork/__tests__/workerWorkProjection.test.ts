import {
  QuestStatus,
  QuestTeamStatus,
} from "@/features/questBoard/domain/types";
import { workerSnapshot } from "@/testing/workerSnapshotFixtures";
import { projectWorkerWork } from "../workerWorkProjection";

describe("projectWorkerWork", () => {
  it("puts Worker actions first and orders active work by due time", () => {
    const projection = projectWorkerWork([
      workerSnapshot({
        id: "later",
        title: "Later proof",
        nextAction: "SUBMIT_PROOF",
        dueAt: "2026-10-03T12:00:00Z",
      }),
      workerSnapshot({
        id: "assigned",
        title: "Assigned",
        state: "QUEST_ASSIGNED",
        nextAction: "WAIT_FOR_START",
      }),
      workerSnapshot({
        id: "sooner",
        title: "Sooner completion",
        nextAction: "CONFIRM_COMPLETION",
        dueAt: "2026-10-02T12:00:00Z",
      }),
    ]);

    expect(projection.needsAction.map((item) => item.questId)).toEqual([
      "sooner",
      "later",
    ]);
    expect(projection.needsAction.map((item) => item.action)).toEqual([
      "confirmCompletion",
      "submitProof",
    ]);
    expect(projection.otherActive).toEqual([
      expect.objectContaining({ questId: "assigned", status: "awaitingStart" }),
    ]);
    expect(projection.activeCount).toBe(3);
    expect(projection.history).toEqual([]);
  });

  it("shows a sent proof as awaiting Hirer review", () => {
    const projection = projectWorkerWork([
      workerSnapshot({
        id: "sent",
        title: "Sent proof",
        proofs: [
          {
            id: "proof-1",
            questId: "sent",
            workerId: "worker-1",
            teamId: null,
            submittedByUserId: "worker-1",
            description: "Done",
            status: "PROOF_PENDING",
            submittedAt: "2026-10-01T10:00:00Z",
            createdAt: "2026-10-01T09:30:00Z",
            updatedAt: "2026-10-01T10:00:00Z",
            visibility: "FULL",
            fileIds: [],
            files: [],
          },
        ],
      }),
    ]);

    expect(projection.otherActive[0]).toEqual(
      expect.objectContaining({ status: "proofPending", needsAction: false })
    );
  });

  it("does not show another GROUP FCFS Worker's proof as this Worker's review state", () => {
    const snapshot = workerSnapshot({
      id: "group",
      title: "Group Quest",
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "GROUP",
      viewerId: "worker-2",
      proofs: [
        {
          id: "proof-worker-1",
          questId: "group",
          workerId: "worker-1",
          teamId: null,
          submittedByUserId: "worker-1",
          description: "Done",
          status: "PROOF_PENDING",
          submittedAt: "2026-10-01T10:00:00Z",
          createdAt: "2026-10-01T09:30:00Z",
          updatedAt: "2026-10-01T10:00:00Z",
          visibility: "FULL",
          fileIds: ["proof-file-1"],
          files: [],
        },
      ],
    });

    const projection = projectWorkerWork([snapshot]);

    expect(projection.otherActive[0]).toEqual(
      expect.objectContaining({ status: "inProgress", needsAction: false })
    );
  });

  it("keeps every finished Assignment in history with its outcome", () => {
    const projection = projectWorkerWork([
      workerSnapshot({
        id: "done",
        title: "Done",
        state: "QUEST_COMPLETED",
        assignmentState: "ASSIGNMENT_COMPLETED",
      }),
      workerSnapshot({
        id: "not-approved",
        title: "Not approved",
        state: "QUEST_FAILED",
        assignmentState: "ASSIGNMENT_INCOMPLETE",
      }),
      workerSnapshot({
        id: "cancelled",
        title: "Cancelled",
        state: "QUEST_CANCELLED",
        assignmentState: "ASSIGNMENT_CANCELLED",
      }),
    ]);

    expect(projection.activeCount).toBe(0);
    expect(
      Object.fromEntries(
        projection.history.map((item) => [item.questId, item.status])
      )
    ).toEqual({
      done: "completed",
      "not-approved": "incomplete",
      cancelled: "cancelled",
    });
  });
  it("projects Candidate applications without Assignments into active and history", () => {
    const quest = {
      title: "Candidate Quest",
      startTime: "2026-10-01T09:00:00Z",
      dueAt: null,
      mode: "CANDIDATE" as const,
      participation: "SINGLE" as const,
      state: "QUEST_OPEN" as const,
    };
    const applications = [
      {
        id: "application-applied",
        questId: "quest-applied",
        memberId: "worker-1",
        kind: "SINGLE" as const,
        state: "APPLICATION_APPLIED" as const,
        appliedAt: "2026-09-01T09:00:00Z",
        quest,
      },
      {
        id: "application-team-submitted",
        questId: "quest-team-submitted",
        memberId: "worker-1",
        kind: "TEAM" as const,
        state: "TEAM_SUBMITTED" as const,
        appliedAt: "2026-09-01T09:00:00Z",
        quest: { ...quest, participation: "GROUP" as const },
      },
      {
        id: "application-rejected",
        questId: "quest-rejected",
        memberId: "worker-1",
        kind: "SINGLE" as const,
        state: "APPLICATION_REJECTED" as const,
        appliedAt: "2026-09-01T09:00:00Z",
        quest,
      },
      {
        id: "application-closed",
        questId: "quest-closed",
        memberId: "worker-1",
        kind: "SINGLE" as const,
        state: "APPLICATION_APPLIED" as const,
        appliedAt: "2026-09-01T09:00:00Z",
        quest: { ...quest, state: "QUEST_ASSIGNED" as const },
      },
      {
        id: "application-selected-active",
        questId: "quest-selected",
        memberId: "worker-1",
        kind: "SINGLE" as const,
        state: "APPLICATION_SELECTED" as const,
        appliedAt: "2026-09-01T09:00:00Z",
        quest: { ...quest, state: "QUEST_ASSIGNED" as const },
      },
      {
        id: "application-selected",
        questId: "quest-assigned",
        memberId: "worker-1",
        kind: "SINGLE" as const,
        state: "APPLICATION_SELECTED" as const,
        appliedAt: "2026-09-01T09:00:00Z",
        quest: { ...quest, state: "QUEST_ASSIGNED" as const },
      },
      {
        id: "team-selected",
        questId: "quest-team-selected",
        memberId: "worker-1",
        kind: "TEAM" as const,
        state: QuestTeamStatus.TEAM_SELECTED,
        appliedAt: "2026-09-01T09:00:00Z",
        quest: {
          ...quest,
          participation: "GROUP" as const,
          state: QuestStatus.QUEST_ASSIGNED,
        },
      },
    ];

    const projection = projectWorkerWork(
      [workerSnapshot({ id: "quest-assigned", title: "Assigned Quest" })],
      applications
    );

    expect(projection.otherActive).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questId: "quest-applied",
          status: "pendingSelection",
          destination: "questDetail",
        }),
        expect.objectContaining({
          questId: "quest-team-submitted",
          status: "pendingSelection",
          destination: "questDetail",
        }),
        expect.objectContaining({
          questId: "quest-selected",
          status: "selected",
          destination: "workHub",
        }),
        expect.objectContaining({
          questId: "quest-team-selected",
          status: "selected",
          destination: "workHub",
        }),
      ])
    );
    expect(projection.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questId: "quest-rejected",
          status: "rejected",
          destination: "questDetail",
        }),
        expect.objectContaining({
          questId: "quest-closed",
          status: "notSelected",
          destination: "questDetail",
        }),
      ])
    );
    expect(
      [
        ...projection.needsAction,
        ...projection.otherActive,
        ...projection.history,
      ].filter((item) => item.questId === "quest-assigned")
    ).toEqual([
      expect.objectContaining({
        status: "inProgress",
        questState: "QUEST_IN_PROGRESS",
      }),
    ]);
  });

  it("shows forming Candidate Teams as active", () => {
    const projection = projectWorkerWork(
      [],
      [
        {
          id: "forming-team",
          questId: "quest-forming",
          memberId: "worker-1",
          kind: "TEAM",
          state: "TEAM_FORMING",
          appliedAt: "2026-09-01T09:00:00Z",
          quest: {
            title: "Form a team",
            startTime: "2026-10-01T09:00:00Z",
            dueAt: null,
            mode: "CANDIDATE",
            participation: "GROUP",
            state: "QUEST_OPEN",
          },
        },
      ]
    );

    expect(projection.otherActive[0]).toEqual(
      expect.objectContaining({
        questId: "quest-forming",
        status: "teamForming",
      })
    );
  });
});
