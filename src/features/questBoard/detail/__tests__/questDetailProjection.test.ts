import { workerSnapshot } from "@/testing/workerSnapshotFixtures";
import { getQuestDetailProjection } from "../questDetailProjection";

describe("getQuestDetailProjection", () => {
  it("carries the live Respond to Edit capability into the detail projection", () => {
    const projection = (canRespondToEdit: boolean) =>
      getQuestDetailProjection(
        workerSnapshot({
          id: "quest-edit-1",
          title: "Assigned Quest",
          state: "QUEST_ASSIGNED",
          capabilities: { canRespondToEdit },
        })
      );

    expect(projection(true).capabilities.canRespondToEdit).toBe(true);
    expect(projection(false).capabilities.canRespondToEdit).toBe(false);
  });

  it("counts a Hirer's participants from live Assignments because the canonical read carries no count", () => {
    const base = workerSnapshot({
      id: "quest-owner-1",
      title: "Owner Quest",
      state: "QUEST_IN_PROGRESS",
    });
    const assignment = (workerId: string, state: string) => ({
      questId: "quest-owner-1",
      workerId,
      state,
      questState: "QUEST_IN_PROGRESS",
      startedAt: null,
    });
    const snapshot = {
      ...base,
      actor: "HIRER",
      quest: {
        id: "quest-owner-1",
        version: 1,
        hiddenAt: null,
        title: "Owner Quest",
        description: null,
        condition: { items: [] },
        tag: null,
        mode: "FIRST_COME_FIRST_SERVED",
        participation: "GROUP",
        state: "QUEST_IN_PROGRESS",
        questFundingTotal: 300,
        headcount: 3,
        startTime: "2026-10-01T09:00:00Z",
        dueAt: "2026-10-01T12:00:00Z",
        proofRequired: false,
        locations: [],
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
      },
      assignments: [
        assignment("worker-1", "ASSIGNMENT_ACTIVE"),
        assignment("worker-2", "ASSIGNMENT_ACTIVE"),
        assignment("worker-3", "ASSIGNMENT_CANCELLED"),
      ],
    } as never;

    const projection = getQuestDetailProjection(snapshot);

    expect(projection.participantCount).toBe(2);
    expect(projection.quest.acceptedParticipants).toBe(2);
  });

  it("counts the Worker of a finished SINGLE Quest, whose roster is empty", () => {
    const base = workerSnapshot({
      id: "quest-single-1",
      title: "Single Quest",
      state: "QUEST_COMPLETED",
    });
    const snapshot = {
      ...base,
      participation: "SINGLE",
      participants: [],
      quest: { ...base.quest, participation: "SINGLE", headcount: 1 },
      assignments: [
        {
          questId: "quest-single-1",
          workerId: "worker-1",
          state: "ASSIGNMENT_COMPLETED",
          questState: "QUEST_COMPLETED",
          startedAt: null,
        },
      ],
    } as never;

    const projection = getQuestDetailProjection(snapshot);

    expect(projection.participantCount).toBe(1);
    expect(projection.quest.acceptedParticipants).toBe(1);
  });
});
