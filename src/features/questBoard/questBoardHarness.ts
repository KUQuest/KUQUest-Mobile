import {
  questWorkflow,
  type QuestBoardEmptyModel,
  type QuestBoardErrorModel,
  type QuestBoardLoadingModel,
  type QuestBoardPreviewState,
  type QuestBoardReadyModel,
  type QuestBoardSurfaceModel,
  type QuestBoardUnavailableModel,
} from './questWorkflow';
import type { QuestBoardQuest } from './types';

export type BoardPreviewState = QuestBoardPreviewState;
export type QuestBoardModel = QuestBoardSurfaceModel;
export type {
  QuestBoardEmptyModel,
  QuestBoardErrorModel,
  QuestBoardLoadingModel,
  QuestBoardReadyModel,
  QuestBoardUnavailableModel,
};

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

export function createQuestBoardModel(previewState: BoardPreviewState): QuestBoardModel {
  return questWorkflow.getQuestBoardSurfaceModel(undefined, previewState);
}

export function getQuestDetailFixture(routeId: string | undefined, previewState?: BoardPreviewState): QuestBoardQuest | undefined {
  const quest = routeId ? questWorkflow.getQuestBoardQuest(routeId) : null;
  if (!quest) return undefined;
  if (previewState === 'full' || previewState === 'application-accepted') return { ...quest, acceptedParticipants: quest.headcount };
  if (previewState === 'closed') return { ...quest, deadline: '2026-08-11' };
  return quest;
}
