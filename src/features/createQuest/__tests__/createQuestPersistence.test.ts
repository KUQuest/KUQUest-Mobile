import * as SecureStore from "expo-secure-store";

import { authService } from "@/features/auth/AuthService";
import { initialDraft } from "../createQuestModel";
import {
  CREATE_QUEST_DRAFT_KEY,
  deleteQuestDraft,
  getQuestDraftStorageKey,
  loadQuestDraft,
  listQuestDrafts,
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
const storageKey = `${CREATE_QUEST_DRAFT_KEY}.account-42`;
const draftId = "draft-42";
const draftKey = `${storageKey}.${draftId}`;
const indexKey = `${storageKey}.index`;

const draft = {
  ...initialDraft,
  title: "Wash the shared fan",
  tag: "campus-life",
  description: "Clean the fan in the common room.",
  conditions: "The fan is clean and working.",
};

describe("create quest persistence", () => {
  beforeEach(async () => {
    await SecureStore.deleteItemAsync(indexKey);
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

    await expect(getQuestDraftStorageKey()).resolves.toBe(
      CREATE_QUEST_DRAFT_KEY
    );
  });

  test("round-trips a draft through its stable draft ID", async () => {
    await persistQuestDraft(storageKey, draftId, draft, 2, "DRAFT");

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      draftKey,
      JSON.stringify({ draft, step: 2, state: "DRAFT" })
    );
    await expect(loadQuestDraft(storageKey, draftId)).resolves.toEqual({
      draft,
      step: 2,
      state: "DRAFT",
    });
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(draftKey);
  });
  test("loads a legacy single draft through the mount read path", async () => {
    const legacySnapshot = { draft, step: 2, state: "DRAFT" as const };
    await SecureStore.setItemAsync(
      CREATE_QUEST_DRAFT_KEY,
      JSON.stringify(legacySnapshot)
    );

    await expect(loadQuestDraft(storageKey, draftId)).resolves.toEqual(
      legacySnapshot
    );
  });

  test("lists indexed drafts for the chooser", async () => {
    await persistQuestDraft(storageKey, draftId, draft, 2, "DRAFT");

    await expect(listQuestDrafts(storageKey)).resolves.toEqual([
      { id: draftId, snapshot: { draft, step: 2, state: "DRAFT" } },
    ]);
  });

  test("returns null for corrupt stored data", async () => {
    await SecureStore.setItemAsync(draftKey, "{not-json");

    await expect(loadQuestDraft(storageKey, draftId)).resolves.toBeNull();
  });

  test("deletes the exact draft from SecureStore", async () => {
    await persistQuestDraft(storageKey, draftId, draft, 1);
    await deleteQuestDraft(storageKey, draftId);

    await expect(loadQuestDraft(storageKey, draftId)).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(draftKey);
  });

  test("does not resurrect a deleted draft from legacy storage", async () => {
    await persistQuestDraft(storageKey, draftId, draft, 1);
    await SecureStore.setItemAsync(
      CREATE_QUEST_DRAFT_KEY,
      JSON.stringify({ draft, step: 1, state: "DRAFT" })
    );
    await deleteQuestDraft(storageKey, draftId);

    await expect(loadQuestDraft(storageKey, draftId)).resolves.toBeNull();
  });
});
