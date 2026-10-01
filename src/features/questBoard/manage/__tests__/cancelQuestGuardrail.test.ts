import { QuestStatus } from "../../domain/types";
import { getCancelTier } from "../cancelQuestGuardrail";

describe("getCancelTier", () => {
  it("maps lifecycle states to tiers and terminal states to null", () => {
    expect(getCancelTier(QuestStatus.QUEST_DRAFT)).toBe(1);
    expect(getCancelTier(QuestStatus.QUEST_OPEN)).toBe(1);
    expect(getCancelTier(QuestStatus.QUEST_ASSIGNED)).toBe(2);
    expect(getCancelTier(QuestStatus.QUEST_IN_PROGRESS)).toBe(3);
    expect(getCancelTier(QuestStatus.QUEST_COMPLETED)).toBeNull();
    expect(getCancelTier(QuestStatus.QUEST_CANCELLED)).toBeNull();
    expect(getCancelTier(QuestStatus.QUEST_FAILED)).toBeNull();
  });
});
