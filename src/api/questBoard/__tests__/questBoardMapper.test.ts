import {
  mapQuestBoardCard,
  mapQuestBoardDetail,
  mapQuestBoardPage,
} from "../questBoardMapper";
import type { QuestBoardCard, QuestBoardDetail } from "../questBoardContracts";

const cardTag = {
  id: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
  name: "Design",
};

const card: QuestBoardCard = {
  id: "2ad5b944-830b-4e28-95a7-5fe2792b713a",
  title: "Design a landing page",
  questReward: 980,
  tag: cardTag,
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  headcount: 1,
  activeWorkerCount: 0,
  startTime: "2026-09-30T09:00:00.000+07:00",
  dueAt: "2026-09-30T11:00:00.000+07:00",
  hirerName: "Hirer display name",
  location: "Online",
};

describe("questBoardMapper", () => {
  test("maps a Board card to its minimal production projection", () => {
    expect(mapQuestBoardCard(card)).toEqual({
      questId: card.id,
      title: "Design a landing page",
      questReward: 980,
      tag: cardTag,
      mode: "FIRST_COME_FIRST_SERVED",
      participation: "SINGLE",
      headcount: 1,
      activeWorkerCount: 0,
      startTime: "2026-09-30T09:00:00.000+07:00",
      dueAt: "2026-09-30T11:00:00.000+07:00",
      hirerName: "Hirer display name",
      location: "Online",
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

  test("preserves nullable tag and dueAt in the production projection", () => {
    const item = mapQuestBoardCard({
      ...card,
      tag: null,
      dueAt: null,
    });

    expect(item.tag).toBeNull();
    expect(item.dueAt).toBeNull();
  });

  test("maps server detail state and capacity without adding client policy", () => {
    const detail: QuestBoardDetail = {
      id: card.id,
      title: card.title,
      description: "Server detail",
      condition: { items: [{ position: 0, text: "Do the work" }] },
      tag: card.tag,
      mode: card.mode,
      participation: card.participation,
      state: "QUEST_ASSIGNED",
      questReward: card.questReward,
      headcount: card.headcount,
      activeWorkerCount: 1,
      startTime: card.startTime,
      dueAt: card.dueAt,
      proofRequired: true,
      hirerName: card.hirerName,
      locations: [{ label: "Online" }],
      images: [],
    };

    expect(mapQuestBoardDetail(detail)).toEqual({
      questId: detail.id,
      title: detail.title,
      description: detail.description,
      conditionItems: detail.condition.items,
      tag: detail.tag,
      mode: detail.mode,
      participation: detail.participation,
      state: detail.state,
      questReward: detail.questReward,
      headcount: detail.headcount,
      activeWorkerCount: detail.activeWorkerCount,
      startTime: detail.startTime,
      dueAt: detail.dueAt,
      proofRequired: detail.proofRequired,
      hirerName: detail.hirerName,
      locations: detail.locations,
      images: detail.images,
    });
  });
});
