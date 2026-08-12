import { getQuestAvailability } from './questBoardViewData';
import type { QuestBoardQuest } from './types';

export type QuestApplicationStatus = 'none' | 'pending' | 'accepted';
export type QuestApplicationOutcome = QuestApplicationStatus | 'full' | 'closed';

export interface QuestApplicationStore {
  readonly studentId: string;
  getStatus(questId: string): QuestApplicationStatus;
  setStatus(questId: string, status: Exclude<QuestApplicationStatus, 'none'>): void;
  clear(): void;
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
  return {
    studentId,
    getStatus: (questId) => statuses.get(questId) ?? 'none',
    setStatus: (questId, status) => statuses.set(questId, status),
    clear: () => statuses.clear(),
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
