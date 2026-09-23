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
});
