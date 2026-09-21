import { QuestStatus } from "@/features/questBoard/types";

import { hirerHomeMessages } from "../hirerHomeMessages";
import {
  formatHirerDueAt,
  getQuestProgressStages,
  prioritizeHirerHomeQuests,
} from "../hirerHomeData";

describe("Hirer Home Quest progress", () => {
  it("projects every canonical lifecycle state into five human stages", () => {
    const cases = [
      [QuestStatus.QUEST_DRAFT, "current"],
      [QuestStatus.QUEST_OPEN, "current"],
      [QuestStatus.QUEST_ASSIGNED, "current"],
      [QuestStatus.QUEST_IN_PROGRESS, "current"],
      [QuestStatus.QUEST_COMPLETED, "completed"],
      [QuestStatus.QUEST_CANCELLED, "terminal"],
      [QuestStatus.QUEST_FAILED, "terminal"],
    ] as const;

    for (const [status, expectedState] of cases) {
      const stages = getQuestProgressStages(status);

      expect(stages).toHaveLength(5);
      expect(stages.some((stage) => stage.state === expectedState)).toBe(true);
    }
  });

  it("formats due dates in the Bangkok time zone for both locales", () => {
    const dueAt = "2026-09-19T18:00:00+07:00";

    expect(formatHirerDueAt(dueAt, "th")).toContain("18:00");
    expect(formatHirerDueAt(dueAt, "en")).toContain("18:00");
  });
  it("prioritizes live work before assigned and open Quests", () => {
    const quests = [
      {
        id: "open",
        status: QuestStatus.QUEST_OPEN,
        dueAt: "2026-09-01T00:00:00.000Z",
      },
      {
        id: "in-progress",
        status: QuestStatus.QUEST_IN_PROGRESS,
        dueAt: null,
      },
      {
        id: "assigned",
        status: QuestStatus.QUEST_ASSIGNED,
        dueAt: "2026-09-30T00:00:00.000Z",
      },
    ];

    expect(prioritizeHirerHomeQuests(quests).map((quest) => quest.id)).toEqual([
      "in-progress",
      "assigned",
      "open",
    ]);
  });

  it("localizes the timeline heading for Thai users", () => {
    expect(hirerHomeMessages.th.timelineTitle).toBe("ลำดับการทำงาน");
    expect(hirerHomeMessages.en.timelineTitle).toBe("QUEST TIMELINE");
  });
});
