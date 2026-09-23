import {
  parseBoardPreviewState,
  type BoardPreviewState,
} from "../fixtures/questBoardHarness";
export type QuestDetailMode = "public" | "join" | "post";
export type QuestJoinStatus = "pending" | "accepted" | "history";

function singleRouteValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value) && value.length !== 1) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function parseSingleRouteParam(
  value: string | string[] | undefined
): string | undefined {
  const id = singleRouteValue(value)?.trim();
  return id || undefined;
}

export function parseQuestIntent(
  value: string | string[] | undefined
): "apply" | undefined {
  return singleRouteValue(value) === "apply" ? "apply" : undefined;
}

export function parseQuestDetailMode(
  value: string | string[] | undefined
): QuestDetailMode {
  const candidate = singleRouteValue(value);
  return candidate === "join" || candidate === "post" ? candidate : "public";
}

export function parseQuestJoinStatus(
  value: string | string[] | undefined
): QuestJoinStatus | undefined {
  const candidate = singleRouteValue(value);
  return candidate === "pending" ||
    candidate === "accepted" ||
    candidate === "history"
    ? candidate
    : undefined;
}

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
        ? parseSingleRouteParam(props.questId)
        : parseSingleRouteParam(params.id),
    studentId: props.studentId ?? parseSingleRouteParam(params.studentId),
    mode: props.mode ?? parseQuestDetailMode(params.mode),
    joinStatus: props.joinStatus ?? parseQuestJoinStatus(params.joinStatus),
    previewState: props.previewState ?? parseBoardPreviewState(params.preview),
    intent: props.intent ?? parseQuestIntent(params.intent),
  };
}
