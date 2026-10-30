import {
  listMyHirerCompletionReviewableQuestIds,
  listMyHirerProofReviewableQuestIds,
} from "../myQuestService";
const mockListProofSubmissions = jest.fn();
const mockListCompletionConfirmations = jest.fn();

jest.mock("@/api/QuestApi", () => {
  const actual = jest.requireActual("@/api/QuestApi");
  return {
    ...actual,
    questApi: {
      ...actual.questApi,
      listProofSubmissions: (...args: unknown[]) =>
        mockListProofSubmissions(...args),
      listCompletionConfirmations: (...args: unknown[]) =>
        mockListCompletionConfirmations(...args),
    },
  };
});

describe("listMyHirerCompletionReviewableQuestIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns only proof-free Quests with pending completion confirmations", async () => {
    mockListCompletionConfirmations.mockImplementation(
      async (questId: string) =>
        questId === "pending"
          ? [{ reviewStatus: "COMPLETION_CONFIRMATION_PENDING" }]
          : [{ reviewStatus: "COMPLETION_CONFIRMATION_APPROVED" }]
    );

    await expect(
      listMyHirerCompletionReviewableQuestIds(["pending", "approved"])
    ).resolves.toEqual(["pending"]);
    expect(mockListCompletionConfirmations).toHaveBeenCalledTimes(2);
  });
});

describe("listMyHirerProofReviewableQuestIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns only IDs with a submitted pending proof", async () => {
    mockListProofSubmissions.mockImplementation(async (questId: string) => {
      if (questId === "pending") {
        return [
          { status: "PROOF_PENDING", submittedAt: "2026-10-01T10:00:00Z" },
        ];
      }
      if (questId === "draft-proof") {
        return [{ status: "PROOF_PENDING", submittedAt: null }];
      }
      return [
        { status: "PROOF_APPROVED", submittedAt: "2026-10-01T10:00:00Z" },
      ];
    });

    await expect(
      listMyHirerProofReviewableQuestIds(["pending", "draft-proof", "approved"])
    ).resolves.toEqual(["pending"]);
    expect(mockListProofSubmissions).toHaveBeenCalledTimes(3);
  });
});
