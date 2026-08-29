import * as SecureStore from 'expo-secure-store';

import { authService } from '@/features/auth/AuthService';
import { parseStoredQuestSnapshot, type QuestDraft, type QuestDraftStep, type QuestDraftState, type StoredQuestDraft } from './createQuestModel';

export const CREATE_QUEST_DRAFT_KEY = 'kuquest.create-quest-draft';

export type QuestDraftSnapshot = StoredQuestDraft;

export async function getQuestDraftStorageKey(): Promise<string> {
  try {
    const session = await authService.getSession();
    return session?.user.id ? `${CREATE_QUEST_DRAFT_KEY}:${session.user.id}` : CREATE_QUEST_DRAFT_KEY;
  } catch {
    return CREATE_QUEST_DRAFT_KEY;
  }
}

export async function loadQuestDraft(storageKey: string, _legacyQuestId?: string): Promise<QuestDraftSnapshot | null> {
  const storedDraft = await SecureStore.getItemAsync(storageKey);
  return storedDraft ? parseStoredQuestSnapshot(storedDraft) : null;
}

export async function persistQuestDraft(
  storageKey: string,
  draft: QuestDraft,
  step: QuestDraftStep,
  state: QuestDraftState = 'DRAFT',
  _legacyQuestId?: string,
): Promise<void> {
  await SecureStore.setItemAsync(storageKey, JSON.stringify({ draft, step, state }));
}

export async function deleteQuestDraft(storageKey: string, _legacyQuestId?: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey);
}
