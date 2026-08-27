import { getQuestAvailability } from './questBoardViewData';
import type { QuestBoardQuest } from './types';

export type QuestApplicationStatus = 'none' | 'pending' | 'accepted';
export type QuestApplicationOutcome = QuestApplicationStatus | 'full' | 'closed';

export interface QuestApplicationStore {
  readonly studentId: string;
  getStatus(questId: string): QuestApplicationStatus;
  setStatus(questId: string, status: Exclude<QuestApplicationStatus, 'none'>): void;
  clearStatus(questId: string): void;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

const storesByStudent = new Map<string, QuestApplicationStore>();

export function getQuestApplicationOutcome(quest: QuestBoardQuest, now = new Date()): Exclude<QuestApplicationOutcome, 'none'> {
  const availability = getQuestAvailability(quest, now);
  if (availability === 'full') return 'full';
  if (availability === 'closed') return 'closed';
  return quest.candidateMode === 'NO_CANDIDATE' ? 'accepted' : 'pending';
}

export function createQuestApplicationStore(studentId: string): QuestApplicationStore {
  const statuses = new Map<string, QuestApplicationStatus>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  return {
    studentId,
    getStatus: (questId) => statuses.get(questId) ?? 'none',
    setStatus: (questId, status) => {
      if (statuses.get(questId) === status) return;
      statuses.set(questId, status);
      notify();
    },
    clearStatus: (questId) => {
      if (!statuses.has(questId)) return;
      statuses.delete(questId);
      notify();
    },
    clear: () => {
      if (statuses.size === 0) return;
      statuses.clear();
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function getQuestApplicationStore(studentId: string): QuestApplicationStore {
  const existing = storesByStudent.get(studentId);
  if (existing) return existing;
  const store = createQuestApplicationStore(studentId);
  storesByStudent.set(studentId, store);
  return store;
}

export function resetQuestApplicationStatuses(studentId?: string): void {
  if (studentId) {
    storesByStudent.get(studentId)?.clear();
    return;
  }
  storesByStudent.forEach((store) => store.clear());
}
