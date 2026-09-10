import * as SecureStore from 'expo-secure-store';

import { authService } from '@/features/auth/AuthService';
import {
  parseStoredQuestSnapshot,
  QUEST_DRAFT_SCHEMA_VERSION,
  type QuestDraft,
  type QuestDraftSnapshot,
  type QuestDraftStep,
  type QuestDraftState,
} from './createQuestModel';

export const CREATE_QUEST_DRAFT_KEY = 'kuquest.create-quest-draft';

export async function getQuestDraftStorageKey(): Promise<string> {
  try {
    const session = await authService.getSession();
    return session?.user.id ? `${CREATE_QUEST_DRAFT_KEY}-${session.user.id}` : CREATE_QUEST_DRAFT_KEY;
  } catch {
    return CREATE_QUEST_DRAFT_KEY;
  }
}

export async function loadQuestDraft(storageKey: string, _legacyQuestId?: string): Promise<QuestDraftSnapshot | null> {
  const storedDraft = await SecureStore.getItemAsync(storageKey);
  if (storedDraft) return parseStoredQuestSnapshot(storedDraft);

  if (storageKey === CREATE_QUEST_DRAFT_KEY) return null;
  const legacyDraft = await SecureStore.getItemAsync(CREATE_QUEST_DRAFT_KEY);
  return legacyDraft ? parseStoredQuestSnapshot(legacyDraft) : null;
}

export async function persistQuestDraft(
  storageKey: string,
  draft: QuestDraft,
  step: QuestDraftStep,
  state: QuestDraftState = 'DRAFT',
  _legacyQuestId?: string,
): Promise<void> {
  await SecureStore.setItemAsync(
    storageKey,
    JSON.stringify({ version: QUEST_DRAFT_SCHEMA_VERSION, draft, step, state }),
  );
}

export async function deleteQuestDraft(storageKey: string, _legacyQuestId?: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey);
}
