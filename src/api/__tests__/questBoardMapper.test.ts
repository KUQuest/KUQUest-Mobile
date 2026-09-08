import {
  mapQuestBoardCard,
  mapQuestBoardPage,
} from "../questBoardMapper";
import type { QuestBoardCard } from "../questBoardContracts";

const card: QuestBoardCard = {
  id: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
  title: "Design a landing page",
  reward: 980,
  tag: {
    id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
    name: "Design",
  },
  mode: "NO_CANDIDATE",
  participation: "SOLO",
  headcount: 1,
  startTime: "2026-09-30T09:00:00.000+07:00",
  estimatedDurationMinutes: 120,
  hirerName: "Hirer display name",
  location: { label: "Online" },
};

describe("questBoardMapper", () => {
  test("maps a Board card to its minimal production projection", () => {
    expect(mapQuestBoardCard(card)).toEqual({
      questId: card.id,
      title: "Design a landing page",
      reward: 980,
      tag: { id: card.tag.id, name: "Design" },
      mode: "NO_CANDIDATE",
      participation: "SOLO",
      headcount: 1,
      startTime: "2026-09-30T09:00:00.000+07:00",
      estimatedDurationMinutes: 120,
      hirerName: "Hirer display name",
      location: { label: "Online" },
    });
  });

  test("does not add fixture-only fields to the production projection", () => {
    const item = mapQuestBoardCard(card);

    expect(item).not.toHaveProperty("description");
    expect(item).not.toHaveProperty("completionCriteria");
    expect(item).not.toHaveProperty("postedAt");
    expect(item).not.toHaveProperty("locationMode");
    expect(item).not.toHaveProperty("studentInterestMatch");
    expect(item).not.toHaveProperty("ownerStudentId");
    expect(item).not.toHaveProperty("acceptedParticipants");
  });

  test("preserves the server cursor for the next Board request", () => {
    expect(mapQuestBoardPage({
      items: [card],
      nextCursor: "opaque-cursor",
    })).toEqual({
      items: [expect.objectContaining({ questId: card.id })],
      nextCursor: "opaque-cursor",
    });
  });
});
