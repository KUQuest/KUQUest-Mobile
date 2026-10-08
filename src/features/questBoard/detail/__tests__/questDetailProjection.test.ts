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
        }),
        "worker-1"
      );

    expect(projection(true).capabilities.canRespondToEdit).toBe(true);
    expect(projection(false).capabilities.canRespondToEdit).toBe(false);
  });
});
