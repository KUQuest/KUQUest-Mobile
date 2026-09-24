import {
  QuestMode,
  QuestParticipation,
  QuestStatus,
} from "@/features/questBoard/domain/types";

import { hirerHomeMessages } from "../hirerHomeMessages";
import {
  formatHirerDateTime,
  getHirerAttentionItems,
  getQuestProgressStages,
  prioritizeHirerHomeQuests,
} from "../hirerHomeData";
import type { LiveHirerQuestCardData } from "../hirerHomeTypes";

function liveQuest(
  overrides: Partial<LiveHirerQuestCardData>
): LiveHirerQuestCardData {
  return {
    id: "quest",
    title: "Quest",
    status: QuestStatus.QUEST_OPEN,
    mode: QuestMode.CANDIDATE,
    participation: QuestParticipation.SINGLE,
    headcount: 1,
    startTime: "2026-09-19T09:00:00+07:00",
    assignedWorkers: [],
    applicants: [],
    proofPending: false,
    ...overrides,
  };
}

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

  it("formats Quest schedule times with a year and 24-hour Bangkok time", () => {
    const dueAt = "2026-09-19T18:00:00+07:00";

    expect(formatHirerDateTime(dueAt, "th")).toBe("19 ก.ย. 2026 18:00");
    expect(formatHirerDateTime(dueAt, "en")).toBe("19 Sept 2026, 18:00");
    expect(formatHirerDateTime(null, "en")).toBe("—");
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

  it("surfaces sent Proof and pending Candidate proposals as Hirer attention items", () => {
    const applicant = { id: "member-1", displayName: "Nina" };
    const items = getHirerAttentionItems([
      liveQuest({
        id: "proof",
        status: QuestStatus.QUEST_IN_PROGRESS,
        mode: QuestMode.FIRST_COME_FIRST_SERVED,
        proofPending: true,
      }),
      liveQuest({ id: "candidates", applicants: [applicant, applicant] }),
      liveQuest({ id: "no-proposals" }),
      liveQuest({
        id: "first-come",
        mode: QuestMode.FIRST_COME_FIRST_SERVED,
        applicants: [applicant],
      }),
      liveQuest({
        id: "assigned",
        status: QuestStatus.QUEST_ASSIGNED,
        applicants: [applicant],
      }),
    ]);

    expect(items).toEqual([
      { kind: "proof", questId: "proof", questTitle: "Quest" },
      {
        kind: "applicants",
        questId: "candidates",
        questTitle: "Quest",
        count: 2,
      },
    ]);
  });
});
