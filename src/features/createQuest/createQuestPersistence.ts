import { secureStorage } from "@/infrastructure/storage/keyValueStorage";

import { authService } from "@/features/auth/AuthService";
import {
  parseStoredQuestSnapshot,
  type QuestDraft,
  type QuestDraftState,
  type QuestDraftStep,
  type StoredQuestDraft,
} from "./createQuestModel";

export const CREATE_QUEST_DRAFT_KEY = "kuquest.create-quest-draft";

export type QuestDraftSnapshot = StoredQuestDraft;
export type QuestDraftListItem = {
  id: string;
  snapshot: QuestDraftSnapshot;
};

function getDraftKey(storageKey: string, draftId: string): string {
  return `${storageKey}.${draftId}`;
}

function getDraftIndexKey(storageKey: string): string {
  return `${storageKey}.index`;
}

export function createQuestDraftId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

async function readDraftIds(storageKey: string): Promise<string[]> {
  const storedIndex = await secureStorage.get(getDraftIndexKey(storageKey));
  if (!storedIndex) return [];

  try {
    const parsed: unknown = JSON.parse(storedIndex);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

async function writeDraftIds(storageKey: string, draftIds: string[]) {
  await secureStorage.set(
    getDraftIndexKey(storageKey),
    JSON.stringify([...new Set(draftIds)])
  );
}

export async function getQuestDraftStorageKey(): Promise<string> {
  try {
    const session = await authService.getSession();
    return session?.user.id
      ? `${CREATE_QUEST_DRAFT_KEY}.${session.user.id}`
      : CREATE_QUEST_DRAFT_KEY;
  } catch {
    return CREATE_QUEST_DRAFT_KEY;
  }
}

export async function loadQuestDraft(
  storageKey: string,
  draftId?: string
): Promise<QuestDraftSnapshot | null> {
  if (!draftId) return null;
  const storedDraft = await secureStorage.get(getDraftKey(storageKey, draftId));
  return storedDraft ? parseStoredQuestSnapshot(storedDraft) : null;
}

export async function listQuestDrafts(
  storageKey: string
): Promise<QuestDraftListItem[]> {
  const draftIds = await readDraftIds(storageKey);
  if (draftIds.length === 0) {
    const legacyValue = await secureStorage.get(storageKey);
    const legacySnapshot = legacyValue
      ? parseStoredQuestSnapshot(legacyValue)
      : null;
    if (legacySnapshot) {
      const migratedId = createQuestDraftId();
      await persistQuestDraft(
        storageKey,
        migratedId,
        legacySnapshot.draft,
        legacySnapshot.step,
        legacySnapshot.state
      );
      await secureStorage.remove(storageKey);
      return [{ id: migratedId, snapshot: legacySnapshot }];
    }
  }

  const drafts = await Promise.all(
    draftIds.map(async (id) => {
      const snapshot = await loadQuestDraft(storageKey, id);
      return snapshot ? { id, snapshot } : null;
    })
  );
  return drafts.filter((item): item is QuestDraftListItem => item !== null);
}

export async function persistQuestDraft(
  storageKey: string,
  draftId: string,
  draft: QuestDraft,
  step: QuestDraftStep,
  state: QuestDraftState = "DRAFT"
): Promise<void> {
  const draftIds = await readDraftIds(storageKey);
  await secureStorage.set(
    getDraftKey(storageKey, draftId),
    JSON.stringify({ draft, step, state })
  );
  if (!draftIds.includes(draftId)) {
    await writeDraftIds(storageKey, [...draftIds, draftId]);
  }
}

export async function deleteQuestDraft(
  storageKey: string,
  draftId: string
): Promise<void> {
  await secureStorage.remove(getDraftKey(storageKey, draftId));
  const draftIds = await readDraftIds(storageKey);
  await writeDraftIds(
    storageKey,
    draftIds.filter((currentId) => currentId !== draftId)
  );
}
