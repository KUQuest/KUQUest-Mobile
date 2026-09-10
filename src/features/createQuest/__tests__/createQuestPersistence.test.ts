import * as SecureStore from "expo-secure-store";

import { authService } from "@/features/auth/AuthService";
import { initialDraft, QUEST_DRAFT_SCHEMA_VERSION } from "../createQuestModel";
import {
  CREATE_QUEST_DRAFT_KEY,
  deleteQuestDraft,
  getQuestDraftStorageKey,
  loadQuestDraft,
  persistQuestDraft,
} from "../createQuestPersistence";

jest.mock("@/features/auth/AuthService", () => ({
  authService: {
    getSession: jest.fn(),
  },
}));

const mockedGetSession = authService.getSession as jest.MockedFunction<
  typeof authService.getSession
>;
const storageKey = `${CREATE_QUEST_DRAFT_KEY}-account-42`;
const draft = {
  ...initialDraft,
  title: "Wash the shared fan",
  tagId: "58818dc3-6dad-424f-8dfd-d20b6747aeb3",
  description: "Clean the fan in the common room.",
  conditionItems: ["The fan is clean and working."],
  startTime: "2099-08-26T09:00:00.000+07:00",
  dueAt: "2099-08-27T12:00:00.000+07:00",
  questFundingTotal: "250.50",
};

describe("create quest persistence", () => {
  beforeEach(async () => {
    await SecureStore.deleteItemAsync(storageKey);
    jest.clearAllMocks();
    mockedGetSession.mockResolvedValue(null);
  });

  test("uses an account-scoped SecureStore key when a session exists", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "account-42",
        name: "Test Student",
        email: "student@ku.th",
        emailVerified: true,
        firstName: "Test",
        lastName: "Student",
        createdAt: "2026-08-12T09:00:00.000Z",
        updatedAt: "2026-08-12T09:00:00.000Z",
      },
    });

    await expect(getQuestDraftStorageKey()).resolves.toBe(storageKey);
  });

  test("falls back to the shared key when the session lookup fails", async () => {
    mockedGetSession.mockRejectedValue(new Error("session unavailable"));

    await expect(getQuestDraftStorageKey()).resolves.toBe(CREATE_QUEST_DRAFT_KEY);
  });

  test("persists and restores a versioned v2 draft", async () => {
    await persistQuestDraft(storageKey, draft, 2, "DRAFT");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify({
        version: QUEST_DRAFT_SCHEMA_VERSION,
        draft,
        step: 2,
        state: "DRAFT",
      }),
    );
    await expect(loadQuestDraft(storageKey)).resolves.toEqual({
      version: QUEST_DRAFT_SCHEMA_VERSION,
      draft,
      step: 2,
      state: "DRAFT",
    });
  });

  test("marks an old draft for review instead of inferring v2 fields", async () => {
    await SecureStore.setItemAsync(
      storageKey,
      JSON.stringify({
        title: "Legacy Quest",
        conditions: "Old condition",
        wage: "250",
        mode: "NO_CANDIDATE",
        startDate: "2099-08-26",
      }),
    );

    await expect(loadQuestDraft(storageKey)).resolves.toEqual({
      requiresReview: true,
      reason: "LEGACY_SCHEMA",
    });
  });

  test("marks a future version as unsupported", async () => {
    await SecureStore.setItemAsync(
      storageKey,
      JSON.stringify({ version: QUEST_DRAFT_SCHEMA_VERSION + 1, draft }),
    );

    await expect(loadQuestDraft(storageKey)).resolves.toEqual({
      requiresReview: true,
      reason: "UNSUPPORTED_SCHEMA",
    });
  });

  test("marks a malformed v2 draft for review without applying defaults", async () => {
    await SecureStore.setItemAsync(
      storageKey,
      JSON.stringify({
        version: QUEST_DRAFT_SCHEMA_VERSION,
        draft: { ...draft, conditionItems: "old text" },
      }),
    );

    await expect(loadQuestDraft(storageKey)).resolves.toEqual({
      requiresReview: true,
      reason: "INVALID_V2_DRAFT",
    });
  });

  test("returns null for corrupt stored data", async () => {
    await SecureStore.setItemAsync(storageKey, "{not-json");

    await expect(loadQuestDraft(storageKey)).resolves.toBeNull();
  });

  test("restores a shared v2 draft when the account key is empty", async () => {
    const snapshot = JSON.stringify({
      version: QUEST_DRAFT_SCHEMA_VERSION,
      draft,
      step: 2,
      state: "DRAFT",
    });
    (SecureStore.getItemAsync as jest.Mock)
      .mockImplementationOnce(async () => null)
      .mockImplementationOnce(async () => snapshot);

    await expect(loadQuestDraft(storageKey)).resolves.toEqual({
      version: QUEST_DRAFT_SCHEMA_VERSION,
      draft,
      step: 2,
      state: "DRAFT",
    });
  });

  test("deletes the draft from SecureStore", async () => {
    await persistQuestDraft(storageKey, draft, 1);
    await deleteQuestDraft(storageKey);

    await expect(loadQuestDraft(storageKey)).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(storageKey);
  });
});
