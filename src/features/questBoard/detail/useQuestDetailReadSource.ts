import { useCallback, useMemo } from "react";

import {
  useLiveQuestSnapshotQuery,
  useQuestDetailQuery,
} from "../api/questBoardQueries";
import {
  liveQuestService,
  type LiveQuestSnapshot,
} from "../live/liveQuestService";
import {
  getQuestDetailFixture,
  type BoardPreviewState,
} from "../fixtures/questBoardHarness";
import { questWorkflow } from "../workflow/questWorkflow";
import {
  getQuestDetailProjection,
  type QuestDetailProjection,
} from "./questDetailProjection";
import type { QuestBoardQuest, QuestDetailState } from "../domain/types";

export type QuestDetailReadSource =
  | {
      kind: "preview";
      state: QuestDetailState | null;
    }
  | {
      kind: "live-snapshot";
      snapshot: LiveQuestSnapshot | null;
    }
  | {
      kind: "live-detail";
    };

export interface QuestDetailReadModel {
  source: QuestDetailReadSource;
  quest: QuestBoardQuest | null;
  projection: QuestDetailProjection | null;
  pending: boolean;
  error: unknown;
  refreshing: boolean;
  refresh: () => Promise<unknown>;
}

interface QuestDetailReadSourceParams {
  questId?: string;
  viewerId: string;
  previewState?: BoardPreviewState;
  explicitPreview: boolean;
  sessionReady: boolean;
}

export function useQuestDetailReadSource({
  questId,
  viewerId,
  previewState,
  explicitPreview,
  sessionReady,
}: QuestDetailReadSourceParams): QuestDetailReadModel {
  const liveSnapshotAvailable =
    typeof liveQuestService.getLiveSnapshot === "function";
  const canSelectLiveSnapshot =
    liveSnapshotAvailable && (!sessionReady || Boolean(viewerId));
  const liveSnapshotQuery = useLiveQuestSnapshotQuery(
    questId ?? null,
    viewerId || null,
    {},
    !explicitPreview && canSelectLiveSnapshot && sessionReady
  );
  const questDetailQuery = useQuestDetailQuery(
    questId ?? null,
    !explicitPreview && !canSelectLiveSnapshot
  );

  const liveSnapshot = liveSnapshotQuery.data ?? null;
  const fixtureState =
    explicitPreview && questId
      ? questWorkflow.getQuestDetailState(questId, viewerId)
      : null;
  const fixtureProjection = fixtureState
    ? getQuestDetailProjection(fixtureState, viewerId, questWorkflow.getNow())
    : null;
  const liveProjection = liveSnapshot
    ? getQuestDetailProjection(liveSnapshot, viewerId)
    : null;
  const fixtureQuest = explicitPreview
    ? (getQuestDetailFixture(questId, previewState) ?? null)
    : null;
  const liveQuestCandidate =
    liveProjection?.quest ?? questDetailQuery.data ?? null;
  const liveQuest =
    questId && liveQuestCandidate?.id === questId ? liveQuestCandidate : null;
  const refresh = useCallback(async (): Promise<unknown> => {
    if (explicitPreview) return undefined;
    if (canSelectLiveSnapshot) return liveSnapshotQuery.refetch();
    return questDetailQuery.refetch();
  }, [
    canSelectLiveSnapshot,
    explicitPreview,
    liveSnapshotQuery,
    questDetailQuery,
  ]);

  return useMemo(() => {
    if (explicitPreview) {
      return {
        source: {
          kind: "preview" as const,
          state: fixtureState,
        },
        quest: fixtureQuest,
        projection: fixtureProjection,
        pending: previewState === "loading",
        error:
          previewState === "error" ? new Error("Preview unavailable") : null,
        refreshing: false,
        refresh,
      };
    }

    if (canSelectLiveSnapshot) {
      return {
        source: {
          kind: "live-snapshot" as const,
          snapshot: liveSnapshot,
        },
        quest: liveQuest,
        projection: liveProjection,
        pending: Boolean(
          questId && (!sessionReady || liveSnapshotQuery.isPending)
        ),
        error: liveSnapshotQuery.error,
        refreshing: liveSnapshotQuery.isRefetching,
        refresh,
      };
    }

    return {
      source: { kind: "live-detail" as const },
      quest: liveQuest,
      projection: null,
      pending: Boolean(questId && questDetailQuery.isPending),
      error: questDetailQuery.error,
      refreshing: questDetailQuery.isRefetching,
      refresh,
    };
  }, [
    explicitPreview,
    fixtureProjection,
    fixtureQuest,
    fixtureState,
    liveProjection,
    liveQuest,
    liveSnapshot,
    canSelectLiveSnapshot,
    liveSnapshotQuery.error,
    liveSnapshotQuery.isPending,
    liveSnapshotQuery.isRefetching,
    previewState,
    questDetailQuery.error,
    questDetailQuery.isPending,
    questDetailQuery.isRefetching,
    questId,
    refresh,
    sessionReady,
  ]);
}
