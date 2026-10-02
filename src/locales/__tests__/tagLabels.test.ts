import type { TagItem } from "@/api/QuestApi";
import type { QuestBoardQuest } from "@/features/questBoard/domain/types";
import {
  getTagLabel,
  getTagLabelById,
  localizeQuestBoardQuest,
} from "../tagLabels";

const tags = [
  { id: "tag-design", name: "Design", nameTh: "ออกแบบ" },
  { id: "tag-plain", name: "Technology", nameTh: null },
] satisfies TagItem[];

const quest = {
  id: "quest-1",
  title: "Design a poster",
  tagId: "tag-design",
  tags: ["Design"],
  description: "Create a poster.",
  completionCriteria: "Poster is approved.",
  proofRequired: "required",
  rewardPerPerson: 100,
  headcount: 1,
  acceptedParticipants: 0,
  startDate: "2026-10-01",
  deadline: "2026-10-02",
  postedAt: "2026-09-30",
  location: "Campus",
  locationMode: "on-campus",
  participationMode: "single",
  candidateMode: "NO_CANDIDATE",
  creator: { name: "Hirer" },
  studentInterestMatch: false,
  ownerStudentId: "hirer-1",
} satisfies QuestBoardQuest;

describe("tag locale labels", () => {
  it("selects Thai names and falls back to English when Thai is absent", () => {
    expect(getTagLabel(tags[0], "th")).toBe("ออกแบบ");
    expect(getTagLabel(tags[0], "en")).toBe("Design");
    expect(getTagLabel(tags[1], "th")).toBe("Technology");
  });

  it("resolves catalog labels by tag id with a safe fallback", () => {
    expect(getTagLabelById(tags, "tag-design", "Design", "th")).toBe("ออกแบบ");
    expect(getTagLabelById(tags, "missing", "Legacy label", "th")).toBe(
      "Legacy label"
    );
  });

  it("localizes live QuestBoard tags without changing unrelated data", () => {
    const localized = localizeQuestBoardQuest(quest, tags, "th");

    expect(localized).not.toBe(quest);
    expect(localized.tags).toEqual(["ออกแบบ"]);
    expect(localized.title).toBe(quest.title);
    expect(localizeQuestBoardQuest(quest, tags, "en")).toBe(quest);
  });
});
