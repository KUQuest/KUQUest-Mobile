import * as SecureStore from 'expo-secure-store';

import { authService } from '@/features/auth/AuthService';
import { initialDraft } from '../createQuestModel';
import {
  CREATE_QUEST_DRAFT_KEY,
  deleteQuestDraft,
  getQuestDraftStorageKey,
  loadQuestDraft,
  persistQuestDraft,
} from '../createQuestPersistence';

jest.mock('@/features/auth/AuthService', () => ({
  authService: {
    getSession: jest.fn(),
  },
}));

const mockedGetSession = authService.getSession as jest.MockedFunction<typeof authService.getSession>;
const storageKey = `${CREATE_QUEST_DRAFT_KEY}:account-42`;

const draft = {
  ...initialDraft,
  title: 'Wash the shared fan',
  tag: 'campus-life',
  description: 'Clean the fan in the common room.',
  conditions: 'The fan is clean and working.',
};

describe('create quest persistence', () => {
  beforeEach(async () => {
    await SecureStore.deleteItemAsync(storageKey);
    jest.clearAllMocks();
    mockedGetSession.mockResolvedValue(null);
  });

  test('uses an account-scoped SecureStore key when a session exists', async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: 'account-42',
        name: 'Test Student',
        email: 'student@ku.th',
        emailVerified: true,
        firstName: 'Test',
        lastName: 'Student',
        createdAt: '2026-08-12T09:00:00.000Z',
        updatedAt: '2026-08-12T09:00:00.000Z',
      },
    });

    await expect(getQuestDraftStorageKey()).resolves.toBe(storageKey);
  });

  test('falls back to the shared key when the session lookup fails', async () => {
    mockedGetSession.mockRejectedValue(new Error('session unavailable'));

    await expect(getQuestDraftStorageKey()).resolves.toBe(CREATE_QUEST_DRAFT_KEY);
  });

  test('round-trips a draft through SecureStore and ignores the legacy quest id', async () => {
    await persistQuestDraft(storageKey, draft, 2, 'DRAFT', 'legacy-quest-id');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(storageKey, JSON.stringify({ draft, step: 2, state: 'DRAFT' }));
    await expect(loadQuestDraft(storageKey, 'legacy-quest-id')).resolves.toEqual({ draft, step: 2, state: 'DRAFT' });
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(storageKey);
  });

  test('returns null for corrupt stored data', async () => {
    await SecureStore.setItemAsync(storageKey, '{not-json');

    await expect(loadQuestDraft(storageKey)).resolves.toBeNull();
  });

  test('deletes the draft from SecureStore', async () => {
    await persistQuestDraft(storageKey, draft, 1);
    await deleteQuestDraft(storageKey, 'legacy-quest-id');

    await expect(loadQuestDraft(storageKey)).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(storageKey);
  });
});
