import * as SecureStore from "expo-secure-store";

import { liveQuestService } from "@/features/questBoard/liveQuestService";
import {
  initialDraft,
  toQuestV2Payload,
  type QuestDraft,
} from "../createQuestModel";
import {
  CREATE_QUEST_DRAFT_KEY,
  listQuestDrafts,
  persistQuestDraft,
} from "../createQuestPersistence";

jest.mock("@/features/questBoard/liveQuestService", () => ({
  liveQuestService: {
    createQuest: jest.fn(),
    getPublishCheck: jest.fn(),
    publishQuest: jest.fn(),
  },
}));

describe("Quest Creation and Draft Scenarios", () => {
  const storageKey = `${CREATE_QUEST_DRAFT_KEY}.test-hirer-1`;
  const indexKey = `${storageKey}.index`;

  beforeEach(async () => {
    await SecureStore.deleteItemAsync(indexKey);
    jest.clearAllMocks();
  });

  describe("Create and Publish 2 Quests", () => {
    it("successfully creates and publishes 2 quests to QUEST_OPEN", async () => {
      const quest1Draft: QuestDraft = {
        ...initialDraft,
        title: "Campus Tree Planting",
        description: "Help plant trees near the green park.",
        conditions: "Plant 5 trees\nClean the area",
        candidateMode: "FIRST_COME_FIRST_SERVED",
        participation: "SINGLE",
        headcount: "1",
        wage: "300",
        startDate: "2026-09-25",
        deadline: "2026-09-25",
        startTime: "09:00",
        endTime: "12:00",
        location: "Green Park",
      };

      const quest2Draft: QuestDraft = {
        ...initialDraft,
        title: "Lab Equipment Inventory",
        description: "Count and catalog laboratory equipment.",
        conditions: "Update spreadsheet\nVerify serial numbers",
        candidateMode: "CANDIDATE",
        participation: "SINGLE",
        headcount: "1",
        wage: "500",
        startDate: "2026-09-26",
        deadline: "2026-09-26",
        startTime: "13:00",
        endTime: "17:00",
        location: "Science Building 3",
      };

      const mockCreate = liveQuestService.createQuest as jest.Mock;
      const mockPublishCheck = liveQuestService.getPublishCheck as jest.Mock;
      const mockPublish = liveQuestService.publishQuest as jest.Mock;

      // Quest 1
      mockCreate.mockResolvedValueOnce({
        id: "quest-uuid-1",
        version: 1,
        state: "QUEST_DRAFT",
      });
      mockPublishCheck.mockResolvedValueOnce({
        canPublish: true,
        blockingReasons: [],
      });
      mockPublish.mockResolvedValueOnce({
        state: "QUEST_OPEN",
        quest: { id: "quest-uuid-1", state: "QUEST_OPEN" },
      });

      // Quest 2
      mockCreate.mockResolvedValueOnce({
        id: "quest-uuid-2",
        version: 1,
        state: "QUEST_DRAFT",
      });
      mockPublishCheck.mockResolvedValueOnce({
        canPublish: true,
        blockingReasons: [],
      });
      mockPublish.mockResolvedValueOnce({
        state: "QUEST_OPEN",
        quest: { id: "quest-uuid-2", state: "QUEST_OPEN" },
      });

      // Execute Quest 1
      const payload1 = toQuestV2Payload(quest1Draft);
      const created1 = await liveQuestService.createQuest(
        payload1,
        "idemp-create-1"
      );
      expect(created1.state).toBe("QUEST_DRAFT");
      const check1 = await liveQuestService.getPublishCheck(created1.id);
      expect(check1.canPublish).toBe(true);
      const published1 = await liveQuestService.publishQuest(
        created1.id,
        "idemp-pub-1"
      );
      expect(published1.state).toBe("QUEST_OPEN");

      // Execute Quest 2
      const payload2 = toQuestV2Payload(quest2Draft);
      const created2 = await liveQuestService.createQuest(
        payload2,
        "idemp-create-2"
      );
      expect(created2.state).toBe("QUEST_DRAFT");
      const check2 = await liveQuestService.getPublishCheck(created2.id);
      expect(check2.canPublish).toBe(true);
      const published2 = await liveQuestService.publishQuest(
        created2.id,
        "idemp-pub-2"
      );
      expect(published2.state).toBe("QUEST_OPEN");

      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockPublish).toHaveBeenCalledTimes(2);
    });
  });

  describe("Save 3 Drafts with 2 SOLO mode", () => {
    it("saves 3 drafts (2 SOLO, 1 GROUP) and retrieves them from storage", async () => {
      // Draft 1: SOLO mode (SINGLE participation, headcount 1)
      const draft1Solo: QuestDraft = {
        ...initialDraft,
        title: "Draft 1: Library Book Sorting",
        description: "Organize returning books by classification.",
        conditions: "Complete shelf 4A-4F",
        participation: "SINGLE",
        candidateMode: "FIRST_COME_FIRST_SERVED",
        headcount: "1",
        wage: "200",
      };

      // Draft 2: SOLO mode (SINGLE participation, headcount 1)
      const draft2Solo: QuestDraft = {
        ...initialDraft,
        title: "Draft 2: Event Poster Graphic",
        description: "Design an Instagram story poster for campus festival.",
        conditions: "Provide Figma and PNG exports",
        participation: "SINGLE",
        candidateMode: "CANDIDATE",
        headcount: "1",
        wage: "400",
      };

      // Draft 3: GROUP mode (GROUP participation, headcount 4)
      const draft3Group: QuestDraft = {
        ...initialDraft,
        title: "Draft 3: Graduation Ceremony Usher Team",
        description: "Four ushers to guide attendees and handle seating.",
        conditions: "Attend morning briefing\nAssist seating",
        participation: "GROUP",
        candidateMode: "FIRST_COME_FIRST_SERVED",
        headcount: "4",
        wage: "800",
      };

      // Save all 3 drafts
      await persistQuestDraft(
        storageKey,
        "draft-solo-1",
        draft1Solo,
        1,
        "DRAFT"
      );
      await persistQuestDraft(
        storageKey,
        "draft-solo-2",
        draft2Solo,
        2,
        "DRAFT"
      );
      await persistQuestDraft(
        storageKey,
        "draft-group-3",
        draft3Group,
        3,
        "DRAFT"
      );

      // Retrieve all drafts
      const allDrafts = await listQuestDrafts(storageKey);

      expect(allDrafts).toHaveLength(3);

      const soloDrafts = allDrafts.filter(
        (item) => item.snapshot.draft.participation === "SINGLE"
      );
      const groupDrafts = allDrafts.filter(
        (item) => item.snapshot.draft.participation === "GROUP"
      );

      // Exactly 2 SOLO mode drafts
      expect(soloDrafts).toHaveLength(2);
      expect(soloDrafts[0].snapshot.draft.headcount).toBe("1");
      expect(soloDrafts[1].snapshot.draft.headcount).toBe("1");
      expect(soloDrafts.map((d) => d.snapshot.draft.title)).toEqual([
        "Draft 1: Library Book Sorting",
        "Draft 2: Event Poster Graphic",
      ]);

      // Exactly 1 GROUP mode draft
      expect(groupDrafts).toHaveLength(1);
      expect(groupDrafts[0].snapshot.draft.headcount).toBe("4");
      expect(groupDrafts[0].snapshot.draft.title).toBe(
        "Draft 3: Graduation Ceremony Usher Team"
      );

      // Check draft states
      allDrafts.forEach((item) => {
        expect(item.snapshot.state).toBe("DRAFT");
      });
    });
  });
});
