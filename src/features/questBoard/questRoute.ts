import type { QuestBoardQuest } from './types';

export type QuestDetailMode = 'public' | 'join' | 'post';
export type QuestJoinStatus = 'pending' | 'accepted' | 'history';

export function parseQuestRouteId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value) && value.length !== 1) return undefined;
  const candidate = Array.isArray(value) ? value[0] : value;
  const id = candidate?.trim();
  return id || undefined;
}

export function parseStudentId(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value) && value.length !== 1) return undefined;
  const candidate = Array.isArray(value) ? value[0] : value;
  const id = candidate?.trim();
  return id || undefined;
}

export function parseQuestIntent(value: string | string[] | undefined): 'apply' | undefined {
  if (Array.isArray(value) && value.length !== 1) return undefined;
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'apply' ? 'apply' : undefined;
}

export function parseQuestDetailMode(value: string | string[] | undefined): QuestDetailMode {
  if (Array.isArray(value) && value.length !== 1) return 'public';
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'join' || candidate === 'post' ? candidate : 'public';
}

export function parseQuestJoinStatus(value: string | string[] | undefined): QuestJoinStatus | undefined {
  if (Array.isArray(value) && value.length !== 1) return undefined;
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'pending' || candidate === 'accepted' || candidate === 'history' ? candidate : undefined;
}

export function findQuestByRouteId(quests: QuestBoardQuest[], routeId: string | undefined): QuestBoardQuest | undefined {
  if (!routeId) return undefined;
  return quests.find((quest) => quest.id === routeId);
}
