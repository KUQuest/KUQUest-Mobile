import {
  parseBoardPreviewState,
  type BoardPreviewState,
} from "../questBoardHarness";
import {
  parseQuestDetailMode,
  parseQuestIntent,
  parseQuestJoinStatus,
  parseQuestRouteId,
  parseStudentId,
  type QuestDetailMode,
  type QuestJoinStatus,
} from "../questRoute";

export interface QuestDetailScreenProps {
  previewState?: BoardPreviewState;
  questId?: string;
  studentId?: string;
  mode?: QuestDetailMode;
  joinStatus?: QuestJoinStatus;
  intent?: "apply";
}

export interface QuestDetailRouteParams {
  id?: string | string[];
  intent?: string | string[];
  preview?: string | string[];
  mode?: string | string[];
  joinStatus?: string | string[];
  studentId?: string | string[];
}

export interface ResolvedQuestDetailRoute {
  questId?: string;
  studentId?: string;
  mode: QuestDetailMode;
  joinStatus?: QuestJoinStatus;
  previewState?: BoardPreviewState;
  intent?: "apply";
}

export function resolveQuestDetailRoute(
  params: QuestDetailRouteParams,
  props: QuestDetailScreenProps = {}
): ResolvedQuestDetailRoute {
  return {
    questId:
      props.questId !== undefined
        ? parseQuestRouteId(props.questId)
        : parseQuestRouteId(params.id),
    studentId: props.studentId ?? parseStudentId(params.studentId),
    mode: props.mode ?? parseQuestDetailMode(params.mode),
    joinStatus: props.joinStatus ?? parseQuestJoinStatus(params.joinStatus),
    previewState: props.previewState ?? parseBoardPreviewState(params.preview),
    intent: props.intent ?? parseQuestIntent(params.intent),
  };
}
