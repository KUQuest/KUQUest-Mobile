import { ApiClient } from "../../ApiClient";
import {
  parseQuestPublishCheckData,
  QuestCreateApi,
} from "../QuestCreateApi";
import type { QuestDraftPayload } from "@/features/createQuest/createQuestModel";

const questId = "2ad5b944-830b-4e28-95a7-5fe2792b713a";
const payload: QuestDraftPayload = {
  title: "Design a landing page",
  description: "Create the page from the approved brief.",
  condition: { items: ["Use the approved brand assets.", "Submit the source file."] },
  tagId: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
  proofRequired: true,
  startTime: "2026-09-30T09:00:00.000+07:00",
  dueAt: null,
  locations: [{ label: "Online" }],
  mode: "FIRST_COME_FIRST_SERVED",
  participation: "SINGLE",
  headcount: 1,
  questFundingTotal: 980,
};

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("QuestCreateApi", () => {
  let fetchMock: jest.Mock;
  let api: QuestCreateApi;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue(
      response({
        success: true,
        data: { id: questId, status: "QUEST_DRAFT" },
      }),
    );
    api = new QuestCreateApi(
      new ApiClient({
        baseUrl: "https://api.example.test",
        fetchImpl: fetchMock as unknown as typeof fetch,
        cookieProvider: () => "better-auth.session_token=session-cookie",
      }),
    );
  });

  test("creates a v2 draft with the exact Rulebook payload", async () => {
    await expect(
      api.createDraft(payload, { idempotencyKey: "create-quest-1" }),
    ).resolves.toEqual({ id: questId, status: "QUEST_DRAFT" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v2/quests",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "Idempotency-Key": "create-quest-1",
          Cookie: "better-auth.session_token=session-cookie",
        }),
      }),
    );
  });

  test("uses the v2 draft update and publish-check endpoints", async () => {
    await api.updateDraft(questId, payload, {
      idempotencyKey: "update-quest-1",
      ifMatch: '"v1"',
    });
    await api.getPublishCheck(questId);

    expect(fetchMock.mock.calls[0][0]).toBe(
      `https://api.example.test/api/v2/quests/${questId}`,
    );
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          "If-Match": '"v1"',
          "Idempotency-Key": "update-quest-1",
        }),
      }),
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://api.example.test/api/v2/quests/${questId}/publish-check`,
    );
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("publishes with an empty business body and idempotency key", async () => {
    await api.publishQuest(questId, { idempotencyKey: "publish-quest-1" });

    expect(fetchMock).toHaveBeenCalledWith(
      `https://api.example.test/api/v2/quests/${questId}/publish`,
      expect.objectContaining({
        method: "POST",
        body: "{}",
        headers: expect.objectContaining({
          "Idempotency-Key": "publish-quest-1",
        }),
      }),
    );
  });

  test("preserves server publish blockers and warnings without inventing rules", () => {
    expect(parseQuestPublishCheckData({
      blockingReasons: ["QUEST_DUE_AT_REQUIRED"],
      warnings: ["QUEST_IMAGE_OPTIONAL"],
    })).toEqual({
      blockingReasons: ["QUEST_DUE_AT_REQUIRED"],
      warnings: ["QUEST_IMAGE_OPTIONAL"],
    });
    expect(parseQuestPublishCheckData({ id: questId })).toBeNull();
  });
});
