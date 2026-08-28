import { questFixtures } from './questFixtures';
import { questFixtureAdapter, toBoardQuest } from './questFixtureAdapter';
import { findQuestByRouteId } from './questRoute';
import type { QuestBoardQuest } from './types';

export type BoardPreviewState =
  | 'populated'
  | 'loading'
  | 'empty'
  | 'error'
  | 'application-pending'
  | 'application-accepted'
  | 'full'
  | 'closed';

export interface QuestBoardReadyModel {
  kind: 'ready';
  quests: QuestBoardQuest[];
}

export interface QuestBoardLoadingModel {
  kind: 'loading';
}

export interface QuestBoardEmptyModel {
  kind: 'empty';
}

export interface QuestBoardErrorModel {
  kind: 'error';
}

export interface QuestBoardUnavailableModel {
  kind: 'unavailable';
  availability: 'full' | 'closed';
  quest: QuestBoardQuest;
}

export type QuestBoardModel =
  | QuestBoardReadyModel
  | QuestBoardLoadingModel
  | QuestBoardEmptyModel
  | QuestBoardErrorModel
  | QuestBoardUnavailableModel;

export const previewOptions: {
  value: BoardPreviewState;
  labelKey: 'statePopulated' | 'stateLoading' | 'stateEmpty' | 'stateError' | 'statePending' | 'stateAccepted' | 'stateFull' | 'stateClosed';
}[] = [
  { value: 'populated', labelKey: 'statePopulated' },
  { value: 'loading', labelKey: 'stateLoading' },
  { value: 'empty', labelKey: 'stateEmpty' },
  { value: 'error', labelKey: 'stateError' },
  { value: 'application-pending', labelKey: 'statePending' },
  { value: 'application-accepted', labelKey: 'stateAccepted' },
  { value: 'full', labelKey: 'stateFull' },
  { value: 'closed', labelKey: 'stateClosed' },
];

export function parseBoardPreviewState(value: string | string[] | undefined): BoardPreviewState | undefined {
  if (Array.isArray(value) && value.length !== 1) return undefined;
  const candidate = Array.isArray(value) ? value[0] : value;
  return previewOptions.find((option) => option.value === candidate)?.value;
}

function createUnavailableQuest(state: 'full' | 'closed'): QuestBoardQuest {
  const quest = questFixtures[0];
  return state === 'full'
    ? { ...quest, acceptedParticipants: quest.headcount }
    : { ...quest, deadline: '2026-08-11' };
}

export function createQuestBoardModel(previewState: BoardPreviewState): QuestBoardModel {
  if (previewState === 'loading') return { kind: 'loading' };
  if (previewState === 'empty') return { kind: 'empty' };
  if (previewState === 'error') return { kind: 'error' };
  if (previewState === 'full' || previewState === 'closed') {
    return { kind: 'unavailable', availability: previewState, quest: createUnavailableQuest(previewState) };
  }
  return { kind: 'ready', quests: questFixtures.filter((quest) => !quest.prototypeOnly) };
}

export function getQuestDetailFixture(routeId: string | undefined, previewState?: BoardPreviewState): QuestBoardQuest | undefined {
  const quest = findQuestByRouteId(questFixtures, routeId);
  if (!quest) {
    const canonicalState = routeId ? questFixtureAdapter.getState(routeId) : null;
    return canonicalState ? toBoardQuest(canonicalState) : undefined;
  }
  if (previewState === 'full' || previewState === 'application-accepted') return { ...quest, acceptedParticipants: quest.headcount };
  if (previewState === 'closed') return { ...quest, deadline: '2026-08-11' };
  return quest;
}
